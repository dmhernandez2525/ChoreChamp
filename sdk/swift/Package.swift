// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ChoreChampSDK",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(name: "ChoreChampSDK", targets: ["ChoreChampSDK"])
    ],
    targets: [
        .target(name: "ChoreChampSDK", path: "Sources/ChoreChampSDK")
    ]
)
