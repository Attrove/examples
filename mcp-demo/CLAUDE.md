# AI Assistant Context for MCP Demo

This is a zero-code example showing how to connect AI assistants (Codex, Claude, Cursor, ChatGPT) to Attrove via the Model Context Protocol.

**Access scope:** MCP connectors authenticate you and let you query your own account only — not your end users' data. This is a security/privacy feature. For querying users' data, use the SDK with the B2B2B provisioning flow.

## MCP Tools Available (20 tools)

| Tool | Parameters | Purpose |
|------|-----------|---------|
| `attrove_query` | query (required), integration_ids, include_sources | Ask questions, get AI answers |
| `attrove_search` | query (required), after_date, before_date, sender_domains, include_body_text | Semantic search across messages, meetings, and events |
| `attrove_integrations` | none | List connected services |
| `attrove_events` | start_date, end_date, limit | Calendar events with attendees |
| `attrove_meetings` | start_date, end_date, provider, limit | Meetings with AI summaries |
| `attrove_notes` | limit, offset, ids, ref_type, ref_id | List saved notes and decisions |
| `attrove_push_note` | body (required), title, ref_type, ref_id | Save a note into user context |
| `attrove_push_meeting` | title, start_time, end_time, transcript, summary, short_summary, attendees, action_items, external_id | Save a meeting transcript or summary into user context |
| `attrove_delete_meeting` | id or external_id | Reversibly archive a pushed meeting |
| `attrove_delete_note` | id or external_id | Reversibly archive a note |
| `attrove_create_goal` | title, watch_scope, success_criteria, deadline | Create an outcome goal to monitor |
| `attrove_list_goals` | lifecycle, health, limit, cursor | List goals by lifecycle or health |
| `attrove_get_goal_status` | goal_id | Inspect a goal and latest status snapshot |
| `attrove_evaluate_goal` | goal_id | Queue a manual goal evaluation |
| `attrove_add_goal_note` | goal_id, body, title, metadata | Attach a note to a goal |
| `attrove_confirm_goal_status` | goal_id, lifecycle, health, reason | Manually confirm or override goal status |
| `attrove_goal_events` | since, since_event_id, types, limit, cursor | Poll goal lifecycle transitions |
| `attrove_acknowledge_goal` | goal_id (required), until (required), reason, channel | Acknowledge expected silence; suppress escalation until a horizon |
| `attrove_clear_goal_acknowledgment` | goal_id (required), reason | Clear an active acknowledgment; resume silence monitoring |
| `attrove_draft_goal_follow_up` | goal_id (required), directive | Draft a follow-up email for a quiet goal (read-only) |

There is no `attrove_brief` tool. The `brief()` SDK method is not yet implemented.

## Two Connection Methods

### Hosted MCP (Codex, Claude Desktop, Cursor, Claude Code, ChatGPT) — recommended
- Install commands:
  - `npx @attrove/cli install codex`
  - `npx @attrove/cli install claude-code`
  - `npx @attrove/cli install cursor`
  - `npx @attrove/cli install claude-desktop`
- Codex OAuth: after install, run `codex mcp login attrove`; reload tool discovery if needed
- Codex verification: raw hosted tools include `attrove_notes`, `attrove_create_goal`, and `attrove_list_goals`; `mcp__codex_apps__attrove` tools are the OpenAI Apps connector
- Endpoint: `https://api.attrove.com/mcp`
- Auth: Automatic via OAuth 2.1 — the client discovers `/.well-known/oauth-protected-resource`, prompts sign-in, and manages the session
- No tokens or env vars to configure for the default path
- You query your own connected accounts

### Advanced local stdio fallback
- Commands:
  - `npx @attrove/cli login`
  - `npx @attrove/cli local install claude-code`
  - `npx @attrove/cli connect gmail`
- Manual command: `npx @attrove/mcp`
- Requires two env vars if you bypass the CLI fallback:
  - `ATTROVE_SECRET_KEY` — the `sk_...` per-user secret key (not the partner `client_id`/`client_secret`)
  - `ATTROVE_USER_ID` — user UUID

```json
{
  "mcpServers": {
    "attrove": {
      "command": "npx",
      "args": ["-y", "@attrove/mcp@latest"],
      "env": {
        "ATTROVE_SECRET_KEY": "sk_...",
        "ATTROVE_USER_ID": "user-uuid"
      }
    }
  }
}
```

## Example Prompts

- "Use Attrove to list my connected integrations."
- "What needs my attention this week? Include the source messages or meetings you used."
- "What do I need to know before my meeting with [name] tomorrow?"
- "What meetings do I have this week?"
- "Summarize my last meeting with the engineering team"
- "Find all emails from acme.com about the product launch"
- "What services are connected to my account?"
- "Create a goal to track the ACME renewal and alert me if it goes quiet for 5 days."
- "List active at-risk goals and show the evidence behind each one."
- "Show goal events since yesterday."
