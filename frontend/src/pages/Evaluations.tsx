import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { evaluationsApi } from '@/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { formatDate, formatCurrency, formatLatency, getStatusBadge, getScoreColor, cn } from '@/lib/utils';
import type { EvaluationRun } from '@/api/types';

export function Evaluations() {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await evaluationsApi.list(200);
      setRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PageHeader title="Evaluations" subtitle="View and manage all evaluation runs" action={<LoadingState message="Loading evaluations…" />} />
        <Card><CardContent className="p-6"><LoadingState message="" /></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Evaluations" subtitle="View and manage all evaluation runs" />
        <Card><CardContent className="p-6 text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchRuns} className="mt-4">Retry</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <PageHeader
        title="Evaluations"
        subtitle="View and manage all evaluation runs"
        action={<Button variant="outline" size="sm" onClick={fetchRuns}>Refresh</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>All Evaluation Runs ({runs.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {runs.length === 0 ? (
            <EmptyState
              title="No evaluation runs yet"
              description="Run your first evaluation to see results here"
              action={<Link to="/evaluations/new"><Button>Run Evaluation</Button></Link>}
            />
          ) : (
            <DataTable<EvaluationRun>
              data={runs}
              columns={[
                {
                  key: 'run_id',
                  header: 'Run ID',
                  render: (r) => <Link to={`/evaluations/${r.run_id}`} className="font-mono text-sm hover:underline">{r.run_id.slice(0, 12)}…</Link>,
                  sortable: true,
                },
                {
                  key: 'timestamp',
                  header: 'Timestamp',
                  render: (r) => formatDate(r.timestamp),
                  sortable: true,
                },
                {
                  key: 'provider',
                  header: 'Provider',
                  render: (r) => <Badge variant="secondary">{r.provider}</Badge>,
                  sortable: true,
                },
                {
                  key: 'model',
                  header: 'Model',
                  render: (r) => <code className="text-sm">{r.model}</code>,
                  sortable: true,
                },
                {
                  key: 'dataset_name',
                  header: 'Dataset',
                  sortable: true,
                },
                {
                  key: 'total_cases',
                  header: 'Cases',
                  render: (r) => r.total_cases.toString(),
                  sortable: true,
                },
                {
                  key: 'average_score',
                  header: 'Quality',
                  render: (r) => <span className={cn('font-mono', getScoreColor(r.average_score))}>{(r.average_score * 100).toFixed(1)}%</span>,
                  sortable: true,
                },
                {
                  key: 'avg_latency_ms',
                  header: 'Latency',
                  render: (r) => formatLatency(r.avg_latency_ms),
                  sortable: true,
                },
                {
                  key: 'total_cost_usd',
                  header: 'Cost',
                  render: (r) => formatCurrency(r.total_cost_usd),
                  sortable: true,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => { const badge = getStatusBadge(r.status); return <Badge variant="outline" className={badge.className}>{badge.label}</Badge>; },
                },
              ]}
              searchKey={['run_id', 'model', 'dataset_name', 'provider']}
              defaultSortKey="timestamp"
              defaultSortDirection="desc"
              pageSize={20}
              showPageSize
              rowKey={(r) => r.run_id}
              emptyMessage="No evaluation runs match your search"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}