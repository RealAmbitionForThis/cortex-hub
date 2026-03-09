'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';

export function ExportHistory({ exports }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Export History</CardTitle></CardHeader>
      <CardContent>
        {exports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exports yet</p>
        ) : (
          <div className="space-y-2">
            {exports.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <div>
                  <span className="font-medium">{e.filename}</span>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">{e.module}</Badge>
                    <Badge variant="outline">{e.format}</Badge>
                    <span className="text-xs text-muted-foreground">{e.row_count} rows</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <a href={`/api/exports?download=${encodeURIComponent(e.filename)}`}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
