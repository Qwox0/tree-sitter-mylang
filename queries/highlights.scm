; see `:help treesitter-highlight-groups`

; ------------------
; Variables

(ident) @variable

"nil" @variable.builtin ; TODO: remove this

(params (decl name: (ident) @variable.parameter))

(struct_def (decl name: (ident) @variable.member !is_const))
(union_def (decl name: (ident) @variable.member !is_const))
(dot rhs: (ident) @variable.member)
(named_initializer (field var: (ident) @variable.member))

(decl "mut" name: (ident) @variable.mutable) ; custom capture

; ------------------
; Constants

(decl name: (ident) @constant is_const: _)
(variant name: (ident) @constant)

; Assume all-caps names are constants
((ident) @constant
  (#match? @constant "^[A-Z][A-Z\\d_]+$"))

(decl
  name: (ident) @module
  init: (directive
    name: (_) @directive_name
    (#eq? @directive_name "import")))

; ------------------
; Literals

(string_literal) @string
((multilinestring_literal) @string (#set! priority 80)) ; priority must be lower than for comments
(escape_sequence) @string.escape

(char_literal) @character

(boolean_literal) @boolean
(integer_literal) @number
(float_literal) @number.float

; ------------------
; Types

(decl ty: (ident) @type)
(variant ty: (ident) @type)
(fn ret_ty: (ident) @type)
(ptr_ty pointee_ty: (ident) @type)
(slice_ty elem_ty: (ident) @type)
(array_ty elem_ty: (ident) @type)

(pos_initializer
  lhs: (ident) @type
  (#match? @type "^[A-Z]"))
(named_initializer
  lhs: (ident) @type
  (#match? @type "^[A-Z]"))

(primitive_type) @type.builtin

(decl
  name: (ident) @type.definition
  init: [ (primitive_type) (struct_def) (union_def) (enum_def) ])
(decl
  name: (dot
    rhs: (ident) @type.definition)
  init: [ (primitive_type) (struct_def) (union_def) (enum_def) ])

; ------------------
; Functions

(decl
  name: (ident) @function
  init: (fn))
(decl
  name: (ident) @function
  ty: (fn))
(decl
  name: (dot
    rhs: (ident) @function.method)
  init: (fn))

(call
  fn: (ident) @function.call)
(call
  fn: (dot
    rhs: (ident) @function.method.call))

; ------------------
; Operators

[
  "*"
  "*="
  "/"
  "/="
  "%"
  "%="
  "+"
  "+="
  "-"
  "-="
  "<<"
  "<<="
  ">>"
  ">>="
  "&"
  "&="
  "^"
  "^="
  "|"
  "|="
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "&&"
  "&&="
  "||"
  "||="
  ".."
  "..="

  ".&"
  ".*"
  "!"
  "-"
  "?"
  "xx"
] @operator

; ------------------
; Keywords

[
  "match"
  "defer"
  "do"
  "break"
  "continue"
  "unsafe"
] @keyword

[ "not" "and" "or" ] @keyword.operator

[
  "enum"
  "struct"
  "union"
] @keyword.type

[
  "extern"
  "pub"
  "mut"
  "rec"
  "static"
] @keyword.modifier

[ "for" "while" ] @keyword.repeat
(for "in" @keyword.repeat)

"return" @keyword.return

[ "if" "then" "else" ] @keyword.conditional

; ------------------
; Directives

(directive
  "#" @keyword.directive
  name: (ident) @keyword.directive)

; ------------------
; Punctuation

[
  "("
  ".("
  ")"
  "["
  ".["
  "]"
  "{"
  ".{"
  "}"
] @punctuation.bracket
[
  "::"
  ":="
  "->"
  "|>"
  ":"
  "="
  "."
  ","
  ";"
] @punctuation.delimiter

; ------------------
; Comments

((line_comment) @comment (#set! priority 90))
((block_comment) @comment (#set! priority 90))
((line_comment (doc_comment)) @comment.documentation (#set! priority 90))
((block_comment (doc_comment)) @comment.documentation (#set! priority 90))
