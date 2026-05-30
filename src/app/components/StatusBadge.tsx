import type { ConversationStatus } from './types';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';

interface StatusBadgeProps {
  status: ConversationStatus;
  className?: string;
}

const statusConfig: Record<ConversationStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-950',
  },
  pending: {
    label: 'Pending',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-950',
  },
  closed: {
    label: 'Closed',
    className:
      'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('text-[11px] px-1.5 py-0 h-5 font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}
