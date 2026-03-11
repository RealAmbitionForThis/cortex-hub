'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useOllama } from '@/hooks/useOllama';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, RotateCcw, BrainCircuit } from 'lucide-react';
import { SAMPLING_PARAMS, PARAM_GROUPS, getDefaults } from '@/lib/sampling-params';

export function ModelConfig({ settings, onSave }) {
  const { models: ollamaModels, refresh, loading } = useOllama();
  const backend = settings.cortex_backend || 'ollama';
  const isLlamaCpp = backend === 'llamacpp';

  const llamaModelNames = useMemo(() => {
    try {
      const raw = settings.llamacpp_models;
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, [settings.llamacpp_models]);

  const models = useMemo(() => {
    const ollamaList = ollamaModels.map(m => ({ ...m, source: 'ollama' }));
    const serverList = llamaModelNames.map(name => ({ name, source: 'llama-server' }));
    if (isLlamaCpp) {
      const merged = [...serverList, ...ollamaList];
      return merged.filter((m, i, arr) => arr.findIndex(x => x.name === m.name) === i);
    }
    return ollamaList;
  }, [ollamaModels, llamaModelNames, isLlamaCpp]);

  const [mainModel, setMainModel] = useState(settings.main_model || '');
  const [visionModel, setVisionModel] = useState(settings.vision_model || '');
  const [embeddingModel, setEmbeddingModel] = useState(settings.embedding_model || '');
  const [extraAnalyzeEnabled, setExtraAnalyzeEnabled] = useState(settings.extra_analyze_enabled ?? true);
  const [showAnalyzerPanel, setShowAnalyzerPanel] = useState(settings.show_analyzer_panel ?? true);
  const [analysisTimeout, setAnalysisTimeout] = useState(settings.analysis_timeout ?? 10);

  const defaults = getDefaults();
  const [samplingDefaults, setSamplingDefaults] = useState(() => {
    const saved = {};
    for (const p of Object.values(SAMPLING_PARAMS)) {
      saved[p.key] = settings[`sampling_${p.key}`] ?? p.default;
    }
    return saved;
  });

  useEffect(() => {
    setMainModel(settings.main_model || '');
    setVisionModel(settings.vision_model || '');
    setEmbeddingModel(settings.embedding_model || '');
    setExtraAnalyzeEnabled(settings.extra_analyze_enabled ?? true);
    setShowAnalyzerPanel(settings.show_analyzer_panel ?? true);
    setAnalysisTimeout(settings.analysis_timeout ?? 10);
    const saved = {};
    for (const p of Object.values(SAMPLING_PARAMS)) {
      saved[p.key] = settings[`sampling_${p.key}`] ?? p.default;
    }
    setSamplingDefaults(saved);
  }, [settings]);

  function handleSave() {
    const samplingSettings = {};
    for (const p of Object.values(SAMPLING_PARAMS)) {
      samplingSettings[`sampling_${p.key}`] = samplingDefaults[p.key];
    }
    onSave({
      main_model: mainModel,
      vision_model: visionModel,
      embedding_model: embeddingModel,
      extra_analyze_enabled: extraAnalyzeEnabled,
      show_analyzer_panel: showAnalyzerPanel,
      analysis_timeout: analysisTimeout,
      ...samplingSettings,
    });
  }

  function updateParam(key, value) {
    setSamplingDefaults((prev) => ({ ...prev, [key]: value }));
  }

  const paramsByGroup = {};
  for (const p of Object.values(SAMPLING_PARAMS)) {
    if (!paramsByGroup[p.group]) paramsByGroup[p.group] = [];
    paramsByGroup[p.group].push(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Model Configuration</h3>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh Models
        </Button>
      </div>

      <ModelSelect label="Main Model" value={mainModel} onChange={setMainModel} models={models} />
      <ModelSelect label="Vision Model" value={visionModel} onChange={setVisionModel} models={models} />
      <ModelSelect label="Embedding Model" value={embeddingModel} onChange={setEmbeddingModel} models={models} />

      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="h-5 w-5 text-violet-500" />
          <h3 className="text-lg font-medium">Extra-Analyze (Pre-Analysis)</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          When enabled, every chat message goes through a quick analysis pass before the main response.
          This detects intent, selects only relevant tools, and pre-fetches context data for faster, more accurate responses.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Extra-Analyze</Label>
              <p className="text-xs text-muted-foreground">Default state for the chat toggle</p>
            </div>
            <Switch checked={extraAnalyzeEnabled} onCheckedChange={setExtraAnalyzeEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Analyzer Panel</Label>
              <p className="text-xs text-muted-foreground">Display analysis results above chat messages</p>
            </div>
            <Switch checked={showAnalyzerPanel} onCheckedChange={setShowAnalyzerPanel} />
          </div>
          <div className="space-y-2">
            <Label>Analysis Timeout (seconds)</Label>
            <Input
              type="number"
              value={analysisTimeout}
              onChange={(e) => setAnalysisTimeout(Math.max(1, Math.min(30, Number(e.target.value))))}
              min={1}
              max={30}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Max seconds to wait for analysis before falling back to standard flow (default: 10s)
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Default Sampling Parameters</h3>
          <Button variant="outline" size="sm" onClick={() => setSamplingDefaults(defaults)}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset All
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          These defaults are used as initial values in the chat settings popover.
        </p>

        {PARAM_GROUPS.map((group) => {
          const params = paramsByGroup[group.id];
          if (!params) return null;

          return (
            <div key={group.id} className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">{group.label}</h4>
              <div className="space-y-4">
                {params.map((p) => (
                  <SettingsParamControl
                    key={p.key}
                    param={p}
                    value={samplingDefaults[p.key]}
                    onChange={(v) => updateParam(p.key, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave}>Save Model Settings</Button>
    </div>
  );
}

function SettingsParamControl({ param, value, onChange }) {
  if (param.type === 'slider') {
    const display = Number.isInteger(param.step) ? value : value.toFixed(2);
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{param.label}</Label>
          <span className="text-sm text-muted-foreground font-mono">{display}</span>
        </div>
        <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={param.min} max={param.max} step={param.step} />
        <p className="text-xs text-muted-foreground">{param.desc}</p>
      </div>
    );
  }

  if (param.type === 'number') {
    return (
      <div className="space-y-2">
        <Label>{param.label}</Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={param.min}
          max={param.max}
          step={param.step}
        />
        <p className="text-xs text-muted-foreground">{param.desc}</p>
      </div>
    );
  }

  if (param.type === 'select') {
    return (
      <div className="space-y-2">
        <Label>{param.label}</Label>
        <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {param.options.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{param.desc}</p>
      </div>
    );
  }

  if (param.type === 'tags') {
    return (
      <div className="space-y-2">
        <Label>{param.label}</Label>
        <p className="text-xs text-muted-foreground">{param.desc}</p>
        <p className="text-xs text-muted-foreground italic">Configure per-chat in the chat settings popover</p>
      </div>
    );
  }

  return null;
}

function ModelSelect({ label, value, onChange, models }) {
  const [showManual, setShowManual] = useState(false);
  const hasModels = models.length > 0;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hasModels && !showManual ? (
        <>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.name} value={m.name}>
                  {m.name}{m.source ? ` (${m.source})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => setShowManual(true)}
          >
            Or type model name manually
          </button>
        </>
      ) : (
        <>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type model name..."
            className="text-sm"
          />
          {hasModels && (
            <button
              type="button"
              className="text-xs text-muted-foreground underline hover:text-foreground"
              onClick={() => setShowManual(false)}
            >
              Back to model list
            </button>
          )}
          {!hasModels && (
            <p className="text-xs text-muted-foreground">No models detected from backend. Type a model name manually.</p>
          )}
        </>
      )}
    </div>
  );
}
