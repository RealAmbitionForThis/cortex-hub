import { REASONING_LEVELS } from '@/lib/constants';

const REASONING_INSTRUCTIONS = {
  [REASONING_LEVELS.LOW]: 'Respond quickly and concisely. Skip detailed analysis.',
  [REASONING_LEVELS.MEDIUM]: 'Balance thoroughness with efficiency.',
  [REASONING_LEVELS.HIGH]: 'Think deeply. Analyze thoroughly. Consider edge cases.',
};

export function buildSystemPrompt({ reasoningLevel = 'medium', memories = [], clusters = [], clusterMemories = [], tools = [] }) {
  const parts = [buildCorePrompt(reasoningLevel)];

  if (memories.length) {
    parts.push(buildMemorySection(memories));
  }

  if (clusters.length) {
    parts.push(buildClusterSection(clusters, clusterMemories));
  }

  if (tools.length) {
    parts.push(buildToolSection(tools));
  }

  parts.push(buildRulesSection());
  return parts.join('\n\n');
}

function buildCorePrompt(reasoningLevel) {
  return `You are Cortex, a personal AI assistant running locally on the user's machine. You have persistent memory and can remember everything the user tells you across all conversations.

## Reasoning Level
Current reasoning level: ${reasoningLevel}
${REASONING_INSTRUCTIONS[reasoningLevel] || REASONING_INSTRUCTIONS.medium}

## Your Capabilities
You can manage: finances (expenses, income, budgets, upcoming bills), health (meals, workouts, goals), vehicles (maintenance, fuel, costs), contacts (people, interactions, follow-ups), tasks (todo lists, backlogs, deadlines), documents (scan receipts, parse PDFs, search files), schedules (reminders, recurring jobs), and web searches.

You can send push notifications to the user's phone.
You can export data to Excel/CSV.
You can search the web for current information.`;
}

function buildMemorySection(memories) {
  const items = memories.map((m) => `- ${m.content}`).join('\n');
  return `## User Context (Memories)\n${items}`;
}

function buildClusterSection(clusters, clusterMemories) {
  const names = clusters.map((c) => `- ${c.name}: ${c.system_prompt_addition || ''}`).join('\n');
  const mems = clusterMemories.map((m) => `- ${m.content}`).join('\n');
  return `## Active Information Clusters\n${names}\n\n## Cluster Context\n${mems}`;
}

function buildToolSection(tools) {
  const defs = tools.map((t) => {
    const fn = t.function || t;
    return `- ${fn.name}: ${fn.description}`;
  }).join('\n');
  return `## Available Tools\n${defs}`;
}

function buildRulesSection() {
  return `## Rules
- Always use tools to store structured data. Don't just acknowledge — actually save it.
- Be conversational and brief. This is a chat, not a report.
- Reference memories naturally. Never say "according to my records" or "based on my memory."
- If unsure about a value (like calories), estimate and note the estimate.
- For reminders, confirm the schedule before setting it.
- Proactively suggest relevant things.
- When the user mentions spending money, always use money.add_transaction.
- When the user mentions a person, check if they're in contacts.
- When the user mentions something they need to do, suggest creating a task.
- For bills, alert about upcoming due dates proactively.`;
}
