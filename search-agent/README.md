# Search Agent

Ask your comms anything in ~65 lines of TypeScript. One API call.

## Setup

```bash
npm install
cp .env.example .env
# Add your ATTROVE_SECRET_KEY (sk_ prefix) and ATTROVE_USER_ID
```

## Run

```bash
npm start -- "what did we promise ACME last week?"
npm start -- "open action items"
npm start -- "summarize emails from lisa about the product launch"
npm start                          # defaults to "important updates this week"
```

Example output:

```
Q: what did we promise ACME last week?

Based on the email thread from January 15 between you and Sarah Chen,
you committed to delivering the API integration by end of Q1. Mike
confirmed engineering capacity in the #acme-project Slack channel
and flagged a dependency on the auth migration finishing first.

(Based on 8 messages)
```

## The Code

```typescript
import { Attrove } from "@attrove/sdk";

const attrove = new Attrove({ apiKey: userToken, userId });

const response = await attrove.query("what did we promise ACME?", {
  includeSources: true,
});
console.log(response.answer);
```

That's it. One call. AI-powered answers from your real email and Slack.

## Resources

- [SDK Documentation](https://docs.attrove.com/sdks/typescript)
- [Meeting Prep Agent](../meeting-prep-agent) (event-driven meeting briefs)
- [Daily Rundown](../daily-rundown) (scheduled digest with email delivery)
- [Quickstart](../quickstart) (full B2B2B provisioning flow)
