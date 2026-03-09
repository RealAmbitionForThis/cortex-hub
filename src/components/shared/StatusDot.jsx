import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  connected: 'bg-green-500',
  disconnected: 'bg-red-500',
  pending: 'bg-yellow-500',
  default: 'bg-gray-500',
};

export function StatusDot({ status = 'default', className }) {
  return (
    <span className={cn('inline-block h-2 w-2 rounded-full', STATUS_COLORS[status] || STATUS_COLORS.default, className)} />
  );
}
