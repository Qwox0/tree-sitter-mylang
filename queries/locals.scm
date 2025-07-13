; neovim doesn't use this for highlighting :(
; <https://github.com/nvim-treesitter/nvim-treesitter/issues/3098>

(fn) @local.scope

(decl name: (ident) @local.definition)

(ident) @local.reference
