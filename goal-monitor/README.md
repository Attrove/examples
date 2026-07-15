# Goal Monitor

Create and inspect Attrove outcome goals with the TypeScript SDK.

This example uses a per-user `sk_` token. It creates one active goal, attaches a manual note, queues an async evaluator run, reads current status/evidence, and shows the goal-events polling shape.

## Setup

```bash
npm install
cp .env.example .env
# Add your ATTROVE_SECRET_KEY (sk_ prefix) and ATTROVE_USER_ID
```

## Run

```bash
npm start -- "ACME renewal"
npm start -- "Q3 security review"
npm start
```

The script leaves the goal active so Attrove can continue evaluating it as new scoped messages, meetings, events, or notes arrive. Archive or cancel the goal later from your app when it is no longer useful.

## The Code

```typescript
const goal = await attrove.goals.create({
  title: "ACME renewal",
  watchScope: {
    seedQuery: "ACME renewal",
    keywords: ["ACME", "renewal"],
    sourceTypes: ["messages", "meetings", "notes"],
    silenceCondition: {
      quietAfterDays: 5,
      activitySources: ["messages", "meetings", "notes"],
      alertHealth: "at_risk",
    },
  },
});

await attrove.goals.addNote(goal.id, {
  title: "Manual context",
  body: "Buyer asked for ROI math before next review.",
});

const { runId } = await attrove.goals.evaluate(goal.id);
const current = await attrove.goals.get(goal.id);
const evidence = await attrove.goals.evidence(goal.id);
const events = await attrove.goals.events({ limit: 10 });
```

## SDK Methods Used

| Method | Purpose |
|--------|---------|
| `goals.create()` | Create an active user-scoped outcome goal |
| `goals.addNote()` | Attach manual evidence to the goal |
| `goals.evaluate()` | Queue a manual async evaluator run |
| `goals.get()` | Read current lifecycle, health, latest snapshot, and last run |
| `goals.evidence()` | Read cited evidence and manual notes |
| `goals.list()` | List active goals |
| `goals.events()` | Poll goal lifecycle/event transitions with cursor metadata |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATTROVE_SECRET_KEY` | Yes | User token (`sk_...` prefix), returned by provisioning a user |
| `ATTROVE_USER_ID` | Yes | User UUID |
| `ATTROVE_BASE_URL` | No | Optional API origin override |

## Related Examples

- [Quickstart](../quickstart) shows how to provision users and create connect sessions.
- [MCP demo](../mcp-demo) shows the same Goals surface from an AI assistant.
- [Search agent](../search-agent) is the smallest one-call Q&A example.
