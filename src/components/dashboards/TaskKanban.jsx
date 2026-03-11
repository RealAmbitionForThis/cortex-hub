'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PRIORITY_COLORS } from '@/lib/constants';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'border-t-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-yellow-500' },
  { key: 'done', label: 'Done', color: 'border-t-green-500' },
];

export function TaskKanban({ tasks = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <Card key={col.key} className={cn('border-t-4', col.color)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                {col.label}
                <Badge variant="secondary">{colTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 min-h-[100px]">
              {colTasks.map((task) => (
                <div key={task.id} className="p-2 bg-muted/50 rounded border text-sm cursor-pointer hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_COLORS[task.priority])} />
                    <span className="font-medium truncate">{task.title}</span>
                  </div>
                  {task.due_date && <p className="text-xs text-muted-foreground mt-1">{task.due_date}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
