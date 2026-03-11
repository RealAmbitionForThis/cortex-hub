'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { daysUntil } from '@/lib/utils/date';
import { CheckCircle, Pencil, Trash2 } from 'lucide-react';

export function BillsUpcoming({ bills = [], onMarkPaid, onEditBill, onDeleteBill }) {
  if (bills.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Upcoming Bills</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No upcoming bills</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Upcoming Bills</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {bills.map((bill) => {
          const dueIn = daysUntil(bill.next_due);
          const isOverdue = dueIn !== null && dueIn < 0;
          const isDueSoon = dueIn !== null && dueIn <= 3;

          return (
            <div key={bill.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{bill.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatCurrency(bill.amount)}</span>
                  <span>{bill.frequency}</span>
                  {bill.auto_pay ? <Badge variant="secondary" className="text-[10px]">Auto</Badge> : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isOverdue ? 'destructive' : isDueSoon ? 'default' : 'secondary'}>
                  {isOverdue ? 'Overdue' : dueIn === 0 ? 'Due today' : `${dueIn}d`}
                </Badge>
                {!bill.paid_this_cycle && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMarkPaid?.(bill.id)}>
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                {bill.paid_this_cycle ? <CheckCircle className="h-4 w-4 text-green-500" /> : null}
                {onEditBill && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditBill(bill)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDeleteBill && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDeleteBill(bill)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
