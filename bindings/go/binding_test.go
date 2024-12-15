package tree_sitter_mylang_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_mylang "github.com/tree-sitter/tree-sitter-mylang/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_mylang.Language())
	if language == nil {
		t.Errorf("Error loading MyLang grammar")
	}
}
