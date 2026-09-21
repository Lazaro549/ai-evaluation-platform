import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getScoreColor, getScoreBg, getMetricTypeBadge } from '@/lib/utils';
import type { MetricResult } from '@/api/types';

interface MetricCardProps {
  metric: MetricResult;
  className?: string;
}

export function MetricCard({ metric, className }: MetricCardProps) {
  const typeBadge = getMetricTypeBadge(metric.metric_type);
  const scoreColor = getScoreColor(metric.score);
  const scoreBg = getScoreBg(metric.score);

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm">{metric.name}</h4>
          <Badge variant="outline" className={cn(typeBadge.className, 'text-xs')}>
            {typeBadge.label}
          </Badge>
        </div>
        <div className="flex items-baseline justify-between mb-2">
          <span className={cn('text-3xl font-bold tabular-nums', scoreColor)}>
            {metric.score.toFixed(2)}
          </span>
          <Badge 
            variant={metric.passed ? 'success' : 'destructive'} 
            className="text-xs"
          >
            {metric.passed ? 'Pass' : 'Fail'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-auto line-clamp-2">{metric.reason}</p>
      </CardContent>
    </Card>
  );
}