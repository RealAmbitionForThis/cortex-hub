'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export function MemorySettings({ settings, onSave }) {
  const [interval, setInterval] = useState(settings.memory_interval_ms || 300000);
  const [retrievalCount, setRetrievalCount] = useState(settings.memory_retrieval_count || 10);
  const [threshold, setThreshold] = useState(settings.memory_similarity_threshold || 0.92);
  const [autoAnalyze, setAutoAnalyze] = useState(settings.memory_auto_analyze !== false);
  const [dailyLogTime, setDailyLogTime] = useState(settings.daily_log_time || '23:59');

  useEffect(() => {
    setInterval(settings.memory_interval_ms || 300000);
    setRetrievalCount(settings.memory_retrieval_count || 10);
  }, [settings]);

  function handleSave() {
    onSave({
      memory_interval_ms: interval,
      memory_retrieval_count: retrievalCount,
      memory_similarity_threshold: threshold,
      memory_auto_analyze: autoAnalyze,
      daily_log_time: dailyLogTime,
    });
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Memory Settings</h3>

      <div className="space-y-2">
        <Label>Analysis Interval: {Math.round(interval / 60000)} minutes</Label>
        <Slider min={60000} max={1800000} step={60000} value={[interval]} onValueChange={([v]) => setInterval(v)} />
      </div>

      <div className="space-y-2">
        <Label>Retrieval Count: {retrievalCount}</Label>
        <Slider min={1} max={50} step={1} value={[retrievalCount]} onValueChange={([v]) => setRetrievalCount(v)} />
      </div>

      <div className="space-y-2">
        <Label>Similarity Threshold: {threshold}</Label>
        <Slider min={0.5} max={1} step={0.01} value={[threshold]} onValueChange={([v]) => setThreshold(v)} />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={autoAnalyze} onCheckedChange={setAutoAnalyze} />
        <Label>Auto-analyze conversations</Label>
      </div>

      <div className="space-y-2">
        <Label>Daily Log Time</Label>
        <Input type="time" value={dailyLogTime} onChange={(e) => setDailyLogTime(e.target.value)} />
      </div>

      <Button onClick={handleSave}>Save Memory Settings</Button>
    </div>
  );
}
