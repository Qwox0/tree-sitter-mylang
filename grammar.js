/**
 * @file Mylang grammar for tree-sitter
 * @author Jan Hudler
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  postop: 22,
  preop: 21,
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
  range: 10,
  // todo binop
  decl_ty: 4,
  pipe: 4,
  assign: 3,
  var_decl: 2,
  if: 1,
  min: 0,
};

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

  conflicts: $ => [[
    $.pos_initializer,
  ], [
    $.named_initializer,
  ], [
    $.array_initializer,
  ], [
    $.range,
  ]],

  word: $ => $._ident_like,

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => sep(repeat(";"), $._expr),

    _expr: $ => choice(
      $._ident,
      $._literal,
      $.ptr_ty,
      //$.mut_ptr_ty,
      $.slice_ty,
      $.array_ty,
      $.option_ty,
      $.fn,
      $.parenthesis,
      $.block,
      $.struct_def,
      $.union_def,
      $.enum_def,
      $.pos_initializer,
      $.named_initializer,
      $.array_initializer,
      $.dot,
      $.index,
      $.call,
      $.preop,
      $.postop,
      $.binop,
      $.range,
      $.assign,
      $.binop_assign,
      $.var_decl,
      $.extern_decl,
      $.if,
      $.match,
      $.for,
      $.while,
      // catch
      // pipe?
      $.defer,
      $.return,
      $.break,
      $.continue,
      $.unsafe,
      "nil", // TODO: remove this
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
      $.boolean_literal,
      $.integer_literal,
      $.float_literal,
    ),
    char_literal: _ => seq("'", /./, "'"),
    string_literal: _ => seq("\"", /[^"]*/, "\""),

    boolean_literal: _ => choice("true", "false"),
    integer_literal: _ => /-?\d+/,
    float_literal: _ => /-?\d+\.\d+/,

    ptr_ty: $ => prec(PREC.preop, seq("*", optional("mut"), field("pointee_ty", $._expr))), // parsed via preop > deref
    slice_ty: $ => prec(PREC.preop, seq("[", "]", optional("mut"), field("elem_ty", $._expr))),
    array_ty: $ => prec(PREC.preop, seq("[", $._expr, "]", field("elem_ty", $._expr))),
    option_ty: $ => prec(PREC.preop, seq("?", $._expr)),

    fn: $ => prec.right(2, seq(
      field("params", choice(
        blank(),
        $._ident,
        seq("(", optional(alias($._var_decl_list1, $.params)), ")")
      )),
      "->",
      optional(field("ret_ty", $._expr)),
      field("body", $._expr),
    )),

    parenthesis: $ => prec(1, seq("(", $._expr, ")")),
    block: $ => seq("{", sep(";", $._expr), "}"),

    struct_def: $ => seq(
      "struct",
      "{",
      optional(alias($._var_decl_list1, $.fields)),
      "}",
    ),
    union_def: $ => seq(
      "union",
      "{",
      optional(alias($._var_decl_list1, $.fields)),
      "}",
    ),
    enum_def: $ => seq(
      "enum",
      "{",
      alias(sep(",", seq(
        field("name", $._ident),
        optional(seq("(", field("ty", $._expr), ")")),
      )), $.variants),
      "}",
    ),

    pos_initializer: $ => prec(PREC.initializer, seq(
      optional(field("lhs", $._expr)),
      ".(",
      sep(",", alias($.arg, $.field)),
      ")",
    )),
    named_initializer: $ => prec(PREC.initializer, seq(
      optional(field("lhs", $._expr)),
      ".{",
      sep(",", alias($.arg, $.field)),
      "}",
    )),
    array_initializer: $ => prec(PREC.initializer, seq(
      optional(field("lhs", $._expr)),
      ".[",
      sep(",", $._expr),
      "]",
    )),

    //dot: $ => prec(PREC.postop, seq(optional($._expr), ".", $._ident)),
    dot: $ => prec(PREC.postop, seq(field("lhs", $._expr), ".", field("rhs", $._ident))),
    index: $ => prec(PREC.postop, seq(field("lhs", $._expr), "[", field("idx", $._expr), "]")),
    call: $ => prec(PREC.postop,
      seq(
        field("fn", $._expr),
        "(",
        sep(",", $.arg),
        ")",
      ),
    ),
    arg: $ => choice(
      field("val", $._expr),
      prec(2, seq(field("var", $._ident), "=", field("val", $._expr))),
    ),

    preop: $ => prec(PREC.preop, seq(
      choice("&", seq("&", "mut"), /* "*", */ "!", "-"),
      $._expr,
    )),
    postop: $ => prec.left(PREC.postop, seq(
      $._expr,
      choice(".&", seq(".&", "mut"), ".*", "?"),
    )),
    binop: $ => choice(
      prec.left(PREC.binop_mul, seq($._expr, choice("*", "/", "%"), $._expr)),
      prec.left(PREC.binop_add, seq($._expr, choice("+", "-"), $._expr)),
      prec.left(PREC.binop_shift, seq($._expr, choice("<<", ">>"), $._expr)),
      prec.left(PREC.binop_bitand, seq($._expr, "&", $._expr)),
      prec.left(PREC.binop_bitxor, seq($._expr, "^", $._expr)),
      // prec.left(PREC.binop_bitor, seq($._expr, choice("|"), $._expr)), // TODO: fix conflict with pipe operator
      prec.left(PREC.binop_cmp, seq($._expr, choice("==", "!=", "<", "<=", ">", ">="), $._expr)),
      prec.left(PREC.binop_and, seq($._expr, "&&", $._expr)),
      prec.left(PREC.binop_or, seq($._expr, "||", $._expr)),
    ),
    range: $ => prec.left(PREC.range, seq(
      optional(field("start", $._expr)),
      choice("..", "..="),
      optional(field("end", $._expr)),
    )),
    assign: $ => prec.right(PREC.assign, seq(
      $._expr, "=", $._expr,
    )),
    binop_assign: $ => prec.right(PREC.assign, seq(
      $._expr, choice("*=", "/=", "%=", "+=", "-=", "<<=", ">>=", "&=", "^=", "|=", "&&=", "||="), $._expr,
    )),

    /** use like this: `optional($._var_decl_list1)` */
    _var_decl_list1: $ => prec(3, sep1(",", $.var_decl)),
    var_decl: $ => prec(PREC.var_decl, seq(
      repeat(choice("pub", "mut", "rec")),
      field("name", $._ident),
      choice(
        seq(":", field("ty", $._decl_ty)),
        prec(PREC.assign + 1, seq(":", field("ty", $._decl_ty), choice(":", "="), field("default", $._expr))),
        seq(choice("::", ":="), field("default", $._expr)),
      ),
    )),
    _decl_ty: $ => prec(PREC.decl_ty, field("ty", $._expr)),

    extern_decl: $ => seq(
      "extern",
      field("name", $._ident),
      ":",
      field("ty", $._expr),
    ),

    if: $ => prec.right(seq(
      "if",
      field("cond", $._expr),
      optional("do"),
      field("then", $._expr),
      optional(seq("else", field("else", $._expr)))
    )),
    match: $ => seq(
      "match",
      "TODO",
    ),

    for: $ => seq(
      "for",
      "TODO",
    ),
    while: $ => seq(
      "while",
      field("condition", $._expr),
      optional("do"),
      field("body", $._expr),
    ),

    // catch
    // pipe

    defer: $ => seq("defer", $._expr),
    return: $ => seq("return", $._expr),
    break: $ => seq("break", $._expr),
    continue: $ => seq("continue", $._expr),
    unsafe: $ => seq("unsafe", $._expr),

    // -------

    comment: $ => choice($.line_comment, $.block_comment),

    line_comment: $ => seq(
      '//',
      choice(
        seq(token.immediate(prec(2, "//")), /.*/),
        seq(token.immediate(prec(2, choice("!", "/"))), alias(/.*/, $.doc_comment)),
        /.*/,
      ),
    ),

    // block_comment: $ => seq(
    //   "/*",
    //   choice(
    //     seq(token.immediate(prec(2, "**"))),
    //     seq(token.immediate(prec(2, choice("!", "*"))), alias(/.*/, $.doc_comment)),
    //     blank(),
    //   ),
    //   $._block_comment_content, // TODO: multiline; nested comments
    //   "*/",
    // ),

    block_comment: $ => seq(
      '/*',
      optional(
        choice(
          // Documentation block comments: /** docs */ or /*! docs */
          seq(
            choice("!", "*"),
            optional(field('doc', alias($._block_comment_content, $.doc_comment))),
          ),
          // Non-doc block comments
          $._block_comment_content,
        ),
      ),
      '*/',
    ),
  }
});

function sep1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)), optional(sep));
}

function sep(sep, rule) {
  return optional(sep1(sep, rule));
}
