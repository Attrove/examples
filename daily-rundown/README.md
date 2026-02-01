# Daily Rundown

Daily comms digest in ~230 lines of TypeScript. Open actions, decisions, meetings, and a comms summary from your email, Slack, and calendar.

## What it does

1. Fetches today's calendar events with attendees
2. Searches for recent action items, decisions, and follow-ups
3. Generates an AI-powered digest across all your integrations
4. Outputs to console (default) or sends via email (`--send`)

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# User token (sk_ prefix) — NOT your attrove_ API key
ATTROVE_USER_TOKEN=sk_...
ATTROVE_USER_ID=your-user-uuid
```

Optional (for email delivery):

```bash
RESEND_API_KEY=re_...
SEND_TO=you@example.com
```

## Run

```bash
# Print to console
npm start

# Send via email
npm start -- --send
```

Example output:

```
Daily Rundown - Wednesday, January 29
==================================================

Calendar (3 events)
------------------------------
  09:00 AM  Team Standup
             with Sarah Chen, Mike Torres, Lisa Park
  02:00 PM  Q1 Planning Review
             with Alex Kim, Jordan Lee
  04:30 PM  1:1 with Manager

Recent Threads (5 active)
------------------------------
  - Q4 Revenue Report Follow-up (4 messages)
  - API Migration Timeline (7 messages)
  - Customer Onboarding Feedback (3 messages)
  - Sprint Planning Prep (2 messages)
  - Design Review Assets (5 messages)

Digest
------------------------------
Action Items:
- Respond to Sarah's email about updated Q1 OKRs (sent yesterday)
- Review the API migration PR that Mike flagged in #engineering
- Send feedback on the design mockups shared in #product

Key Decisions:
- Team agreed to ship v2.1 in February (Slack #product, yesterday)
- Customer onboarding flow will be redesigned (email thread, Jan 27)

Summary: Active week focused on Q1 planning. Most communication
centered on the API migration timeline and Q1 OKR finalization.
Three threads need your follow-up today.
```

## Cron Setup

Run daily with cron:

```bash
# Run at 7:30 AM every weekday, send via email
30 7 * * 1-5 cd /path/to/daily-rundown && npm start -- --send
```

## SDK Methods Used

| Method | Purpose |
|--------|---------|
| `attrove.events.list()` | Today's calendar with attendees |
| `attrove.search()` | Recent action items and threads |
| `attrove.query()` | AI-generated daily digest |

## Resources

- [SDK Documentation](https://docs.attrove.com/sdks/typescript)
- [Meeting Prep Agent](../meeting-prep-agent) (event-driven pattern)
- [Search Agent](../search-agent) (minimal example)
