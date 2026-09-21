import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { evaluationsApi } from '@/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/dashboard/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { LineChartComponent, BarChartComponent, ChartCard, ScatterPlotComponent } from '@/components/charts';
import { formatDate, formatNumber, formatCurrency, formatLatency, getStatusBadge, getScoreColor, cn } from '@/lib/utils';
import type { EvaluationRun } from '@/api/types';
import { FlaskConical, TrendingUp, Clock, DollarSign, CheckCircle, GitCompare, ExternalLink, RefreshCw } from 'lucide-react';

export function Dashboard() {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = async () => {
    try { setLoading(true); setError(null); const data = await evaluationsApi.list(100); setRuns(data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load evaluations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRuns(); }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader title="Dashboard" subtitle="Building AI is not enough — you need to evaluate it." action={<LoadingState message="Loading dashboard…" />} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {[1,2,3,4,5,6].map(i => <Card key={i}><CardContent className="p-6 h-24"><LoadingState message="" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Dashboard" subtitle="Building AI is not enough — you need to evaluate it." />
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchRuns} className="mt-4"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
        </div>
      </div>
    );
  }

  const completedRuns = runs.filter(r => r.status === 'completed');
  const totalRuns = runs.length;
  const avgScore = completedRuns.length ? completedRuns.reduce((sum, r) => sum + r.average_score, 0) / completedRuns.length : 0;
  const avgLatency = completedRuns.length ? completedRuns.reduce((sum, r) => sum + r.avg_latency_ms, 0) / completedRuns.length : 0;
  const totalCost = completedRuns.reduce((sum, r) => sum + r.total_cost_usd, 0);
  const passRate = completedRuns.length ? completedRuns.reduce((sum, r) => sum + (r.total_cases ? r.passed_cases / r.total_cases : 0), 0) / completedRuns.length : 0;
  const modelsEvaluated = new Set(completedRuns.map(r => r.model)).size;

  const recentRuns = [...runs].slice(0, 10).reverse();
  const scoreTrendData = recentRuns.map(r => ({ name: r.run_id.slice(0, 8), score: r.average_score, date: formatDate(r.timestamp) }));
  const latencyTrendData = recentRuns.map(r => ({ name: r.run_id.slice(0, 8), latency: r.avg_latency_ms, date: formatDate(r.timestamp) }));
  const costTrendData = recentRuns.map(r => ({ name: r.run_id.slice(0, 8), cost: r.total_cost_usd, date: formatDate(r.timestamp) }));
  const passFailData = completedRuns.map(r => ({ name: r.run_id.slice(0, 8), passed: r.passed_cases, failed: r.failed_cases, date: formatDate(r.timestamp) }));

  const modelComparisonData = [...completedRuns].sort((a, b) => b.average_score - a.average_score).slice(0, 10).map(r => ({
    name: r.model, score: r.average_score, latency: r.avg_latency_ms, cost: r.total_cost_usd,
    passRate: r.total_cases ? (r.passed_cases / r.total_cases) * 100 : 0, evaluations: r.total_cases,
  }));

  const qualityVsCostData = completedRuns.map(r => ({
    x: r.total_cost_usd, y: r.average_score, name: `${r.model} (${r.run_id.slice(0, 8)})`, model: r.model,
  }));
  const qualityVsLatencyData = completedRuns.map(r => ({
    x: r.avg_latency_ms, y: r.average_score, name: `${r.model} (${r.run_id.slice(0, 8)})`, model: r.model,
  }));

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeader title="Dashboard" subtitle="Building AI is not enough — you need to evaluate it." action={<Button variant="outline" size="sm" onClick={fetchRuns}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <KPICard title="Evaluation Runs" value={totalRuns} format="number" icon={<FlaskConical className="h-6 w-6" />} />
        <KPICard title="Avg Quality Score" value={avgScore} format="percentage" trend={{ value: 0, label: 'vs prev' }} icon={<TrendingUp className="h-6 w-6" />} />
        <KPICard title="Avg Latency" value={avgLatency} format="latency" icon={<Clock className="h-6 w-6" />} />
        <KPICard title="Estimated Cost" value={totalCost} format="currency" icon={<DollarSign className="h-6 w-6" />} />
        <KPICard title="Pass Rate" value={passRate} format="percentage" icon={<CheckCircle className="h-6 w-6" />} />
        <KPICard title="Models Evaluated" value={modelsEvaluated} format="number" icon={<GitCompare className="h-6 w-6" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Quality Over Time" description="Average score across recent evaluation runs">
          <LineChartComponent data={scoreTrendData} lines={[{ dataKey: 'score', name: 'Avg Score', color: 'hsl(var(--primary))' }]} xKey="name" height={280} yDomain={[0, 1]} tooltipFormatter={(v) => [`${(v * 100).toFixed(1)}%`, 'Avg Score']} />
        </ChartCard>
        <ChartCard title="Latency Over Time" description="Average response latency across runs">
          <LineChartComponent data={latencyTrendData} lines={[{ dataKey: 'latency', name: 'Avg Latency (ms)', color: 'hsl(var(--chart-2))' }]} xKey="name" height={280} tooltipFormatter={(v) => [`${formatLatency(v)}`, 'Avg Latency']} />
        </ChartCard>
        <ChartCard title="Cost Over Time" description="Estimated cost per evaluation run">
          <LineChartComponent data={costTrendData} lines={[{ dataKey: 'cost', name: 'Cost ($)', color: 'hsl(var(--chart-3))' }]} xKey="name" height={280} tooltipFormatter={(v) => [`$${v.toFixed(6)}`, 'Cost']} />
        </ChartCard>
        <ChartCard title="Pass/Fail Distribution" description="Passed vs failed cases per run">
          <BarChartComponent data={passFailData} series={[{ dataKey: 'passed', name: 'Passed', color: 'hsl(142 76% 36%)' }, { dataKey: 'failed', name: 'Failed', color: 'hsl(0 84% 60%)' }]} xKey="name" height={280} />
        </ChartCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Quality vs Cost" description="Trade-off between quality score and estimated cost">
          <ScatterPlotComponent data={qualityVsCostData} xKey="x" yKey="y" xLabel="Cost ($)" yLabel="Quality Score" height={320} colorBy="model" colorScale={Object.fromEntries([...new Set(completedRuns.map(r => r.model))].map((m, i) => [m, `hsl(var(--chart-${(i % 5) + 1}))`]))} tooltipFormatter={(x, y, p) => (<div><p className="font-medium">{p.name}</p><p>Cost: ${x.toFixed(6)}</p><p>Quality: {(y * 100).toFixed(1)}%</p><p>Model: {p.model}</p></div>)} />
        </ChartCard>
        <ChartCard title="Quality vs Latency" description="Trade-off between quality score and response latency">
          <ScatterPlotComponent data={qualityVsLatencyData} xKey="x" yKey="y" xLabel="Latency (ms)" yLabel="Quality Score" height={320} colorBy="model" colorScale={Object.fromEntries([...new Set(completedRuns.map(r => r.model))].map((m, i) => [m, `hsl(var(--chart-${(i % 5) + 1}))`]))} tooltipFormatter={(x, y, p) => (<div><p className="font-medium">{p.name}</p><p>Latency: {formatLatency(x)}</p><p>Quality: {(y * 100).toFixed(1)}%</p><p>Model: {p.model}</p></div>)} />
        </ChartCard>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Evaluation Runs</CardTitle>
          <Link to="/evaluations" className="text-sm text-primary hover:underline flex items-center gap-1">View all <ExternalLink className="h-3 w-3" /></Link>
        </CardHeader>
        <CardContent className="pt-0">
          {runs.length === 0 ? (
            <EmptyState title="No evaluation runs yet" description="Run your first evaluation to see results here" action={<Link to="/evaluations/new"><Button>Run Evaluation</Button></Link>} />
          ) : (
            <DataTable<EvaluationRun> data={runs.slice(0, 20)} columns={[
              { key: 'run_id', header: 'Run ID', render: (r) => <Link to={`/evaluations/${r.run_id}`} className="font-mono text-sm hover:underline">{r.run_id.slice(0, 12)}…</Link>, sortable: true },
              { key: 'timestamp', header: 'Timestamp', render: (r) => formatDate(r.timestamp), sortable: true },
              { key: 'model', header: 'Model', render: (r) => <code className="text-sm">{r.model}</code>, sortable: true },
              { key: 'dataset_name', header: 'Dataset', sortable: true },
              { key: 'average_score', header: 'Quality', render: (r) => <span className={cn('font-mono', getScoreColor(r.average_score))}>{(r.average_score * 100).toFixed(1)}%</span>, sortable: true },
              { key: 'avg_latency_ms', header: 'Latency', render: (r) => formatLatency(r.avg_latency_ms), sortable: true },
              { key: 'total_cost_usd', header: 'Cost', render: (r) => formatCurrency(r.total_cost_usd), sortable: true },
              { key: 'status', header: 'Status', render: (r) => { const b = getStatusBadge(r.status); return <Badge variant="outline" className={b.className}>{b.label}</Badge>; } },
            ]} searchKey={['run_id', 'model', 'dataset_name']} defaultSortKey="timestamp" defaultSortDirection="desc" pageSize={10} rowKey={r => r.run_id} emptyMessage="No evaluation runs found" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}