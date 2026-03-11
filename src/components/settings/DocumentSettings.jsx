'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export function DocumentSettings({ settings, onSave }) {
  const [autoCateg, setAutoCateg] = useState(settings.doc_auto_categorize !== false);
  const [autoTx, setAutoTx] = useState(settings.doc_auto_transactions !== false);
  const [chunkSize, setChunkSize] = useState(settings.doc_chunk_size || 500);

  useEffect(() => {
    setAutoCateg(settings.doc_auto_categorize !== false);
    setAutoTx(settings.doc_auto_transactions !== false);
    setChunkSize(settings.doc_chunk_size || 500);
  }, [settings]);

  function handleSave() {
    onSave({ doc_auto_categorize: autoCateg, doc_auto_transactions: autoTx, doc_chunk_size: chunkSize });
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Document Settings</h3>
      <div className="flex items-center gap-3"><Switch checked={autoCateg} onCheckedChange={setAutoCateg} /><Label>Auto-categorize documents</Label></div>
      <div className="flex items-center gap-3"><Switch checked={autoTx} onCheckedChange={setAutoTx} /><Label>Auto-create transactions from receipts</Label></div>
      <div className="space-y-2">
        <Label>Chunk Size: {chunkSize}</Label>
        <Slider min={100} max={2000} step={50} value={[chunkSize]} onValueChange={([v]) => setChunkSize(v)} />
      </div>
      <Button onClick={handleSave}>Save Document Settings</Button>
    </div>
  );
}
