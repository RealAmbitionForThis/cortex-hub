/**
 * Model-family thinking profiles.
 *
 * Each profile defines how thinking/reasoning is controlled for a specific
 * model family, including the API parameters required and the UI levels
 * available to the user.
 *
 * Detection order: model name pattern match → llama-server chat template → generic fallback.
 */

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export const THINKING_PROFILES = {
  qwen: {
    id: 'qwen',
    label: 'Qwen',
    match: /qwen|qwq/i,
    templateMatch: /chatml/i, // Qwen uses chatml template in llama-server
    levels: [
      { value: 'off',  label: 'No Thinking', description: 'Thinking disabled',  color: 'text-green-500' },
      { value: 'on',   label: 'Think',       description: 'Thinking enabled',   color: 'text-yellow-500' },
    ],
    defaultLevel: 'on',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    match: /deepseek/i,
    templateMatch: /deepseek/i,
    levels: [
      { value: 'off',  label: 'No Thinking', description: 'Thinking disabled',  color: 'text-green-500' },
      { value: 'on',   label: 'Think',       description: 'Deep reasoning',     color: 'text-yellow-500' },
    ],
    defaultLevel: 'on',
  },
  gptoss: {
    id: 'gptoss',
    label: 'GPT-OSS',
    match: /gpt-?oss/i,
    levels: [
      { value: 'low',    label: 'Low',    description: 'Minimal reasoning',  color: 'text-green-500' },
      { value: 'medium', label: 'Medium', description: 'Standard reasoning', color: 'text-yellow-500' },
      { value: 'high',   label: 'High',   description: 'Deep reasoning',     color: 'text-red-500' },
    ],
    defaultLevel: 'medium',
  },
  kimi: {
    id: 'kimi',
    label: 'Kimi',
    match: /kimi|k2|moonshot/i,
    levels: [
      { value: 'instant',  label: 'Instant',  description: 'Fast, no reasoning trace',    color: 'text-green-500' },
      { value: 'thinking', label: 'Thinking',  description: 'Deep thinking with reasoning', color: 'text-yellow-500' },
    ],
    defaultLevel: 'thinking',
  },
  commandr: {
    id: 'commandr',
    label: 'Command R',
    match: /command-?r/i,
    levels: [
      { value: 'off',  label: 'No Thinking', description: 'Thinking disabled',  color: 'text-green-500' },
      { value: 'on',   label: 'Think',       description: 'Thinking enabled',   color: 'text-yellow-500' },
    ],
    defaultLevel: 'on',
  },
  generic: {
    id: 'generic',
    label: 'Default',
    match: null,
    levels: [
      { value: 'off',  label: 'No Thinking', description: 'Thinking disabled',   color: 'text-green-500' },
      { value: 'on',   label: 'Think',       description: 'Standard thinking',   color: 'text-yellow-500' },
      { value: 'max',  label: 'Think+',      description: 'Extended thinking',    color: 'text-red-500' },
    ],
    defaultLevel: 'on',
  },
};

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Detect model family from model name string.
 * Returns the profile id (e.g. 'qwen', 'deepseek', 'gptoss', 'generic').
 */
export function detectModelFamily(modelName) {
  if (!modelName) return 'generic';
  const name = modelName.toLowerCase();
  for (const profile of Object.values(THINKING_PROFILES)) {
    if (profile.match && profile.match.test(name)) return profile.id;
  }
  return 'generic';
}

// ---------------------------------------------------------------------------
// Parameter mapping — converts (family, level) → backend-specific params
// ---------------------------------------------------------------------------

/**
 * Build the thinking parameters for Ollama.
 * Ollama uses `think: true/false` natively and handles model-specific
 * behavior internally.
 */
export function buildOllamaThinkParam(family, level) {
  if (family === 'gptoss') {
    // Ollama doesn't run GPT-OSS, but in case someone names a model this way
    return level === 'low' ? false : true;
  }
  if (family === 'kimi') {
    return level === 'thinking';
  }
  // For qwen, deepseek, commandr, generic: off = false, anything else = true
  return level !== 'off';
}

/**
 * Build the thinking parameters for llama-server.
 * Returns an object of extra body keys to merge into the request.
 */
export function buildLlamacppThinkParams(family, level) {
  switch (family) {
    case 'qwen':
      return {
        chat_template_kwargs: { enable_thinking: level !== 'off' },
      };

    case 'deepseek':
      return {
        reasoning_budget: level === 'off' ? 0 : -1,
      };

    case 'gptoss':
      return {
        chat_template_kwargs: { reasoning_effort: level || 'medium' },
      };

    case 'kimi':
      // Kimi on llama-server: thinking mode uses temp=1.0, instant uses temp=0.6
      return level === 'thinking'
        ? { temperature: 1.0 }
        : { temperature: 0.6 };

    case 'commandr':
      return {
        chat_template_kwargs: { enable_thinking: level !== 'off' },
      };

    case 'generic':
    default:
      if (level === 'off') return { reasoning_budget: 0 };
      if (level === 'max') return { reasoning_budget: -1 };
      return { reasoning_budget: -1 };
  }
}
