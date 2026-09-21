import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { evaluationsApi } from '@/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { BarChartComponent, ChartCard } from '@/components/charts';
import { formatDate, formatCurrency, formatLatency, getStatusBadge, getScoreColor, cn } from '@/lib/utils';
import type { EvaluationRun, RunComparisonResult } from '@/api/types';
import { GitCompare, TrendingUp, Clock, DollarSign, RefreshCw, ArrowLeft } from 'lucide-react';

export function Compare() {
  const { runAId, runBId } = useParams<{ runAId: string; runBId: string }>();
  const [comparison, setComparison] = useState<RunComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async () => {
    if (!runAId || !runBId) return;
    try { setLoading(true); setError(null); const data = await evaluationsApi.compare(runAId, runBId); setComparison(data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load comparison'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComparison(); }, [runAId, runBId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader title="Compare Runs" subtitle="Loading comparison…" action={<LoadingState message="" />} />
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-6 h-24"><LoadingState message="" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Compare Runs" subtitle="Comparison not found" />
        <ErrorState message={error || `Could not compare runs`} onRetry={fetchComparison} />
      </div>
    );
  }

  const { run_a, run_b, delta_score, delta_latency_ms, delta_cost_usd, delta_pass_rate } = comparison;
  const passRateA = run_a.total_cases ? (run_a.passed_cases / run_a.total_cases) * 100 : 0;
  const passRateB = run_b.total_cases ? (run_b.passed_cases / run_b.total_cases) * 100 : 0;

  const metricComparison = () => {
    const metricsA: Record<string, number[]> = {};
    const metricsB: Record<string, number[]> = {};
    run_a.results?.forEach(r => r.metrics.forEach(m => { if (!metricsA[m.name]) metricsA[m.name] = []; metricsA[m.name].push(m.score); }));
    run_b.results?.forEach(r => r.metrics.forEach(m => { if (!metricsB[m.name]) metricsB[m.name] = []; metricsB[m.name].push(m.score); }));
    const allMetrics = new Set([...Object.keys(metricsA), ...Object.keys(metricsB)]);
    return Array.from(allMetrics).map(name => {
      const avgA = metricsA[name]?.reduce((a, b) => a + b, 0) / (metricsA[name]?.length || 1) || 0;
      const avgB = metricsB[name]?.reduce((a, b) => a + b, 0) / (metricsB[name]?.length || 1) || 0;
      return { name, avgA, avgB, delta: avgB - avgA };
    });
  };

  const perMetricData = metricComparison();

  const formatDelta = (value: number, formatter: (v: number) => string, higherIsBetter = true) => {
    const isPos = value > 0, isNeg = value < 0;
    const color = (isPos && higherIsBetter) || (isNeg && !higherIsBetter) ? 'text-green-600 dark:text-green-400'
      : (isNeg && higherIsBetter) || (isPos && !higherIsBetter) ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground';
    const prefix = value > 0 ? '+' : '';
    return <span className={cn('font-mono font-medium', color)}>{prefix}{formatter(value)}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeader title="Compare Runs" subtitle="Side-by-side evaluation comparison" action={<div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={fetchComparison}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button><Link to="/experiments"><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Experiments</Button></Link></div>} />
      <div className="grid gap-6 lg:grid-cols-2">
        {[{ run: run_a, label: 'Run A', color: 'bg-blue-500/10 border-blue-200 dark:border-blue-800' }, { run: run_b, label: 'Run B', color: 'bg-purple-500/10 border-purple-200 dark:border-purple-800' }].map(({ run, label, color }) => (
          <Card key={label} className={cn('border-2', color)}>
            <CardHeader><CardTitle className="flex items-center justify-between"><span>{label}</span><Badge variant="secondary">{run.provider}</Badge></CardTitle><CardDescription>{run.model} • {run.dataset_name} • {formatDate(run.timestamp)}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Quality Score</p><p className={cn('text-3xl font-bold', getScoreColor(run.average_score))}>{(run.average_score * 100).toFixed(1)}%</p></div>
                <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Pass Rate</p><p className="text-3xl font-bold">{run.total_cases ? ((run.passed_cases / run.total_cases) * 100).toFixed(1) : 0}%</p></div>
                <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Latency</p><p className="text-3xl font-bold font-mono">{formatLatency(run.avg_latency_ms)}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Total Cost</p><p className="text-3xl font-bold font-mono">{formatCurrency(run.total_cost_usd)}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Total Cases</p><p className="text-3xl font-bold font-mono">{run.total_cases}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Tokens</p><p className="text-sm font-mono">{run.total_input_tokens.toLocaleString()} in / {run.total_output_tokens.toLocaleString()} out</p></div>
              </div>
              <Button variant="outline" asChild className="w-full"><Link to={`/evaluations/${run.run_id}`}>View Details</Link></Button>
            </CardContent>
          </Card>
        ))}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Delta (Run B − Run A)</CardTitle><CardDescription>Positive values mean Run B is better (for quality/pass rate) or higher (for latency/cost)</CardDescription></CardHeader>
          <CardContent><div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground uppercase tracking-wider">Quality Δ</p><p className="text-2xl font-bold">{formatDelta(delta_score, v => `${(v * 100).toFixed(1)}%`)}</p></div>
            <div className="p-4 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground uppercase tracking-wider">Pass Rate Δ</p><p className="text-2xl font-bold">{formatDelta(delta_pass_rate, v => `${(v * 100).toFixed(1)}%`)}</p></div>
            <div className="p-4 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground uppercase tracking-wider">Latency Δ</p><p className="text-2xl font-bold">{formatDelta(delta_latency_ms, v => `${v.toFixed(0)}ms`, false)}</p></div>
            <div className="p-4 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground uppercase tracking-wider">Cost Δ</p><p className="text-2xl font-bold">{formatDelta(delta_cost_usd, v => formatCurrency(v), false)}</p></div>
          </div></CardContent>
        </Card>
      </div>
      {perMetricData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Per-Metric Comparison</CardTitle><CardDescription>Average score per metric across both runs</CardDescription></CardHeader>
          <CardContent><ChartCard title="Metric Scores: Run A vs Run B"><BarChartComponent data={perMetricData} series={[{ dataKey: 'avgA', name: 'Run A', color: 'hsl(var(--chart-1))' }, { dataKey: 'avgB', name: 'Run B', color: 'hsl(var(--chart-2))' }]} xKey="name" height={350} /></ChartCard></CardContent>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Run A Details</CardTitle></CardHeader><CardContent><RunDetailCard run={run_a} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Run B Details</CardTitle></CardHeader><CardContent><RunDetailCard run={run_b} /></CardContent></Card>
      </div>
    </div>
  );
}

function RunDetailCard({ run }: { run: EvaluationRun }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label="Run ID" value={run.run_id} monospace />
        <DetailRow label="Status" value={<Badge variant="outline" className={getStatusBadge(run.status).className}>{getStatusBadge(run.status).label}</Badge>} />
        <DetailRow label="Provider" value={run.provider} />
        <DetailRow label="Model" value={run.model} monospace />
        <DetailRow label="Dataset" value={run.dataset_name} />
        <DetailRow label="Timestamp" value={formatDate(run.timestamp)} />
        <DetailRow label="Total Cases" value={run.total_cases.toString()} />
        <DetailRow label="Passed" value={run.passed_cases.toString()} />
        <DetailRow label="Failed" value={run.failed_cases.toString()} />
        <DetailRow label="Avg Latency" value={formatLatency(run.avg_latency_ms)} />
        <DetailRow label="Total Cost" value={formatCurrency(run.total_cost_usd)} />
        <DetailRow label="Input Tokens" value={run.total_input_tokens.toLocaleString()} />
        <DetailRow label="Output Tokens" value={run.total_output_tokens.toLocaleString()} />
      </div>
      {run.error && <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">Error: {run.error}</div>}
    </div>
  );
}

function DetailRow({ label, value, monospace }: { label: string; value: React.ReactNode; monospace?: boolean }) {
  return <div className="flex flex-col gap-1"><span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span><span className={cn(monospace && 'font-mono text-sm')}>{value}</span></div>;
}