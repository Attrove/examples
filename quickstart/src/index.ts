/**
 * Attrove Quickstart - Node.js
 *
 * This example demonstrates the full B2B2B flow:
 * 1. Provision a user (server-side, using admin credentials)
 * 2. Create a durable connect session for OAuth
 * 3. Query user data (after they connect integrations)
 *
 * Run with: npm start
 * Demo mode: npm start -- --demo
 */

import 'dotenv/config';
import * as readline from 'readline';
import {
  Attrove,
  type ApiKeyFormat,
  AuthenticationError,
  RateLimitError,
  isAttroveError,
} from '@attrove/sdk';

const demoMode =
  process.argv.includes('--demo') || process.env.DEMO_MODE === 'true';

// Validate environment variables (skip in demo mode)
const clientId = process.env.ATTROVE_CLIENT_ID;
const clientSecret = process.env.ATTROVE_CLIENT_SECRET;

if (!demoMode && (!clientId || !clientSecret)) {
  console.error('Missing required environment variables.');
  console.error('Copy .env.example to .env and add your credentials:');
  console.error('  cp .env.example .env');
  console.error('');
  console.error('Get your credentials at: https://connect.attrove.com/keys');
  console.error('');
  console.error('Or run with --demo to see example output:');
  console.error('  npm start -- --demo');
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('\nAttrove Quickstart\n');
  console.log('==================\n');

  if (demoMode) {
    await runDemo();
    return;
  }

  // Step 1: Create admin client (server-side only)
  // Type assertion is safe here - we validated these exist above and exit if missing
  const admin = Attrove.admin({
    clientId: clientId!,
    clientSecret: clientSecret!,
  });

  // Step 2: Provision a user
  // In production, use your user's actual email
  const testEmail = `quickstart-${Date.now()}@example.com`;

  console.log(`1. Provisioning user: ${testEmail}`);
  const { id: userId, apiKey } = await admin.users.create({
    email: testEmail,
  });
  console.log(`   User created: ${userId}`);
  console.log(`   API Key: ${apiKey.slice(0, 15)}...`);

  // Step 3: Create a durable connect session for OAuth flow
  console.log('\n2. Creating durable connect session...');
  const connectSession = await admin.users.createConnectSession(userId, {
    provider: 'gmail',
    display: 'popup',
    includeInstall: true,
  });

  console.log(`   Session expires: ${connectSession.expires_at}`);
  console.log(`\n   Activation URL (open in browser):`);
  console.log(`   ${connectSession.activation_url}`);
  if (connectSession.cli?.command) {
    console.log(`\n   Terminal handoff:`);
    console.log(`   ${connectSession.cli.command}`);
  } else {
    // cli + install are returned together; null here means includeInstall
    // was false (or your client isn't configured for CLI handoff).
    console.log(
      `\n   (Terminal/agent handoff not included — pass { includeInstall: true } when creating the session.)`,
    );
  }

  // Wait for user to connect an integration
  console.log(
    '\n3. Open the activation URL to connect Gmail, Slack, or another integration.',
  );
  console.log('   Once connected, press Enter to continue...\n');

  await waitForEnter();

  // Step 4: Query user data
  console.log('4. Querying user data...\n');

  // CreateUserResponse.apiKey is typed as plain `string`, but the Attrove
  // client wants the branded `ApiKeyFormat`. The cast bridges the two; do
  // not remove the brand or widen the constructor's parameter.
  const attrove = new Attrove({ apiKey: apiKey as ApiKeyFormat, userId });

  // First, check what integrations are connected
  const integrations = await attrove.integrations.list();

  if (integrations.length === 0) {
    console.log('   No integrations connected yet.');
    console.log(
      '   Connect Gmail, Slack, or another service, then run this script again.',
    );
    return;
  }

  console.log(
    `   Connected integrations: ${integrations.map((i) => i.provider).join(', ')}`,
  );

  // Query the user's data
  const response = await attrove.query(
    'What needs my attention this week? Include the source messages or meetings you used.',
    { includeSources: true },
  );

  console.log('\n   Answer:');
  console.log(`   ${response.answer}`);

  const sourceBreakdown: string[] = [];
  if (response.used_message_ids.length > 0) {
    const n = response.used_message_ids.length;
    sourceBreakdown.push(`${n} ${n === 1 ? 'message' : 'messages'}`);
  }
  if (response.used_meeting_ids.length > 0) {
    const n = response.used_meeting_ids.length;
    sourceBreakdown.push(`${n} ${n === 1 ? 'meeting' : 'meetings'}`);
  }
  if (response.used_event_ids.length > 0) {
    const n = response.used_event_ids.length;
    sourceBreakdown.push(`${n} ${n === 1 ? 'event' : 'events'}`);
  }
  if (sourceBreakdown.length > 0) {
    console.log(`\n   (Based on ${sourceBreakdown.join(', ')})`);
  }

  printNextSteps();
}

/**
 * Demo mode: show realistic mock output without requiring credentials.
 * Lets developers see what they'll get before signing up.
 */
async function runDemo(): Promise<void> {
  console.log('[DEMO MODE]\n');

  // Step 1: Provision
  console.log('1. Provisioning user: demo@yourapp.com');
  await delay(300);
  console.log('   User created: 2322ac54-9642-4a9e-a504-b0d227d17fa7');
  console.log('   API Key: sk_live_demo_abc...');

  // Step 2: Connect session
  console.log('\n2. Creating durable connect session...');
  await delay(200);
  console.log('   Session expires: 2026-01-30T10:10:00.000Z');
  console.log('\n   Activation URL (open in browser):');
  console.log(
    '   https://connect.attrove.com/integrations/connect?session=8f4a2c1b-...',
  );
  console.log('\n   Terminal handoff:');
  console.log(
    '   npx @attrove/cli connect --session 8f4a2c1b-0000-4000-9000-000000000000',
  );

  // Step 3: Simulated integration connection
  console.log(
    '\n3. [DEMO] Skipping OAuth — simulating connected integrations.\n',
  );
  await delay(500);

  // Step 4: Query
  console.log('4. Querying user data...\n');
  console.log('   Connected integrations: gmail, slack');
  await delay(800);

  console.log(`\n   Answer:
   Your recent messages focus on three main topics: (1) The Q1 planning
   process — Sarah shared updated OKRs and is awaiting your feedback.
   (2) The API migration — Mike flagged a blocking issue in #engineering
   that needs review by Friday. (3) Customer onboarding — the design team
   shared new mockups in Slack and Lisa requested your sign-off.`);

  console.log('\n   (Based on 23 messages, 2 meetings, 1 event)');

  printNextSteps();
  console.log('To run with real data, add your credentials to .env.\n');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printNextSteps(): void {
  console.log('\n==================');
  console.log('Quickstart complete!\n');
  console.log('Next steps:');
  console.log('- Explore the SDK: https://attrove.com/docs/sdk');
  console.log('- Try hosted MCP: npx @attrove/cli install claude-code');
  console.log('- View the API reference: https://attrove.com/docs/api-reference\n');
}

function waitForEnter(): Promise<void> {
  if (!process.stdin.isTTY) {
    return Promise.resolve();
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

main().catch((err: unknown) => {
  if (err instanceof AuthenticationError) {
    console.error('Authentication Error:', err.message);
    console.error('  Check your ATTROVE_CLIENT_ID and ATTROVE_CLIENT_SECRET');
    console.error('  Get credentials at: https://connect.attrove.com/keys');
  } else if (err instanceof RateLimitError) {
    console.error('Rate Limited:', err.message);
    const waitTime = err.retryAfter ?? 60;
    console.error(`  Please wait ${waitTime} seconds before retrying`);
  } else if (isAttroveError(err)) {
    console.error(`API Error [${err.code}]:`, err.message);
    if (err.status) {
      console.error(`  HTTP Status: ${err.status}`);
    }
  } else if (err instanceof Error) {
    console.error('Error:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  } else {
    console.error('Unknown error:', err);
  }
  process.exit(1);
});
