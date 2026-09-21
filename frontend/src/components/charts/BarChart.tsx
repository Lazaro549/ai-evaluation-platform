import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: ChartDataPoint[];
  series: { dataKey: string; name: string; color?: string }[];
  xKey: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  horizontal?: boolean;
  tooltipFormatter?: (value: number, name: string) => [string, string];
}

export function BarChartComponent({
  data,
  series,
  xKey,
  height = 300,
  className,
  showLegend = true,
  horizontal = false,
  tooltipFormatter,
}: BarChartProps) {
  if (!data.length) {
    return (
      <div className={cn('h-[300px] flex items-center justify-center', className)}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const colors = series.map((s) => s.color || `hsl(var(--chart-${series.indexOf(s) + 1}))`);

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={{ stroke: 'hsl(var(--border))' }} />
            <YAxis type="category" dataKey={xKey} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={tooltipFormatter}
            />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
            {series.map((s, i) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={colors[i]}
                radius={[0, 4, 4, 0]}
                maxBarSize={32}
              >
                {data.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={colors[i]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={tooltipFormatter}
            />
            {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
            {series.map((s, i) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={colors[i]}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              >
                {data.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={colors[i]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}