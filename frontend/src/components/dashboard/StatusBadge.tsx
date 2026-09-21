import { Badge } from '@/components/ui/Badge';
import { getStatusBadge, getScoreColor, cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const badge = getStatusBadge(status);
  return <Badge variant="outline" className={cn(badge.className, className)}>{badge.label}</Badge>;
}

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(getScoreColor(score), 'bg-transparent border-current', className)}
    >
      {score.toFixed(2)}
    </Badge>
  );
}

interface PassFailBadgeProps {
  passed: boolean;
  className?: string;
}

export function PassFailBadge({ passed, className }: PassFailBadgeProps) {
  return (
    <Badge variant={passed ? 'success' : 'destructive'} className={cn('text-xs', className)}>
      {passed ? 'Pass' : 'Fail'}
    </Badge>
  );
}