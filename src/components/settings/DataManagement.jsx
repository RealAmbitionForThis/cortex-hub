'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Download, Trash2, AlertTriangle } from 'lucide-react';

export function DataManagement() {
  const [resetTarget, setResetTarget] = useState(null);
  const [showNuclear, setShowNuclear] = useState(false);

  async function handleExportAll() {
    window.open('/api/exports?module=all&format=json', '_blank');
  }

  async function handleReset(module) {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [`reset_${module}`]: true }),
    });
    setResetTarget(null);
  }

  const modules = ['money', 'health', 'vehicle', 'contacts', 'tasks', 'documents', 'memories'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Data Management</h3>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleExportAll}>
          <Download className="h-4 w-4 mr-2" /> Export All Data
        </Button>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Reset Individual Modules</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {modules.map((m) => (
            <Button key={m} variant="outline" size="sm" className="justify-start" onClick={() => setResetTarget(m)}>
              <Trash2 className="h-4 w-4 mr-2" /> Reset {m}
            </Button>
          ))}
        </div>
      </div>

      <div className="border border-destructive rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h4 className="font-medium text-destructive">Danger Zone</h4>
        </div>
        <Button variant="destructive" onClick={() => setShowNuclear(true)}>
          Reset Everything
        </Button>
      </div>

      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={() => setResetTarget(null)}
        title={`Reset ${resetTarget}?`}
        description="This will permanently delete all data for this module."
        onConfirm={() => handleReset(resetTarget)}
        destructive
      />

      <ConfirmDialog
        open={showNuclear}
        onOpenChange={setShowNuclear}
        title="Reset Everything?"
        description="This will permanently delete ALL data. This cannot be undone."
        onConfirm={() => handleReset('all')}
        destructive
      />
    </div>
  );
}
