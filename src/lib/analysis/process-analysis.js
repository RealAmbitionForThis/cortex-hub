import { getToolDefinitions, getAllToolNames } from '@/lib/tools/registry';
import { retrieveRelevantMemories } from '@/lib/memory/retrieval';
import { preFetchData } from './pre-fetch-data';

/**
 * Parses the raw LLM response text into a structured analysis result.
 * Handles markdown-wrapped JSON, preamble text, etc.
 */
export function parseAnalysisResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // Try direct parse first
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to regex extraction
  }

  // Try extracting JSON from markdown code blocks
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch?.[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Fall through
    }
  }

  // Try extracting the first JSON object from the text
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch?.[0]) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Fall through
    }
  }

  return null;
}

/**
 * Validates and normalizes the parsed analysis result.
 */
function normalizeAnalysis(parsed) {
  return {
    primary_intent: typeof parsed.primary_intent === 'string' ? parsed.primary_intent : 'unknown',
    secondary_intents: Array.isArray(parsed.secondary_intents) ? parsed.secondary_intents : [],
    modules: Array.isArray(parsed.modules) ? parsed.modules : [],
    is_conversational: parsed.is_conversational === true,
    confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
    ambiguity: typeof parsed.ambiguity === 'string' ? parsed.ambiguity : null,
    memory_keywords: Array.isArray(parsed.memory_keywords) ? parsed.memory_keywords : [],
    required_context: {
      recent_data: Array.isArray(parsed.required_context?.recent_data) ? parsed.required_context.recent_data : [],
    },
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
  };
}

/**
 * Gets the unique module namespaces from the tool registry.
 */
export function getAvailableModules() {
  const names = getAllToolNames();
  const namespaces = new Set();
  for (const name of names) {
    const dot = name.indexOf('.');
    if (dot > 0) {
      namespaces.add(name.slice(0, dot));
    }
  }
  return Array.from(namespaces);
}

/**
 * Filters tool definitions to only include tools from the specified modules.
 * Always includes memory.* tools as fallback.
 */
function filterToolsByModules(modules) {
  const allTools = getToolDefinitions();

  if (!modules || modules.length === 0 || modules.includes('none')) {
    // Conversational — no tools
    return [];
  }

  // Always include memory tools
  const allowedNamespaces = new Set(modules);
  allowedNamespaces.add('memory');

  return allTools.filter(tool => {
    const name = tool.function?.name ?? '';
    const dot = name.indexOf('.');
    if (dot <= 0) return false;
    const namespace = name.slice(0, dot);
    return allowedNamespaces.has(namespace);
  });
}

/**
 * Processes the analysis result and produces enriched context for the main LLM call.
 */
export async function processAnalysis(rawText, userMessage) {
  const parsed = parseAnalysisResponse(rawText);
  if (!parsed) return null;

  const analysis = normalizeAnalysis(parsed);

  // 1. Filter tools based on detected modules
  const filteredTools = filterToolsByModules(analysis.modules);

  // 2. Fetch memories — standard similarity + keyword searches
  let memories = [];
  try {
    // Standard vector similarity with user's raw message
    const standardMemories = await retrieveRelevantMemories({ query: userMessage });
    memories = [...standardMemories];

    // Additional keyword-based memory searches
    for (const keyword of analysis.memory_keywords) {
      try {
        const keywordMemories = await retrieveRelevantMemories({ query: keyword, limit: 5 });
        memories = [...memories, ...keywordMemories];
      } catch {
        // Skip failed keyword searches
      }
    }

    // Deduplicate by memory ID, keep top 15
    const seen = new Set();
    const deduped = [];
    for (const mem of memories) {
      const memId = mem.id ?? mem.content;
      if (!seen.has(memId)) {
        seen.add(memId);
        deduped.push(mem);
      }
    }
    memories = deduped.slice(0, 15);
  } catch (err) {
    console.error('[analysis] Memory retrieval failed:', err?.message ?? err);
  }

  // 3. Pre-fetch data based on required_context
  const preFetchedData = preFetchData(analysis.required_context.recent_data);

  // 4. Build analysis summary for system prompt injection
  let analysisSummary = `The user wants to: ${analysis.primary_intent}`;
  if (analysis.secondary_intents.length > 0) {
    analysisSummary += `\nThey also want to: ${analysis.secondary_intents.join(', ')}`;
  }
  if (analysis.ambiguity) {
    analysisSummary += `\n⚠ AMBIGUITY DETECTED: ${analysis.ambiguity}. Ask the user to clarify before proceeding.`;
  }
  if (Object.keys(preFetchedData).length > 0) {
    analysisSummary += '\nRelevant pre-fetched data is provided below in <pre_fetched_context>. Use it directly — do not call tools to re-fetch this data.';
  }

  // 5. Build ambiguity note
  let ambiguityNote = null;
  if (analysis.confidence < 50) {
    ambiguityNote = "The user's message is ambiguous. Ask for clarification before taking any action. Do NOT assume intent. Do NOT call tools based on guesses.";
  } else if (analysis.ambiguity) {
    ambiguityNote = analysis.ambiguity;
  }

  return {
    analysis,
    filteredTools,
    memories,
    preFetchedData,
    analysisSummary,
    ambiguityNote,
  };
}
