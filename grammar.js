/**
 * @file Mylang grammar for tree-sitter
 * @author Jan Hudler
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  postop: 40,
  preop: 30,
  initializer_with_lhs: 21,
  initializer: 20,
  binop_mul: 19,
  binop_add: 18,
  binop_shift: 17,
  binop_bitand: 16,
  binop_bitxor: 15,
  binop_bitor: 14,
  binop_cmp: 13,
  binop_and: 12,
  binop_or: 11,
  range_with_start: 10,
  range: 9,
  pipe: 5,
  decl_ty: 4,
  assign: 3,
  decl: 2,
  if: 1,
  min: 0,
};

const escape_sequence = token.immediate(seq(
  '\\',
  choice(
    /[^xu]/,
    /u[0-9a-fA-F]{4}/,
    /u\{[0-9a-fA-F]+\}/,
    /x[0-9a-fA-F]{2}/,
  ),
));

module.exports = grammar({
  name: "mylang",

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  externals: $ => [
    $.string_content,
    $._raw_string_literal_start,
    $.raw_string_literal_content,
    $._raw_string_literal_end,
    $.float_literal,
    $._outer_block_doc_comment_marker,
    $._inner_block_doc_comment_marker,
    $._block_comment_content,
    $._line_doc_content,
    $._error_sentinel,
  ],

  conflicts: $ => [],

  word: $ => $._ident_like,

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => sep(repeat(";"), $._expr),

    _value: $ => choice(
      $._ident,
      $._literal,
      $.ptr_ty,
      //$.mut_ptr_ty,
      $.slice_ty,
      $.array_ty,
      $.option_ty,
      $.fn,
      $.parenthesis,
      // $.block,
      $.struct_def,
      $.union_def,
      $.enum_def,
      $.pos_initializer,
      $.named_initializer,
      $.array_initializer,
    ),

    _expr_except_block: $ => prec(-1, choice(
      $._value,
      $.dot,
      $.index,
      $.call,
      $.preop,
      $.postop,
      $.binop,
      $.range,
      $.assign,
      $.binop_assign,
      $.decl,
      $.if,
      $.match,
      $.for,
      $.while,
      // catch
      $.pipe,
      $.defer,
      $.return,
      $.break,
      $.continue,
      $.unsafe,
      $.directive,
      "nil", // TODO: remove this
    )),

    _expr: $ => choice(
      $._expr_except_block,
      $.block,
    ),

    _ident: $ => choice(
      alias(choice(
        "void",
        "never",
        /u\d+/,
        /i\d+/,
        "bool",
        "f32",
        "f64",
      ), $.primitive_type),
      alias($._ident_like, $.ident),
    ),
    _ident_like: _ => /[_a-zA-Z]\w*/,

    _literal: $ => choice(
      $.char_literal,
      $.string_literal,
      $.multilinestring_literal,
      $.boolean_literal,
      $.integer_literal,
      $.float_literal,
    ),
    char_literal: _ => token(seq(
      optional('b'),
      '\'',
      optional(choice(
        escape_sequence,
        /[^\\']/,
      )),
      '\'',
    )),
    string_literal: $ => seq(
      alias(/[bc]?"/, '"'),
      repeat(choice(
        alias(escape_sequence, $.escape_sequence),
        $.string_content,
      )),
      token.immediate('"'),
    ),
    multilinestring_literal: $ => prec.right(sep1($._newline, seq("\\\\", /.*/))),
    _newline: _ => /\n|\r|\r\n/,

    boolean_literal: _ => choice("true", "false"),
    integer_literal: _ => /(0b|0o|0x)?[0-9a-fA-F][0-9a-fA-F_]*/,
    float_literal: _ => /\d+\.\d+/,

    ptr_ty: $ => prec(PREC.preop, seq("*", optional("mut"), field("pointee_ty", $._expr))), // parsed via preop > deref
    slice_ty: $ => prec(PREC.preop, seq("[", "]", optional("mut"), field("elem_ty", $._expr))),
    array_ty: $ => prec(PREC.preop, seq("[", $._expr, "]", field("elem_ty", $._expr))),
    option_ty: $ => prec(PREC.preop, seq("?", $._expr)),

    fn: $ => prec.right(2, seq(
      field("params", choice(
        blank(),
        $._ident,
        seq("(", optional(alias($._decl_list1, $.params)), ")")
      )),
      "->",
      seq(
        optional(field("ret_ty", $._expr_except_block)),
        field("body", $._expr),
      ),
    )),

    parenthesis: $ => prec(0, seq("(", $._expr, ")")),
    block: $ => seq("{", sep(optional(";"), $._expr), "}"),

    struct_def: $ => seq(
      "struct",
      "{",
      sep(optional(choice(",", ";")), $._expr),
      "}",
    ),
    union_def: $ => seq(
      "union",
      "{",
      sep(optional(choice(",", ";")), $._expr),
      "}",
    ),
    enum_def: $ => seq(
      "enum",
      "{",
      sep(
        optional(choice(",", ";")),
        choice(
          alias($._enum_def_variant, $.variant),
          $._expr,
        ),
      ),
      "}",
    ),
    _enum_def_variant: $ => prec.right(2, seq(
      field("name", $._ident),
      optional(seq("(", field("ty", $._expr), ")")),
      optional(seq("=", field("tag", $._expr)))
    )),

    pos_initializer: $ => initializer(
      field("lhs", $._expr),
      ".(",
      sep(",", alias($.arg, $.field)),
      ")",
    ),
    named_initializer: $ => initializer(
      field("lhs", $._expr),
      ".{",
      sep(",", alias($._named_initializer_arg, $.field)),
      "}",
    ),
    _named_initializer_arg: $ => seq(field("var", $._ident), optional(seq("=", field("val", $._expr)))),
    array_initializer: $ => initializer(
      field("lhs", $._expr),
      ".[",
      sep(",", $._expr),
      "]",
    ),

    dot: $ => prec(PREC.postop, seq(field("lhs", $._expr), ".", field("rhs", $._ident))),
    index: $ => prec(PREC.postop, seq(field("lhs", $._expr), "[", field("idx", $._expr), "]")),
    call: $ => prec(PREC.postop, seq(
      field("fn", $._expr),
      token(prec(2, "(")),
      sep(",", $.arg),
      ")",
    )),
    arg: $ => choice(
      field("val", $._expr),
      prec(2, seq(field("var", $._ident), "=", field("val", $._expr))),
    ),

    preop: $ => prec(PREC.preop, seq(
      choice("&", seq("&", "mut"), /* "*", */ "!", "-", "xx"),
      $._expr,
    )),
    postop: $ => prec.left(PREC.postop, seq(
      $._expr,
      choice(
        prec.right(seq(".&", optional("mut"))),
        ".*",
        "?",
      ),
    )),
    binop: $ => choice(
      prec.left(PREC.binop_mul, seq($._expr, choice("*", "/", "%"), $._expr)),
      prec.left(PREC.binop_add, seq($._expr, choice("+", "-"), $._expr)),
      prec.left(PREC.binop_shift, seq($._expr, choice("<<", ">>"), $._expr)),
      prec.left(PREC.binop_bitand, seq($._expr, "&", $._expr)),
      prec.left(PREC.binop_bitxor, seq($._expr, "^", $._expr)),
      prec.left(PREC.binop_bitor, seq($._expr, "|", $._expr)),
      prec.left(PREC.binop_cmp, seq($._expr, choice("==", "!=", "<", "<=", ">", ">="), $._expr)),
      prec.left(PREC.binop_and, seq($._expr, choice("&&", "and"), $._expr)),
      prec.left(PREC.binop_or, seq($._expr, choice("||", "or"), $._expr)),
    ),
    range: $ => choice(
      prec(PREC.range_with_start, seq(field("start", $._expr), $._range_tail)),
      prec(PREC.range, $._range_tail),
    ),
    _range_tail: $ => prec.right(PREC.range, seq(
      choice("..", "..="),
      optional(field("end", $._expr)),
    )),
    assign: $ => prec.right(PREC.assign, seq(
      field("lhs", $._expr),
      "=",
      field("rhs", $._expr),
    )),
    binop_assign: $ => prec.right(PREC.assign, seq(
      field("lhs", $._expr),
      choice("*=", "/=", "%=", "+=", "-=", "<<=", ">>=", "&=", "^=", "|=", "&&=", "||="),
      field("rhs", $._expr),
    )),

    decl: $ => prec.right(PREC.decl, seq(
      repeat(choice("pub", "mut", "rec", "static", "extern")),
      field("name", choice($._ident, $.dot)),
      choice(
        seq(":", field("ty", $._expr), optional(seq(
          choice(token(prec(PREC.decl_ty, "=")), field("is_const", token(prec(PREC.decl_ty, ":")))),
          field("init", $._expr)),
        )),
        seq(choice(":=", field("is_const", "::")), field("init", $._expr)),
      ),
    )),
    /** use like this: `optional($._decl_list1)` */
    _decl_list1: $ => prec(2, sep1(choice(",", ";"), $.decl)),

    if: $ => prec.right(seq(
      "if",
      field("cond", $._expr),
      optional(choice("then", "do")),
      field("then", $._expr),
      optional(seq("else", field("else", $._expr)))
    )),
    match: $ => seq(
      "match",
      "TODO",
    ),

    for: $ => seq(
      "for",
      field("iter_var", $._ident),
      "in",
      field("source", $._expr),
      optional("do"),
      field("body", $._expr),
    ),
    while: $ => seq(
      "while",
      field("condition", $._expr),
      optional("do"),
      field("body", $._expr),
    ),

    // catch
    pipe: $ => prec.left(PREC.pipe, seq(
      field("source", $._expr),
      "|>",
      choice(
        $.pipe_for,
        $._expr,
      ),
    )),
    pipe_for: $ => seq(
      "for",
      field("iter_var", $._ident),
      optional("do"),
      field("body", $._expr),
    ),

    defer: $ => seq("defer", $._expr),
    return: $ => seq("return", $._expr),
    break: $ => prec.right(seq("break", optional($._expr))),
    continue: $ => prec.right(seq("continue", optional($._expr))),
    unsafe: $ => seq("unsafe", $._expr),

    directive: $ => prec.right(seq(
      "#",
      field("name", $._ident),
      optional(alias($._value, $.value)),
    )),

    // -------

    comment: $ => choice($.line_comment, $.block_comment),

    line_comment: $ => seq(
      '//',
      choice(
        seq(token.immediate(prec(2, "//")), /.*/),
        // The trailing '\n' in doc_comments is needed for correct highlight injections.
        seq(token.immediate(prec(2, choice("!", "/"))), alias(token.immediate(/.*\n?/), $.doc_comment)),
        /.*/,
      ),
    ),

    block_comment: $ => seq(
      '/*',
      optional(
        choice(
          // Documentation block comments: /** docs */ or /*! docs */
          seq(
            $._block_doc_comment_marker,
            optional(field('doc', alias($._block_comment_content, $.doc_comment))),
          ),
          // Non-doc block comments
          $._block_comment_content,
        ),
      ),
      '*/',
    ),

    _block_doc_comment_marker: $ => choice(
      field('outer', alias($._outer_block_doc_comment_marker, $.outer_doc_comment_marker)),
      field('inner', alias($._inner_block_doc_comment_marker, $.inner_doc_comment_marker)),
    ),
  }
});

/**
 * @param {RuleOrLiteral} sep
 * @param {RuleOrLiteral} rule
 */
function sep1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)), optional(sep));
}

/**
 * @param {RuleOrLiteral} sep
 * @param {RuleOrLiteral} rule
 */
function sep(sep, rule) {
  return optional(sep1(sep, rule));
}

/**
 * @param {RuleOrLiteral} lhs
 * @param {...RuleOrLiteral} body
 */
function initializer(lhs, ...body) {
  return choice(
    prec(PREC.initializer_with_lhs, seq(lhs, ...body)),
    prec(PREC.initializer, seq(...body)),
  )
}
