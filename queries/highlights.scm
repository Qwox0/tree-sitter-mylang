; see `:help treesitter-highlight-groups`

; Identifier

(ident) @variable
; "self" @variable.builtin
(params (var_decl name: (ident) @variable.parameter))
(fields (var_decl name: (ident) @variable.member))

(var_decl ty: (ident) @type)
(extern_decl ty: (ident) @type)
(fn ret_ty: (ident) @type)
(extern_decl ty: (fn body: (ident) @type))
(ptr_ty pointee_ty: (ident) @type)
(slice_ty elem_ty: (ident) @type)
(array_ty elem_ty: (ident) @type)
(primitive_type) @type.builtin

(var_decl
  name: (ident) @type.definition
  default: [ (struct_def) (union_def) (enum_def) ])
(var_decl
  name: (ident) @function
  default: (fn))
(extern_decl
  name: (ident) @function
  ty: (fn))

; Assume all-caps names are constants
((ident) @constant
 (#match? @constant "^[A-Z][A-Z\\d_]+$'"))

; Assume uppercase names are enum constructors
; ((ident) @constructor
;  (#match? @constructor "^[A-Z]"))

; ; Assume that uppercase names in paths are types
; ((scoped_identifier
;   path: (identifier) @type)
;  (#match? @type "^[A-Z]"))
; ((scoped_identifier
;   path: (scoped_identifier
;     name: (identifier) @type))
;  (#match? @type "^[A-Z]"))
; ((scoped_type_identifier
;   path: (identifier) @type)
;  (#match? @type "^[A-Z]"))
; ((scoped_type_identifier
;   path: (scoped_identifier
;     name: (identifier) @type))
;  (#match? @type "^[A-Z]"))
;
; ; Assume all qualified names in struct patterns are enum constructors. (They're
; ; either that, or struct names; highlighting both as constructors seems to be
; ; the less glaring choice of error, visually.)
; (struct_pattern
;   type: (scoped_type_identifier
;     name: (type_identifier) @constructor))

; Literal


(string_literal) @string
; (raw_string_literal) @string

(char_literal) @character

(boolean_literal) @boolean
(integer_literal) @number
(float_literal) @number.float

; Function calls

(call
  fn: (ident) @function.call)
; (call_expression
;   function: (field_expression
;     field: (field_identifier) @function.method))
; (call_expression
;   function: (scoped_identifier
;     "::"
;     name: (identifier) @function))
;
; (generic_function
;   function: (identifier) @function)
; (generic_function
;   function: (scoped_identifier
;     name: (identifier) @function))
; (generic_function
;   function: (field_expression
;     field: (field_identifier) @function.method))
;
; (macro_invocation
;   macro: (identifier) @function.macro
;   "!" @function.macro)
;
; ; Function definitions
;
; (function_item (identifier) @function)
; (function_signature_item (identifier) @function)

; Operator

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
  ; "|"
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
] @operator

; Keywords

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
] @keyword.modifier
[ "for" "while" ] @keyword.repeat
"return" @keyword.return
[ "if" "else" ] @keyword.conditional
[
  "match"
  "defer"
  "break"
  "continue"
  "unsafe"
] @keyword

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
  ":"
  "="
  "."
  ","
  ";"
] @punctuation.delimiter

(line_comment) @comment
(block_comment) @comment
(line_comment (doc_comment)) @comment.documentation
(block_comment (doc_comment)) @comment.documentation

"nil" @variable.builtin ; TODO: remove this
