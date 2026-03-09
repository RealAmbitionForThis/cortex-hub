'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ExportSettings({ settings, onSave }) {
  const [defaultFormat, setDefaultFormat] = useState(settings.export_default_format || 'xlsx');
  const [exportDir, setExportDir] = useState(settings.export_dir || './exports');

  useEffect(() => {
    setDefaultFormat(settings.export_default_format || 'xlsx');
    setExportDir(settings.export_dir || './exports');
  }, [settings]);

  function handleSave() {
    onSave({ export_default_format: defaultFormat, export_dir: exportDir });
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Export Settings</h3>
      <div className="space-y-2">
        <Label>Default Format</Label>
        <Select value={defaultFormat} onValueChange={setDefaultFormat}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
            <SelectItem value="csv">CSV (.csv)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Export Directory</Label>
        <Input value={exportDir} onChange={(e) => setExportDir(e.target.value)} />
      </div>
      <Button onClick={handleSave}>Save Export Settings</Button>
    </div>
  );
}
