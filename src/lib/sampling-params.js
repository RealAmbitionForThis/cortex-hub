// Shared sampling parameter definitions used by chat input popover, settings page, and API route.
// All LLM options flow through the provider wrapper (src/lib/llm/provider.js).
//
// Defaults are based on official Ollama docs (github.com/ollama/ollama/blob/main/docs/api.md)
// and llama.cpp server docs (github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md).
// Parameters marked [llama.cpp] are silently ignored by Ollama (removed in current versions)
// but fully supported by llama-server's /v1/chat/completions endpoint.

import { DEFAULT_CONTEXT_WINDOW } from './constants';

export const SAMPLING_PARAMS = {
  // --- Sampling ---
  temperature:      { key: 'temperature',      label: 'Temperature',       type: 'slider', default: 0.8,  min: 0,    max: 2,      step: 0.05, group: 'sampling',   desc: 'Lower = focused, higher = creative (default 0.8)' },
  top_p:            { key: 'top_p',             label: 'Top P',             type: 'slider', default: 0.9,  min: 0,    max: 1,      step: 0.05, group: 'sampling',   desc: 'Nucleus sampling — cumulative probability cutoff' },
  top_k:            { key: 'top_k',             label: 'Top K',             type: 'slider', default: 40,   min: 0,    max: 200,    step: 1,    group: 'sampling',   desc: 'Limit to top K most probable tokens (0 = disabled)' },
  min_p:            { key: 'min_p',             label: 'Min P',             type: 'slider', default: 0.0,  min: 0,    max: 1,      step: 0.05, group: 'sampling',   desc: 'Minimum probability relative to top token (0 = disabled)' },
  typical_p:        { key: 'typical_p',         label: 'Typical P',         type: 'slider', default: 1.0,  min: 0,    max: 1,      step: 0.05, group: 'sampling',   desc: 'Locally typical sampling threshold (1.0 = disabled)' },

  // --- Generation ---
  num_ctx:          { key: 'num_ctx',           label: 'Context Window',    type: 'slider', default: DEFAULT_CONTEXT_WINDOW, min: 1024, max: 131072, step: 1024, group: 'generation', desc: 'Max tokens for context (default 4096)' },
  num_predict:      { key: 'num_predict',       label: 'Max Tokens',        type: 'number', default: -1,   min: -1,   max: 32768,  step: 1,    group: 'generation', desc: 'Max tokens to generate (-1 = unlimited)' },
  num_batch:        { key: 'num_batch',         label: 'Batch Size',        type: 'number', default: 512,  min: 1,    max: 4096,   step: 1,    group: 'generation', desc: 'Prompt processing batch size (higher = faster, more VRAM)' },
  num_keep:         { key: 'num_keep',          label: 'Keep Tokens',       type: 'number', default: 0,    min: -1,   max: 8192,   step: 1,    group: 'generation', desc: 'Tokens kept from initial prompt on context shift (-1 = all, 0 = none)' },
  seed:             { key: 'seed',              label: 'Seed',              type: 'number', default: -1,   min: -1,   max: 999999, step: 1,    group: 'generation', desc: 'Reproducibility seed (-1 = random)' },
  stop:             { key: 'stop',              label: 'Stop Sequences',    type: 'tags',   default: [],                            group: 'generation', desc: 'Stop generation when these strings appear' },

  // --- Penalties ---
  repeat_penalty:   { key: 'repeat_penalty',    label: 'Repeat Penalty',    type: 'slider', default: 1.0,  min: 0,    max: 2,      step: 0.05, group: 'penalties',  desc: 'Penalize repeated token sequences (1.0 = off)' },
  repeat_last_n:    { key: 'repeat_last_n',     label: 'Repeat Last N',     type: 'number', default: 64,   min: -1,   max: 4096,   step: 1,    group: 'penalties',  desc: 'Lookback window for repeat penalty (-1 = num_ctx, 0 = disabled)' },
  frequency_penalty:{ key: 'frequency_penalty', label: 'Frequency Penalty', type: 'slider', default: 0.0,  min: 0,    max: 2,      step: 0.05, group: 'penalties',  desc: 'Penalize tokens by how often they appeared' },
  presence_penalty: { key: 'presence_penalty',  label: 'Presence Penalty',  type: 'slider', default: 0.0,  min: 0,    max: 2,      step: 0.05, group: 'penalties',  desc: 'Penalize tokens that already appeared at all' },
  tfs_z:            { key: 'tfs_z',             label: 'Tail Free Sampling',type: 'slider', default: 1.0,  min: 0,    max: 1,      step: 0.05, group: 'penalties',  desc: 'Tail-free sampling — filters low-probability tails (1.0 = disabled)' },

  // --- Hardware ---
  num_gpu:          { key: 'num_gpu',           label: 'GPU Layers',        type: 'number', default: -1,   min: -1,   max: 999,    step: 1,    group: 'hardware',   desc: 'Number of layers to offload to GPU (-1 = auto, 0 = CPU only)' },
  num_thread:       { key: 'num_thread',        label: 'CPU Threads',       type: 'number', default: 0,    min: 0,    max: 128,    step: 1,    group: 'hardware',   desc: 'CPU threads for generation (0 = auto-detect)' },
  low_vram:         { key: 'low_vram',          label: 'Low VRAM Mode',     type: 'toggle', default: false,                         group: 'hardware',   desc: 'Reduce VRAM usage at the cost of speed' },
  use_mmap:         { key: 'use_mmap',          label: 'Memory Mapping',    type: 'toggle', default: true,                          group: 'hardware',   desc: 'Memory-map model file for faster loading (recommended)' },
  keep_alive:       { key: 'keep_alive',        label: 'Keep Alive [Ollama]',type: 'text',  default: '5m',                          group: 'hardware',   desc: 'How long model stays loaded after last request (e.g. "5m", "1h", "-1" = forever, "0" = unload immediately)' },

  // --- Advanced (llama.cpp server only — ignored by Ollama) ---
  mirostat:         { key: 'mirostat',          label: 'Mirostat [llama.cpp]',     type: 'select', default: 0,    options: [0, 1, 2],      group: 'advanced',   desc: 'Mirostat perplexity control (0 = off, 1 = v1, 2 = v2)' },
  mirostat_tau:     { key: 'mirostat_tau',      label: 'Mirostat Tau [llama.cpp]', type: 'slider', default: 5.0,  min: 0,    max: 10,     step: 0.1,  group: 'advanced',   desc: 'Target entropy — lower = more focused' },
  mirostat_eta:     { key: 'mirostat_eta',      label: 'Mirostat Eta [llama.cpp]', type: 'slider', default: 0.1,  min: 0,    max: 1,      step: 0.01, group: 'advanced',   desc: 'Learning rate — how fast it adapts' },
  dynatemp_range:   { key: 'dynatemp_range',    label: 'Dynamic Temp Range [llama.cpp]', type: 'slider', default: 0.0, min: 0, max: 2, step: 0.05, group: 'advanced', desc: 'Dynamic temperature ± range (0 = disabled)' },
  cache_prompt:     { key: 'cache_prompt',      label: 'Cache Prompt [llama.cpp]', type: 'toggle', default: true,                          group: 'advanced',   desc: 'Reuse cached prompt for faster subsequent requests' },
};

export const PARAM_GROUPS = [
  { id: 'sampling',    label: 'Sampling' },
  { id: 'generation',  label: 'Generation' },
  { id: 'penalties',   label: 'Penalties' },
  { id: 'hardware',    label: 'Hardware (Ollama)' },
  { id: 'advanced',    label: 'Advanced (llama.cpp)' },
];

export function getDefaults() {
  const defaults = {};
  for (const p of Object.values(SAMPLING_PARAMS)) {
    defaults[p.key] = p.default;
  }
  return defaults;
}

// Build the Ollama-format options object, only including non-default values.
// Both Ollama and llama.cpp silently ignore unknown keys, so it's safe to
// include llama.cpp-only params when talking to Ollama.
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
