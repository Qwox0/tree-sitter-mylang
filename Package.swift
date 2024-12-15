// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterMyLang",
    products: [
        .library(name: "TreeSitterMyLang", targets: ["TreeSitterMyLang"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterMyLang",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterMyLangTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterMyLang",
            ],
            path: "bindings/swift/TreeSitterMyLangTests"
        )
    ],
    cLanguageStandard: .c11
)
