import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { evaluationsApi } from '@/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { formatDate, formatLatency, formatCurrency, getScoreColor, getStatusBadge, cn } from '@/lib/utils';
import type { EvaluationRun, CaseResult, MetricResult } from '@/api/types';
import { ChevronLeft, ExternalLink, Copy, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function EvaluationDetail() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<EvaluationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseResult | null>(null);

  const fetchRun = async () => {
    if (!id) return;
    try { setLoading(true); setError(null); const data = await evaluationsApi.get(id); setRun(data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load evaluation'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRun(); }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader title="Evaluation Detail" subtitle="Loading…" action={<LoadingState message="" />} />
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map(i => <Card key={i}><CardContent className="p-6 h-24"><LoadingState message="" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Evaluation Detail" subtitle="Evaluation not found" />
        <ErrorState message={error || `Evaluation ${id} not found`} onRetry={fetchRun} />
      </div>
    );
  }

  const statusBadge = getStatusBadge(run.status);
  const passedCases = run.results?.filter(r => r.passed).length || 0;
  const totalCases = run.results?.length || run.total_cases;

  const aggregateMetrics: MetricResult[] = run.results
    ? Object.entries(run.results.reduce((acc, r) => { r.metrics.forEach(m => { if (!acc[m.name]) acc[m.name] = []; acc[m.name].push(m.score); }); return acc; }, {} as Record<string, number[]>)).map(([name, scores]) => ({
      name, score: scores.reduce((a, b) => a + b, 0) / scores.length,
      passed: scores.reduce((a, b) => a + b, 0) / scores.length >= 0.5,
      reason: `Average across ${scores.length} cases`,
      metric_type: run.results[0].metrics.find(m => m.name === name)?.metric_type || 'deterministic',
    }))
    : [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <PageHeader title="Evaluation Detail" subtitle={`Run ID: ${run.run_id}`} action={<div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={fetchRun}>Refresh</Button><Link to="/evaluations"><Button variant="outline" size="sm">Back to List</Button></Link></div>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Run Metadata</CardTitle><CardDescription>Configuration and summary information for this evaluation run</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label><div className="mt-1 flex items-center gap-2"><Badge variant="outline" className={statusBadge.className}>{statusBadge.label}</Badge>{run.error && <Badge variant="destructive" className="text-xs">Error: {run.error.slice(0, 50)}…</Badge>}</div></div>
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Provider / Model</label><div className="mt-1 flex items-center gap-2"><Badge variant="secondary">{run.provider}</Badge><code className="text-sm bg-muted px-2 py-1 rounded">{run.model}</code></div></div>
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dataset</label><div className="mt-1 text-sm">{run.dataset_name}</div></div>
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</label><div className="mt-1 text-sm font-mono">{formatDate(run.timestamp)}</div></div>
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cases</label><div className="mt-1 text-sm font-mono">{totalCases}</div></div>
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Passed / Failed</label><div className="mt-1 flex items-center gap-2"><span className="text-green-600 dark:text-green-400 font-mono">{passedCases}</span><span className="text-muted-foreground">/</span><span className="text-red-600 dark:text-red-400 font-mono">{run.failed_cases}</span></div></div>
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Latency</label><div className="mt-1 text-sm font-mono">{formatLatency(run.avg_latency_ms)}</div></div>
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cost</label><div className="mt-1 text-sm font-mono">{formatCurrency(run.total_cost_usd)}</div></div>
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tokens (In / Out)</label><div className="mt-1 text-sm font-mono">{run.total_input_tokens.toLocaleString()} / {run.total_output_tokens.toLocaleString()}</div></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Summary Metrics</CardTitle><CardDescription>Key performance indicators</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Quality Score</span><span className={cn('font-mono font-bold', getScoreColor(run.average_score))}>{(run.average_score * 100).toFixed(1)}%</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className={cn('h-full rounded-full transition-all', getScoreColor(run.average_score).replace('text', 'bg'))} style={{ width: `${run.average_score * 100}%` }} /></div></div>
            <div className="space-y-1"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Pass Rate</span><span className="font-mono font-bold">{totalCases ? ((passedCases / totalCases) * 100).toFixed(1) : 0}%</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${totalCases ? (passedCases / totalCases) * 100 : 0}%` }} /></div></div>
          </CardContent>
        </Card>
      </div>
      {aggregateMetrics.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Aggregate Metrics</CardTitle><CardDescription>Average scores across all evaluation cases</CardDescription></CardHeader>
          <CardContent><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{aggregateMetrics.map(m => <MetricCard key={m.name} metric={m} />)}</div></CardContent>
        </Card>
      )}
      {run.results && run.results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Per-Case Results</CardTitle><CardDescription>{run.results.length} cases — click a row to inspect details</CardDescription></CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-[60px]">#</TableHead><TableHead>Input</TableHead><TableHead>Expected</TableHead><TableHead>Generated</TableHead>
                  <TableHead className="w-[80px]">Score</TableHead><TableHead className="w-[80px]">Status</TableHead><TableHead className="w-[80px]">Latency</TableHead><TableHead className="w-[80px]">Cost</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {run.results.map((result, index) => (
                    <TableRow key={result.case_id} onClick={() => setSelectedCase(result)} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{result.input}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{result.expected_output}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{result.generated_output}</TableCell>
                      <TableCell><span className={cn('font-mono font-medium', getScoreColor(result.overall_score))}>{(result.overall_score * 100).toFixed(1)}%</span></TableCell>
                      <TableCell>{result.passed ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-500 mx-auto" />}</TableCell>
                      <TableCell className="font-mono text-sm">{formatLatency(result.latency_ms)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatCurrency(result.estimated_cost_usd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedCase(null)}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-card shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4"><h3 className="text-lg font-semibold">Case Detail: {selectedCase.case_id}</h3><Button variant="ghost" size="icon" onClick={() => setSelectedCase(null)}><ChevronLeft className="h-5 w-5" /></Button></div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input</label><pre className="mt-2 p-4 bg-muted rounded-md text-sm whitespace-pre-wrap font-mono max-h-64 overflow-auto">{selectedCase.input}</pre></div>
                <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expected Output</label><pre className="mt-2 p-4 bg-muted rounded-md text-sm whitespace-pre-wrap font-mono max-h-64 overflow-auto">{selectedCase.expected_output}</pre></div>
                <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Generated Output</label><pre className="mt-2 p-4 bg-muted rounded-md text-sm whitespace-pre-wrap font-mono max-h-64 overflow-auto">{selectedCase.generated_output}</pre></div>
                {selectedCase.context && <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Context</label><pre className="mt-2 p-4 bg-muted rounded-md text-sm whitespace-pre-wrap font-mono max-h-64 overflow-auto">{selectedCase.context}</pre></div>}
              </div>
              <div className="border-t pt-4"><h4 className="font-medium mb-3">Metrics ({selectedCase.metrics.length})</h4><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedCase.metrics.map(m => <MetricCard key={m.name} metric={m} />)}</div></div>
              {selectedCase.error && <div className="border-t pt-4"><h4 className="font-medium text-destructive mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Error</h4><pre className="p-4 bg-destructive/10 rounded-md text-sm text-destructive">{selectedCase.error}</pre></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}