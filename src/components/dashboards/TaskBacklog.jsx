'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import { PRIORITY_COLORS } from '@/lib/constants';

export function TaskBacklog({ tasks = [], onComplete, onEdit }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30">
          <Checkbox
            checked={task.status === 'done'}
            onCheckedChange={() => onComplete?.(task.id)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-muted-foreground')}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('inline-block h-2 w-2 rounded-full', PRIORITY_COLORS[task.priority])} />
              <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
              {task.due_date && (
                <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
              )}
              {task.module && <Badge variant="outline" className="text-[10px]">{task.module}</Badge>}
            </div>
          </div>
        </div>
      ))}
      {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>}
    </div>
  );
}
