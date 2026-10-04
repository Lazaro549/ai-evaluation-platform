import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { formatDate, cn } from '@/lib/utils';
import {
  Database,
  FileText,
  Tag,
  Eye,
  Play,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface DatasetInfo {
  name: string;
  description: string;
  cases: number;
  version: string;
  createdDate: string;
  tags: string[];
  hasContext: number;
  evaluationStatus: 'evaluated' | 'partial' | 'none';
  lastEvaluated?: string;
}

const mockDatasets: DatasetInfo[] = [
  {
    name: 'AI Knowledge Benchmark',
    description: 'Sample evaluation dataset covering factual, reasoning, RAG, hallucination, and safety scenarios.',
    cases: 22,
    version: '1.0.0',
    createdDate: '2024-01-15',
    tags: ['benchmark', 'factual', 'reasoning', 'rag', 'safety'],
    hasContext: 10,
    evaluationStatus: 'evaluated',
    lastEvaluated: '2024-09-10T14:30:00Z',
  },
  {
    name: 'Customer Support QA',
    description: 'Real customer support conversations with expected responses for training evaluation.',
    cases: 150,
    version: '2.1.0',
    createdDate: '2024-03-22',
    tags: ['customer-support', 'conversational', 'multi-turn'],
    hasContext: 150,
    evaluationStatus: 'partial',
    lastEvaluated: '2024-09-05T09:15:00Z',
  },
  {
    name: 'Code Generation Benchmark',
    description: 'Programming problems with expected solutions for code generation evaluation.',
    cases: 85,
    version: '1.2.0',
    createdDate: '2024-05-10',
    tags: ['coding', 'python', 'javascript', 'algorithms'],
    hasContext: 0,
    evaluationStatus: 'none',
  },
  {
    name: 'RAG Retrieval Evaluation',
    description: 'Document retrieval and generation tasks with ground truth context relevance.',
    cases: 60,
    version: '1.0.0',
    createdDate: '2024-07-01',
    tags: ['rag', 'retrieval', 'context-grounded'],
    hasContext: 60,
    evaluationStatus: 'partial',
    lastEvaluated: '2024-08-28T16:45:00Z',
  },
];

export function Datasets() {
  const [datasets, setDatasets] = useState<DatasetInfo[]>(mockDatasets);
  const [loading, setLoading] = useState(false);
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);

  const toggleExpand = (name: string) => {
    setExpandedDataset(expandedDataset === name ? null : name);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="Datasets"
        subtitle="Available evaluation datasets — manage benchmarks, track versions, and monitor evaluation coverage"
        action={
          <Button variant="outline" size="sm" disabled>
            Upload Dataset
          </Button>
        }
      />

      <div className="grid gap-6">
        {datasets.map((dataset) => {
          const isExpanded = expandedDataset === dataset.name;
          const statusConfig = {
            evaluated: { label: 'Evaluated', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
            partial: { label: 'Partially Evaluated', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertCircle },
            none: { label: 'Not Evaluated', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: AlertCircle },
          };
          const status = statusConfig[dataset.evaluationStatus];

          return (
            <Card key={dataset.name} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Database className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{dataset.name}</h3>
                          <Badge variant="secondary">{dataset.version}</Badge>
                          <Badge variant="outline" className={status.className}>
                            <status.icon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{dataset.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/evaluations/new?dataset=${encodeURIComponent(dataset.name)}`}>
                          <Play className="h-4 w-4 mr-1" />
                          Run Evaluation
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleExpand(dataset.name)}>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 border-t pt-6 space-y-6">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Total Cases</p>
                            <p className="text-2xl font-bold tabular-nums">{dataset.cases}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                          <Tag className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">With Context</p>
                            <p className="text-2xl font-bold tabular-nums">{dataset.hasContext}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                          <Eye className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Context Coverage</p>
                            <p className="text-2xl font-bold tabular-nums">
                              {dataset.cases > 0 ? ((dataset.hasContext / dataset.cases) * 100).toFixed(0) : 0}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                          <ChevronDown className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Last Evaluated</p>
                            <p className="text-sm font-mono">
                              {dataset.lastEvaluated ? formatDate(dataset.lastEvaluated) : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {dataset.tags.map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Created: {formatDate(dataset.createdDate)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Name
                          </Button>
                          <Link to={`/evaluations/new?dataset=${encodeURIComponent(dataset.name)}`}>
                            <Button variant="outline" size="sm">Run Evaluation</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {datasets.length === 0 && (
        <EmptyState
          title="No datasets available"
          description="Datasets will appear here once added to the platform"
          icon={<Database className="h-12 w-12 text-muted-foreground/50" />}
        />
      )}
    </div>
  );
}