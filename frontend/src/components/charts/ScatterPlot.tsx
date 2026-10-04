import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ScatterDataPoint {
  x: number;
  y: number;
  name: string;
  [key: string]: string | number;
}

interface ScatterPlotProps {
  data: ScatterDataPoint[];
  xKey: 'x' | keyof ScatterDataPoint;
  yKey: 'y' | keyof ScatterDataPoint;
  xLabel: string;
  yLabel: string;
  height?: number;
  className?: string;
  colorBy?: string;
  colorScale?: Record<string, string>;
  tooltipFormatter?: (value: number, name: string, props: ScatterDataPoint) => React.ReactNode;
}

export function ScatterPlotComponent({
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  height = 350,
  className,
  colorBy,
  colorScale,
  tooltipFormatter,
}: ScatterPlotProps) {
  if (!data.length) {
    return (
      <div className={cn('h-[350px] flex items-center justify-center', className)}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const getColor = (point: ScatterDataPoint) => {
    if (colorBy && colorScale) {
      return colorScale[point[colorBy] as string] || 'hsl(var(--primary))';
    }
    return 'hsl(var(--primary))';
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            nameOffset={20}
            nameStyle={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            nameOffset={-10}
            nameStyle={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            orientation="left"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelFormatter={(_, payload) => {
              const point = payload[0]?.payload as ScatterDataPoint;
              return tooltipFormatter
                ? tooltipFormatter(point.x, point.y, point)
                : `${xLabel}: ${point.x.toFixed(2)}, ${yLabel}: ${point.y.toFixed(2)}`;
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Scatter
            name="Runs"
            data={data}
            fill="hsl(var(--primary))"
            shape="circle"
            customShape={{
              cx: ({ cx, cy, r }) => cx,
              cy: ({ cx, cy, r }) => cy,
              r: 6,
            }}
          >
            {data.map((point, index) => (
              <Scatter key={index} name={point.name} data={[point]} fill={getColor(point)}>
                {({ cx, cy, r }) => (
                  <circle cx={cx} cy={cy} r={r} fill={getColor(point)} opacity={0.8} stroke="hsl(var(--background))" strokeWidth={2} />
                )}
              </Scatter>
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}