import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { evaluationsApi } from '@/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { BarChartComponent, ChartCard, ScatterPlotComponent } from '@/components/charts';
import { formatDate, formatCurrency, formatLatency, getStatusBadge, getScoreColor, cn } from '@/lib/utils';
import type { EvaluationRun } from '@/api/types';
import { GitCompare, TrendingUp, Clock, DollarSign, RefreshCw } from 'lucide-react';

export function Experiments() {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);

  const fetchRuns = async () => {
    try { setLoading(true); setError(null); const data = await evaluationsApi.list(200); setRuns(data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load evaluations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRuns(); }, []);

  const completedRuns = runs.filter(r => r.status === 'completed');
  const models = [...new Set(completedRuns.map(r => r.model))];
  const datasets = [...new Set(completedRuns.map(r => r.dataset_name))];

  const modelComparisonData = models.map(model => {
    const modelRuns = completedRuns.filter(r => r.model === model);
    const latestRun = modelRuns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return {
      name: model, score: latestRun.average_score, latency: latestRun.avg_latency_ms, cost: latestRun.total_cost_usd,
      passRate: latestRun.total_cases ? (latestRun.passed_cases / latestRun.total_cases) * 100 : 0,
      evaluations: modelRuns.reduce((sum, r) => sum + r.total_cases, 0), runs: modelRuns.length,
    };
  });

  const qualityVsCostData = completedRuns.map(r => ({
    x: r.total_cost_usd, y: r.average_score, name: `${r.model} (${r.dataset_name})`, model: r.model, dataset: r.dataset_name, runId: r.run_id.slice(0, 8),
  }));
  const qualityVsLatencyData = completedRuns.map(r => ({
    x: r.avg_latency_ms, y: r.average_score, name: `${r.model} (${r.dataset_name})`, model: r.model, dataset: r.dataset_name, runId: r.run_id.slice(0, 8),
  }));

  const handleRunSelect = (runId: string) => {
    setSelectedRuns(prev => prev.includes(runId) ? prev.filter(id => id !== runId) : [...prev, runId]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader title="Experiments" subtitle="Compare evaluation configurations and track trade-offs" action={<LoadingState message="Loading experiments…" />} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-6 h-24"><LoadingState message="" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Experiments" subtitle="Compare evaluation configurations and track trade-offs" />
        <Card><CardContent className="p-6 text-center py-12"><p className="text-destructive">{error}</p><Button onClick={fetchRuns} className="mt-4">Retry</Button></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeader title="Experiments" subtitle="Compare evaluation configurations — Evaluation is an engineering workflow, not a single score." action={<Button variant="outline" size="sm" onClick={fetchRuns}>Refresh</Button>} />
      {selectedRuns.length > 0 && (
        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><GitCompare className="h-5 w-5" /> {selectedRuns.length} run{selectedRuns.length !== 1 ? 's' : ''} selected for comparison</CardTitle><Button variant="outline" size="sm" onClick={() => setSelectedRuns([])}>Clear</Button></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">{selectedRuns.map(runId => { const run = runs.find(r => r.run_id === runId); if (!run) return null; return <Badge key={runId} variant="outline" className="gap-1">{run.model} — {run.dataset_name} ({run.run_id.slice(0, 8)})<button onClick={e => { e.stopPropagation(); handleRunSelect(runId); }} className="ml-1">×</button></Badge>; })}</div>
            {selectedRuns.length === 2 && <div className="mt-4"><Link to={`/evaluations/compare/${selectedRuns[0]}/${selectedRuns[1]}`}><Button variant="default">Compare Selected Runs</Button></Link></div>}
          </CardContent>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Quality vs Cost" description="Trade-off between quality score and estimated cost across all runs">
          <ScatterPlotComponent data={qualityVsCostData} xKey="x" yKey="y" xLabel="Cost ($)" yLabel="Quality Score" height={320} colorBy="model" colorScale={Object.fromEntries(models.map((m, i) => [m, `hsl(var(--chart-${(i % 5) + 1}))`]))} tooltipFormatter={(x, y, p) => (<div><p className="font-medium">{p.name}</p><p>Run: {p.runId}</p><p>Cost: ${x.toFixed(6)}</p><p>Quality: {(y * 100).toFixed(1)}%</p><p>Model: {p.model}</p><p>Dataset: {p.dataset}</p></div>)} />
        </ChartCard>
        <ChartCard title="Quality vs Latency" description="Trade-off between quality score and response latency across all runs">
          <ScatterPlotComponent data={qualityVsLatencyData} xKey="x" yKey="y" xLabel="Latency (ms)" yLabel="Quality Score" height={320} colorBy="model" colorScale={Object.fromEntries(models.map((m, i) => [m, `hsl(var(--chart-${(i % 5) + 1}))`]))} tooltipFormatter={(x, y, p) => (<div><p className="font-medium">{p.name}</p><p>Run: {p.runId}</p><p>Latency: {formatLatency(x)}</p><p>Quality: {(y * 100).toFixed(1)}%</p><p>Model: {p.model}</p><p>Dataset: {p.dataset}</p></div>)} />
        </ChartCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Model Quality Comparison" description="Average quality score by model (latest run per model)">
          <BarChartComponent data={modelComparisonData} series={[{ dataKey: 'score', name: 'Avg Quality', color: 'hsl(var(--primary))' }]} xKey="name" height={300} horizontal tooltipFormatter={(v) => [`${(v * 100).toFixed(1)}%`, 'Quality']} />
        </ChartCard>
        <ChartCard title="Model Latency Comparison" description="Average latency by model (latest run per model)">
          <BarChartComponent data={modelComparisonData} series={[{ dataKey: 'latency', name: 'Avg Latency (ms)', color: 'hsl(var(--chart-2))' }]} xKey="name" height={300} horizontal tooltipFormatter={(v) => [`${formatLatency(v)}`, 'Latency']} />
        </ChartCard>
      </div>
      <Card>
        <CardHeader><CardTitle>All Evaluation Runs</CardTitle><CardDescription>Select runs to compare configurations, models, datasets, or prompt versions</CardDescription></CardHeader>
        <CardContent className="pt-0">
          {runs.length === 0 ? (
            <EmptyState title="No evaluation runs yet" description="Run evaluations to build experiment history" action={<Link to="/evaluations/new"><Button>Run Evaluation</Button></Link>} />
          ) : (
            <DataTable<EvaluationRun> data={runs} columns={[
              { key: 'select', header: '', render: r => <input type="checkbox" checked={selectedRuns.includes(r.run_id)} onChange={() => handleRunSelect(r.run_id)} onClick={e => e.stopPropagation()} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />, className: 'w-12' },
              { key: 'run_id', header: 'Run ID', render: r => <Link to={`/evaluations/${r.run_id}`} className="font-mono text-sm hover:underline">{r.run_id.slice(0, 12)}…</Link>, sortable: true },
              { key: 'timestamp', header: 'Timestamp', render: r => formatDate(r.timestamp), sortable: true },
              { key: 'model', header: 'Model', render: r => <code className="text-sm">{r.model}</code>, sortable: true },
              { key: 'dataset_name', header: 'Dataset', sortable: true },
              { key: 'average_score', header: 'Quality', render: r => <span className={cn('font-mono', getScoreColor(r.average_score))}>{(r.average_score * 100).toFixed(1)}%</span>, sortable: true },
              { key: 'avg_latency_ms', header: 'Latency', render: r => formatLatency(r.avg_latency_ms), sortable: true },
              { key: 'total_cost_usd', header: 'Cost', render: r => formatCurrency(r.total_cost_usd), sortable: true },
              { key: 'status', header: 'Status', render: r => { const b = getStatusBadge(r.status); return <Badge variant="outline" className={b.className}>{b.label}</Badge>; } },
            ]} searchKey={['run_id', 'model', 'dataset_name']} defaultSortKey="timestamp" defaultSortDirection="desc" pageSize={20} showPageSize rowKey={r => r.run_id} onRowClick={r => handleRunSelect(r.run_id)} emptyMessage="No evaluation runs match your search" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}