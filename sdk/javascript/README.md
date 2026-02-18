# @chorechamp/sdk-js

Official JavaScript SDK for the ChoreChamp Public API.

## Install

```bash
npm install @chorechamp/sdk-js
```

## Usage

```ts
import { ChoreChampSdk } from '@chorechamp/sdk-js';

const sdk = new ChoreChampSdk({
  auth: { apiKey: process.env.CHORECHAMP_API_KEY! },
});

const chores = await sdk.listHouseholdChores('<household-id>');
const members = await sdk.listHouseholdMembers('<household-id>');

await sdk.emitEvent('<household-id>', 'chore.completed', {
  choreId: '<chore-id>',
  completedBy: '<member-id>',
});
```
