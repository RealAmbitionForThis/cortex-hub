'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils/format';

export function BudgetProgress({ budgets = [], spending = [] }) {
  const spendingMap = {};
  for (const s of spending) {
    spendingMap[s.category] = s.total;
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Budget Progress</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No budgets set</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Budget Progress</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((b) => {
          const spent = spendingMap[b.category] || 0;
          const percent = Math.min(100, Math.round((spent / b.monthly_limit) * 100));
          const isOver = spent > b.monthly_limit;

          return (
            <div key={b.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium capitalize">{b.category}</span>
                <span className={isOver ? 'text-destructive' : 'text-muted-foreground'}>
                  {formatCurrency(spent)} / {formatCurrency(b.monthly_limit)}
                </span>
              </div>
              <Progress value={percent} className={isOver ? '[&>div]:bg-destructive' : ''} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
