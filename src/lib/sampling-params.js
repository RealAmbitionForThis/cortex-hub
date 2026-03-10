// Shared sampling parameter definitions used by chat input popover, settings page, and API route.
// All LLM options flow through the provider wrapper (src/lib/llm/provider.js).

export const SAMPLING_PARAMS = {
  temperature:      { key: 'temperature',      label: 'Temperature',       type: 'slider', default: 0.7,  min: 0,    max: 2,      step: 0.05, group: 'sampling',   desc: 'Lower = focused, higher = creative' },
  top_p:            { key: 'top_p',             label: 'Top P',             type: 'slider', default: 0.9,  min: 0,    max: 1,      step: 0.05, group: 'sampling',   desc: 'Nucleus sampling cutoff' },
  top_k:            { key: 'top_k',             label: 'Top K',             type: 'slider', default: 40,   min: 0,    max: 200,    step: 1,    group: 'sampling',   desc: 'Limit to top K tokens (0 = disabled)' },
  min_p:            { key: 'min_p',             label: 'Min P',             type: 'slider', default: 0.0,  min: 0,    max: 1,      step: 0.05, group: 'sampling',   desc: 'Minimum probability threshold' },
  num_ctx:          { key: 'num_ctx',           label: 'Context Window',    type: 'slider', default: 4096, min: 1024, max: 131072, step: 1024, group: 'generation', desc: 'Max tokens for context' },
  num_predict:      { key: 'num_predict',       label: 'Max Tokens',        type: 'number', default: -1,   min: -1,   max: 32768,  step: 1,    group: 'generation', desc: 'Max tokens to generate (-1 = unlimited)' },
  seed:             { key: 'seed',              label: 'Seed',              type: 'number', default: -1,   min: -1,   max: 999999, step: 1,    group: 'generation', desc: 'Reproducibility seed (-1 = random)' },
  stop:             { key: 'stop',              label: 'Stop Sequences',    type: 'tags',   default: [],                            group: 'generation', desc: 'Comma-separated stop strings' },
  repeat_penalty:   { key: 'repeat_penalty',    label: 'Repeat Penalty',    type: 'slider', default: 1.1,  min: 0,    max: 2,      step: 0.05, group: 'penalties',  desc: 'Penalize repeated tokens' },
  presence_penalty: { key: 'presence_penalty',  label: 'Presence Penalty',  type: 'slider', default: 0.0,  min: 0,    max: 2,      step: 0.05, group: 'penalties',  desc: 'Penalize topics already mentioned' },
  mirostat:         { key: 'mirostat',          label: 'Mirostat',          type: 'select', default: 0,    options: [0, 1, 2],      group: 'advanced',   desc: 'Mirostat algorithm (0 = off)' },
  mirostat_tau:     { key: 'mirostat_tau',      label: 'Mirostat Tau',      type: 'slider', default: 5.0,  min: 0,    max: 10,     step: 0.1,  group: 'advanced',   desc: 'Target entropy for mirostat' },
  mirostat_eta:     { key: 'mirostat_eta',      label: 'Mirostat Eta',      type: 'slider', default: 0.1,  min: 0,    max: 1,      step: 0.01, group: 'advanced',   desc: 'Learning rate for mirostat' },
  tfs_z:            { key: 'tfs_z',             label: 'TFS Z',             type: 'slider', default: 1.0,  min: 0,    max: 2,      step: 0.05, group: 'advanced',   desc: 'Tail free sampling (1 = disabled)' },
};

export const PARAM_GROUPS = [
  { id: 'sampling',    label: 'Sampling' },
  { id: 'generation',  label: 'Generation' },
  { id: 'penalties',   label: 'Penalties' },
  { id: 'advanced',    label: 'Advanced' },
];

export function getDefaults() {
  const defaults = {};
  for (const p of Object.values(SAMPLING_PARAMS)) {
    defaults[p.key] = p.default;
  }
  return defaults;
}

// Build the Ollama-format options object, only including non-default values
export function buildOllamaOptions(settings) {
  const opts = {};
  for (const p of Object.values(SAMPLING_PARAMS)) {
    const val = settings[p.key];
    if (val === undefined) continue;
    if (p.type === 'tags') {
      if (Array.isArray(val) && val.length > 0) opts[p.key] = val;
    } else if (val !== p.default) {
      opts[p.key] = val;
    }
  }
  return opts;
}
