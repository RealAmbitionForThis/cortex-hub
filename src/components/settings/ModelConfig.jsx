'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useOllama } from '@/hooks/useOllama';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { SAMPLING_PARAMS, PARAM_GROUPS, getDefaults } from '@/lib/sampling-params';

export function ModelConfig({ settings, onSave }) {
  const { models, refresh, loading } = useOllama();
  const [mainModel, setMainModel] = useState(settings.main_model || '');
  const [visionModel, setVisionModel] = useState(settings.vision_model || '');
  const [embeddingModel, setEmbeddingModel] = useState(settings.embedding_model || '');

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
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
