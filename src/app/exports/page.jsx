'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ExportHistory } from '@/components/dashboards/ExportHistory';
import { FileUpload } from '@/components/shared/FileUpload';
import { useExports } from '@/hooks/useExports';
import { Download, Upload } from 'lucide-react';

const MODULES = [
  { value: 'transactions', label: 'Transactions' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'meals', label: 'Meals' },
  { value: 'workouts', label: 'Workouts' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'memories', label: 'Memories' },
];

export default function ExportsPage() {
  const { exports, loading, exportData } = useExports();
  const [selectedModule, setSelectedModule] = useState('transactions');
  const [format, setFormat] = useState('xlsx');
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  async function handleExport() {
    setExporting(true);
    await exportData(selectedModule, format);
    setExporting(false);
  }

  async function handleImport(files) {
    const formData = new FormData();
    formData.append('file', files[0]);
    try {
      const res = await fetch('/api/exports/import', { method: 'POST', body: formData });
      const data = await res.json();
      setImportResult(data);
    } catch {
      setImportResult({ error: 'Import failed' });
    }
  }

  if (loading) return <AppShell title="Exports"><LoadingSpinner /></AppShell>;

  return (
    <AppShell title="Exports">
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Export Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Module</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODULES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleExport} disabled={exporting} className="w-full">
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Import Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FileUpload onUpload={handleImport} accept=".csv,.xlsx,.xls" />
            {importResult && (
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                {JSON.stringify(importResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <ExportHistory exports={exports} />
      </div>
    </AppShell>
  );
}
