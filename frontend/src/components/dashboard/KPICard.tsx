import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { formatNumber, formatCurrency, formatLatency } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  format?: 'number' | 'currency' | 'latency' | 'percentage' | 'raw';
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  format = 'raw', 
  trend, 
  icon,
  className 
}: KPICardProps) {
  let formattedValue: string;
  
  if (typeof value === 'number') {
    switch (format) {
      case 'number':
        formattedValue = formatNumber(value);
        break;
      case 'currency':
        formattedValue = formatCurrency(value);
        break;
      case 'latency':
        formattedValue = formatLatency(value);
        break;
      case 'percentage':
        formattedValue = `${(value * 100).toFixed(1)}%`;
        break;
      default:
        formattedValue = value.toString();
    }
  } else {
    formattedValue = value === '' || value === null || value === undefined ? 'N/A' : String(value);
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              {formattedValue}
            </p>
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                <span className={cn(
                  'font-medium',
                  trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}