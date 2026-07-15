# AI Assistant Context for Goal Monitor

This example creates and inspects Attrove outcome goals with the TypeScript SDK.

## SDK Methods Used

| Method | Purpose |
|--------|---------|
| `new Attrove({ apiKey, userId })` | Create a per-user SDK client |
| `attrove.goals.create()` | Create an active outcome goal |
| `attrove.goals.addNote()` | Attach manual evidence |
| `attrove.goals.evaluate()` | Queue an async evaluator run |
| `attrove.goals.get()` | Inspect lifecycle, health, latest snapshot, and last run |
| `attrove.goals.evidence()` | Fetch cited refs and manual notes |
| `attrove.goals.list()` | List goals by lifecycle/health |
| `attrove.goals.events()` | Poll goal lifecycle/event transitions |

## Key Rules

- Use `@attrove/sdk`; do not write raw fetch calls.
- Goals need a `watchScope` with at least one anchor: `entityIds`, `seedQuery`, or `keywords`.
- `goals.evaluate()` is async and returns a `runId`; use `goals.get()` to inspect `lastRun` and `lastSnapshot`.
- Leave goals active unless the user explicitly wants to call `goals.archive()`, `goals.cancel()`, or `goals.confirmStatus()` with a terminal lifecycle.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATTROVE_SECRET_KEY` | Yes | User token (`sk_...` prefix), not partner credentials |
| `ATTROVE_USER_ID` | Yes | User UUID |
| `ATTROVE_BASE_URL` | No | Optional API origin override |
