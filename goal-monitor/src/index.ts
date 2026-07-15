/**
 * Goal Monitor
 *
 * Creates a user-scoped outcome goal, attaches manual evidence, queues an
 * evaluation, and shows how to inspect status, evidence, and goal events.
 *
 * Usage:
 *   npm start -- "ACME renewal"
 *   npm start
 */

import 'dotenv/config';
import {
  Attrove,
  type ApiKeyFormat,
  AuthenticationError,
  GoalInvalidScopeError,
  GoalTerminalStateError,
  RateLimitError,
  isAttroveError,
} from '@attrove/sdk';

const secretKey = process.env.ATTROVE_SECRET_KEY;
const userId = process.env.ATTROVE_USER_ID;
const baseUrl = process.env.ATTROVE_BASE_URL;
const title = process.argv.slice(2).join(' ').trim() || 'ACME renewal';

if (!secretKey || !userId) {
  console.error('Missing ATTROVE_SECRET_KEY or ATTROVE_USER_ID.');
  console.error('Copy .env.example to .env and add a per-user sk_ token.');
  process.exit(1);
}

const client = new Attrove({
  apiKey: secretKey as ApiKeyFormat,
  userId,
  ...(baseUrl ? { baseUrl } : {}),
});

function deadlineInDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function compactList(values: readonly string[]): string {
  return values.length === 0 ? 'none' : values.join(', ');
}

async function main(): Promise<void> {
  console.log(`Creating goal: ${title}`);

  const goal = await client.goals.create({
    title,
    description:
      'Track a concrete customer or project outcome from connected communications.',
    watchScope: {
      seedQuery: title,
      keywords: title.split(/\s+/).filter(Boolean),
      sourceTypes: ['messages', 'meetings', 'notes'],
      silenceCondition: {
        quietAfterDays: 5,
        activitySources: ['messages', 'meetings', 'notes'],
        alertHealth: 'at_risk',
      },
    },
    successCriteria:
      'The owner has enough evidence to mark the outcome complete.',
    completionCondition:
      'A signed agreement, explicit yes/no decision, or equivalent final update is captured.',
    deadline: deadlineInDays(14),
  });

  console.log(`Created ${goal.id} (${goal.lifecycle}, ${goal.health})`);

  await client.goals.addNote(goal.id, {
    title: 'Manual context',
    body: 'Initial tracking note from the goal-monitor example. Replace this with a real customer call, CRM note, or project update.',
    metadata: { source: 'attrove-goal-monitor-example' },
  });
  console.log('Attached one manual note as evidence.');

  const run = await client.goals.evaluate(goal.id);
  console.log(`Queued evaluator run ${run.runId} (${run.status}).`);

  const current = await client.goals.get(goal.id);
  console.log('\nCurrent status');
  console.log(`- lifecycle: ${current.lifecycle}`);
  console.log(`- health: ${current.health}`);
  console.log(`- last run: ${current.lastRun?.status ?? 'none'}`);
  console.log(
    `- summary: ${current.lastSnapshot?.summary ?? 'no snapshot yet'}`,
  );

  const evidence = await client.goals.evidence(goal.id);
  console.log('\nEvidence');
  console.log(`- cited refs: ${evidence.citedInLatestSnapshot.length}`);
  console.log(`- manual notes: ${evidence.manualNotes.length}`);

  const { data: activeGoals } = await client.goals.list({
    lifecycle: 'active',
    limit: 10,
  });
  console.log('\nActive goals');
  for (const item of activeGoals) {
    console.log(`- ${item.id}: ${item.title} (${item.health})`);
  }

  const events = await client.goals.events({
    types: ['goals.created', 'goals.risk_detected', 'goals.completed'],
    limit: 10,
  });
  console.log('\nRecent goal events');
  console.log(`- events: ${events.data.length}`);
  if (events.watermark) {
    console.log(
      `- watermark: since=${events.watermark.occurredAt}, sinceEventId=${events.watermark.eventId}`,
    );
  }
  console.log(
    `- event types: ${compactList(events.data.map((event) => event.eventType))}`,
  );

  console.log('\nLeave the goal active so Attrove can keep evaluating it.');
  console.log(
    'When it is no longer useful, archive or cancel it with the SDK.',
  );
}

main().catch((err: unknown) => {
  if (err instanceof AuthenticationError) {
    console.error('Authentication Error:', err.message);
    console.error('  Check ATTROVE_SECRET_KEY and ATTROVE_USER_ID.');
  } else if (err instanceof GoalInvalidScopeError) {
    console.error('Goal Scope Error:', err.message);
    console.error(
      '  Provide at least one valid entityIds, seedQuery, or keywords anchor.',
    );
  } else if (err instanceof GoalTerminalStateError) {
    console.error('Goal State Error:', err.message);
    console.error('  Terminal goals cannot be evaluated or mutated.');
  } else if (err instanceof RateLimitError) {
    console.error('Rate Limited:', err.message);
    const waitTime = err.retryAfter ?? 60;
    console.error(`  Please wait ${waitTime} seconds before retrying.`);
  } else if (isAttroveError(err)) {
    console.error(`API Error [${err.code}]:`, err.message);
    if (err.status) console.error(`  HTTP Status: ${err.status}`);
  } else if (err instanceof Error) {
    console.error('Error:', err.message);
  } else {
    console.error('Unknown error:', err);
  }
  process.exit(1);
});
