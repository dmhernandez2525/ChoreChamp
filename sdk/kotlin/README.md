# ChoreChamp Kotlin SDK

Official Kotlin SDK for the ChoreChamp Public API.

## Install

```kotlin
implementation("com.chorechamp:sdk-kotlin:1.0.0")
```

## Usage

```kotlin
import com.chorechamp.sdk.ChoreChampAuth
import com.chorechamp.sdk.ChoreChampSdk

val sdk = ChoreChampSdk(auth = ChoreChampAuth.ApiKey("cc_live_..."))

val choresJson = sdk.listHouseholdChores("<household-id>")
val membersJson = sdk.listHouseholdMembers("<household-id>")

sdk.emitEvent(
    householdId = "<household-id>",
    eventType = "chore.completed",
    payloadJson = """{"choreId":"<chore-id>"}"""
)
```
