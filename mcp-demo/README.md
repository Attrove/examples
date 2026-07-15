# MCP Demo — Zero Code

Give Codex, Claude, Cursor, or ChatGPT access to your real email, Slack, and calendar. No code required.

> **Important:** The MCP connector methods below let you query **your own account only**. When you authenticate, you're granting access to your own connected integrations — not your users' data. This is a security and privacy feature. To query your users' data programmatically, use the [SDK examples](../meeting-prep-agent) with the B2B2B provisioning flow.

## What is this?

The Attrove MCP server exposes 20 tools that any AI assistant can use to search your communications and monitor goals:

| Tool | What it does |
|------|-------------|
| `attrove_query` | Ask questions, get AI-generated answers with sources |
| `attrove_search` | Semantic search across messages, meetings, and calendar events |
| `attrove_integrations` | List connected services (Gmail, Slack, etc.) |
| `attrove_events` | List calendar events with attendees |
| `attrove_meetings` | List meetings with AI summaries and action items |
| `attrove_notes` | List saved notes, decisions, and observations |
| `attrove_push_note` | Save a note into user context for future agents |
| `attrove_push_meeting` | Save a meeting transcript or summary into user context |
| `attrove_delete_meeting` | Reversibly archive a pushed meeting by `id` or `external_id` |
| `attrove_delete_note` | Reversibly archive a note by `id` or `external_id` |
| `attrove_create_goal` | Create an outcome goal to monitor |
| `attrove_list_goals` | List goals by lifecycle or health |
| `attrove_get_goal_status` | Inspect a goal and latest status snapshot |
| `attrove_evaluate_goal` | Queue a manual goal evaluation |
| `attrove_add_goal_note` | Attach a note to a goal |
| `attrove_confirm_goal_status` | Manually confirm or override goal status |
| `attrove_goal_events` | Poll goal lifecycle transitions with cursor metadata |
| `attrove_acknowledge_goal` | Acknowledge expected silence; suppress silence escalation until a horizon |
| `attrove_clear_goal_acknowledgment` | Clear an active acknowledgment and resume silence monitoring |
| `attrove_draft_goal_follow_up` | Draft an evidence-grounded follow-up email for a quiet goal (read-only) |

## Setup: Hosted MCP (Recommended)

Hosted MCP is the default for Codex, Claude Desktop, Cursor, Claude Code, and other remote-capable clients. Authentication is handled automatically with OAuth. No `sk_` secrets or env vars are required for the default path.

### Codex

```bash
npx @attrove/cli install codex
codex mcp login attrove
```

Restart Codex or reload MCP tool discovery if Attrove is not visible. The raw hosted server exposes tools such as `attrove_notes`, `attrove_create_goal`, and `attrove_list_goals`; `mcp__codex_apps__attrove` tools come from the OpenAI Apps connector, not the raw hosted MCP server.

### Claude Desktop

```bash
npx @attrove/cli install claude-desktop
```

Then open Claude Desktop and finish OAuth when prompted.

### Cursor

```bash
npx @attrove/cli install cursor
```

Then open Cursor and finish OAuth when prompted.

### Claude Code

```bash
npx @attrove/cli install claude-code
```

This defaults to project scope and writes `.mcp.json`. Open Claude Code and finish OAuth when prompted.

### ChatGPT

If ChatGPT asks for a manual MCP URL, use:

```bash
https://api.attrove.com/mcp
```

ChatGPT should discover the OAuth flow automatically when it follows MCP discovery.

## Verify the First Useful Answer

After OAuth completes, do not stop at "server connected." Ask:

```text
Use Attrove to list my connected integrations.
```

You should see at least one connected source. Then ask:

```text
What needs my attention this week? Include the source messages or meetings you used.
```

That second prompt confirms Attrove can retrieve useful context and cite the sources behind the answer.

## Setup: Advanced Local Fallback

Use this only if you explicitly want the local stdio server:

```bash
npx @attrove/cli login
npx @attrove/cli local install claude-code
npx @attrove/cli connect gmail
```

You can also run `@attrove/mcp` manually with `ATTROVE_SECRET_KEY` and `ATTROVE_USER_ID` if you need direct env-based stdio config.

## Try these prompts

Once connected via any method above:

- "What do I need to know before my meeting with Sarah tomorrow?"
- "What meetings do I have this week?"
- "Summarize my last meeting with the engineering team"
- "Find all emails from acme.com about the product launch"
- "What are my open action items?"
- "Create a goal to track the ACME renewal and alert me if it goes quiet for 5 days."
- "List my active at-risk goals and explain what evidence changed."
- "Show goal events since yesterday."

## Example Conversations

### Meeting prep

> **You:** What context do I need for my 2pm meeting with the marketing team?
>
> **Claude:** *calls `attrove_events` to find the meeting, then `attrove_query` to search relevant context*
>
> Based on your recent communications, here's what you should know...

### Email search

> **You:** Find discussions about the API migration from last month
>
> **Claude:** *calls `attrove_search` with date filters*
>
> I found 3 conversation threads about the API migration...

### Meeting summary

> **You:** What happened in my last meeting with the product team?
>
> **Claude:** *calls `attrove_meetings` to find the meeting with summary*
>
> Your last product team meeting was on January 22. Key decisions: ...

## How it works

```
┌──────────────────┐     ┌─────────────┐     ┌─────────────┐
│ Codex/Claude/    │────▶│   Attrove   │────▶│   Attrove   │
│ Cursor/ChatGPT   │     │  MCP Server │     │    API      │
└──────────────────┘     └─────────────┘     └─────────────┘
       │                       │                     │
       │ Natural language      │ Tool calls          │ RAG + Search
       │ questions             │ (20 tools)          │ across Gmail,
       │                       │                     │ Slack, Calendar
```

**Hosted MCP** (Codex, Claude Desktop, Cursor, Claude Code, ChatGPT): Connects to `https://api.attrove.com/mcp`. Auth is handled via OAuth 2.1. You sign in once and query your own connected accounts.

**Advanced local stdio fallback**: Runs `npx @attrove/mcp` locally. Use it only when you explicitly need local credential-backed MCP.

## Who can see what?

The MCP connector authenticates **you** — the account holder. You can only query data from your own connected integrations (Gmail, Slack, Calendar, etc.).

This is distinct from the SDK's B2B2B flow, where a partner server provisions end users and queries their data on their behalf using `sk_` tokens. See the [quickstart](../quickstart) for that pattern.

## Resources

- [@attrove/mcp on npm](https://www.npmjs.com/package/@attrove/mcp)
- [SDK Documentation](https://attrove.com/docs/sdk)
- [Goal Monitor](../goal-monitor) (Goals SDK workflow)
- [Meeting Prep Agent](../meeting-prep-agent) (build it into your app)
- [Quickstart](../quickstart) (full B2B2B provisioning flow)
