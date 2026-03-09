'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock } from 'lucide-react';

export function UpcomingFollowups({ followups, onSelect }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4" /> Upcoming Follow-ups
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {followups.map((f, i) => (
            <div
              key={`${f.id}-${i}`}
              className="flex-shrink-0 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 min-w-[180px]"
              onClick={() => onSelect(f.id)}
            >
              <p className="font-medium text-sm">{f.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.followup_notes || 'Follow up'}</p>
              <Badge variant="outline" className="mt-2 text-xs">{f.followup_date}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
