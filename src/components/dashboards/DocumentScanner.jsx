'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/shared/FileUpload';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ScanLine } from 'lucide-react';

export function DocumentScanner({ onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState('receipt');
  const [result, setResult] = useState(null);

  async function handleScan(files) {
    const file = files[0];
    if (!file) return;
    setScanning(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', scanType);

    try {
      const res = await fetch('/api/documents/scan', { method: 'POST', body: formData });
      const data = await res.json();
      setResult(data.result || data);
      if (onScanComplete) onScanComplete(data);
    } catch {
      setResult({ error: 'Scan failed' });
    }
    setScanning(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ScanLine className="h-4 w-4" /> Document Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={scanType} onValueChange={setScanType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="business_card">Business Card</SelectItem>
          </SelectContent>
        </Select>
        <FileUpload onUpload={handleScan} accept="image/*" />
        {scanning && <LoadingSpinner />}
        {result && (
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
