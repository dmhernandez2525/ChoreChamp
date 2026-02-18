# chorechamp-sdk

Official Python SDK for the ChoreChamp Public API.

## Install

```bash
pip install chorechamp-sdk
```

## Usage

```python
from chorechamp_sdk import ChoreChampClient

client = ChoreChampClient(api_key="cc_live_...")

chores = client.list_household_chores("<household-id>")
members = client.list_household_members("<household-id>")

client.emit_event("<household-id>", "chore.completed", {
    "choreId": "<chore-id>",
    "completedBy": "<member-id>",
})
```
