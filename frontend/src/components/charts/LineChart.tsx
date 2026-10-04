import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: ChartDataPoint[];
  lines: { dataKey: string; name: string; color?: string }[];
  xKey: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  yDomain?: [number | string, number | string];
  tooltipFormatter?: (value: number, name: string) => [string, string];
}

export function LineChartComponent({
  data,
  lines,
  xKey,
  height = 300,
  className,
  showLegend = true,
  yDomain,
  tooltipFormatter,
}: LineChartProps) {
  if (!data.length) {
    return (
      <div className={cn('h-[300px] flex items-center justify-center', className)}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
            domain={yDomain || ['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={tooltipFormatter}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => value}
            />
          )}
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || `hsl(var(--chart-${index + 1}))`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}