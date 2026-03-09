'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useOllama } from '@/hooks/useOllama';
import { RefreshCw } from 'lucide-react';

export function ModelConfig({ settings, onSave }) {
  const { models, refresh, loading } = useOllama();
  const [mainModel, setMainModel] = useState(settings.main_model || '');
  const [visionModel, setVisionModel] = useState(settings.vision_model || '');
  const [embeddingModel, setEmbeddingModel] = useState(settings.embedding_model || '');
  const [temperature, setTemperature] = useState(settings.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(settings.max_tokens || 4096);

  useEffect(() => {
    setMainModel(settings.main_model || '');
    setVisionModel(settings.vision_model || '');
    setEmbeddingModel(settings.embedding_model || '');
  }, [settings]);

  function handleSave() {
    onSave({
      main_model: mainModel,
      vision_model: visionModel,
      embedding_model: embeddingModel,
      temperature,
      max_tokens: maxTokens,
    });
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

      <div className="space-y-2">
        <Label>Temperature: {temperature}</Label>
        <Slider min={0} max={2} step={0.1} value={[temperature]} onValueChange={([v]) => setTemperature(v)} />
      </div>

      <div className="space-y-2">
        <Label>Max Tokens: {maxTokens}</Label>
        <Slider min={256} max={32768} step={256} value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} />
      </div>

      <Button onClick={handleSave}>Save Model Settings</Button>
    </div>
  );
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
