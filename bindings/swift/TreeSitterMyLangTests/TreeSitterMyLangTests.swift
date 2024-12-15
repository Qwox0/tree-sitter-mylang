import XCTest
import SwiftTreeSitter
import TreeSitterMyLang

final class TreeSitterMyLangTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_mylang())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading MyLang grammar")
    }
}
