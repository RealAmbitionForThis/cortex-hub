'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

export function DailyLogCalendar({ onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    fetch(`/api/daily-logs?month=${monthStr}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .catch(() => {});
  }, [currentMonth]);

  const logDates = new Set(logs.map((l) => l.date));
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  async function handleSelectDate(date) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const res = await fetch(`/api/daily-logs?date=${dateStr}`);
    const data = await res.json();
    setSelectedLog(data.log);
    onSelectDate?.(data.log);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="font-medium text-muted-foreground p-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array(days[0].getDay()).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasLog = logDates.has(dateStr);
            return (
              <button
                key={dateStr}
                onClick={() => handleSelectDate(day)}
                className={cn(
                  'p-1 text-sm rounded-md hover:bg-accent min-h-[32px]',
                  isToday(day) && 'font-bold',
                  hasLog && 'bg-primary/20'
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
        {selectedLog && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Summary</p>
            <p className="text-sm text-muted-foreground">{selectedLog.summary}</p>
            {selectedLog.mood && <p className="text-xs mt-2">Mood: {selectedLog.mood}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
