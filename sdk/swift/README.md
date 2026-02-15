# ChoreChampSDK

Official Swift SDK for the ChoreChamp Public API.

## Swift Package Manager

```swift
.package(url: "https://github.com/dmhernandez2525/ChoreChamp.git", from: "1.0.0")
```

## Usage

```swift
import ChoreChampSDK

let sdk = ChoreChampSDK(auth: .apiKey("cc_live_..."))
let chores = try await sdk.listHouseholdChores(householdId: "<household-id>")
let members = try await sdk.listHouseholdMembers(householdId: "<household-id>")

_ = try await sdk.emitEvent(
    householdId: "<household-id>",
    eventType: "chore.completed",
    payload: ["choreId": "<chore-id>"]
)
```
