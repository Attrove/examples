# AI Assistant Context for Attrove Quickstart

This is the Attrove quickstart repository demonstrating the B2B2B integration flow.

## SDK Usage Guidelines

1. **Always use the @attrove/sdk** - Never use raw fetch calls
2. **Server-side operations** use `Attrove.admin()` for user provisioning
3. **Client-side operations** use `new Attrove()` for queries
4. **Production URL** - The SDK defaults to `https://api.attrove.com`, no baseUrl needed

## Authentication Flow

Attrove uses a B2B2B model with three token types:

```
Partner Server (you)          Attrove API              End User
       |                           |                       |
       |-- client_id/secret ------>|                       |
       |<-- sk_ API key -----------|                       |
       |                           |                       |
       |-- create connect token -->|                       |
       |<-- pit_ token ------------|                       |
       |                           |                       |
       |-- pit_ token via URL -----|---------------------> |
       |                           |<-- OAuth consent ---- |
       |                           |-- sync data --------> |
       |                           |                       |
       |-- query with sk_ -------->|                       |
       |<-- RAG response ----------|                       |
```

## Common Tasks

### Provision a new user (server-side only)

```typescript
import { Attrove } from '@attrove/sdk';

const admin = Attrove.admin({
  clientId: process.env.ATTROVE_CLIENT_ID!,
  clientSecret: process.env.ATTROVE_CLIENT_SECRET!,
});

const { id: userId, apiKey } = await admin.users.create({
  email: 'user@example.com',
});
```

### Generate a connect token for OAuth

```typescript
const { token: connectToken, expires_at } = await admin.users.createConnectToken(userId);
// Token expires in 10 minutes (expires_at is ISO 8601 timestamp)
// Generate a new token if the user hasn't connected by then

// Send this URL to the end user to connect their integrations
const connectUrl = `https://connect.attrove.com/integrations/connect?token=${connectToken}&user_id=${userId}`;
```

### Query user data (after integration connected)

```typescript
const attrove = new Attrove({ apiKey, userId });

// Simple query
const response = await attrove.query('What meetings do I have this week?');
console.log(response.answer);

// With options
const response = await attrove.query('Summarize emails from John', {
  includeSources: true,
  integrationIds: ['gmail-integration-id'],
});
```

### Search for specific messages

```typescript
const results = await attrove.search('project deadline', {
  afterDate: '2026-01-01',
  senderDomains: ['acme.com'],
  includeBodyText: true,
});
```

### List connected integrations

```typescript
const integrations = await attrove.integrations.list();
console.log(integrations.map(i => i.provider)); // ['gmail', 'slack']
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATTROVE_CLIENT_ID` | Yes | Partner client ID (for admin operations) |
| `ATTROVE_CLIENT_SECRET` | Yes | Partner client secret (for admin operations) |

Note: The SDK's `baseUrl` option defaults to `https://api.attrove.com`. Override via the constructor if needed:
```typescript
const attrove = new Attrove({ apiKey, userId, baseUrl: 'http://localhost:3000' });
```

## Error Handling

The SDK throws typed errors with helpful properties:

```typescript
import {
  AttroveError,
  AuthenticationError,
  RateLimitError,
  isAttroveError,
} from '@attrove/sdk';

try {
  await attrove.query('...');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid or expired API key (401)
    console.error('Auth failed:', error.message);
  } else if (error instanceof RateLimitError) {
    // Too many requests (429)
    const waitTime = error.retryAfter ?? 60; // Default to 60s if not specified
    console.error(`Rate limited. Retry after ${waitTime} seconds`);
  } else if (isAttroveError(error)) {
    // Other API error - use type guard for safety
    console.error(`API Error [${error.code}]:`, error.message);
  }
}
```

## Links

- [SDK Documentation](https://docs.attrove.com/sdks/typescript)
- [API Reference](https://docs.attrove.com/api)
- [MCP Server](https://www.npmjs.com/package/@attrove/mcp)
