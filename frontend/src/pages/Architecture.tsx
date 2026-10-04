import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  Database,
  Cpu,
  Brain,
  ClipboardCheck,
  BarChart3,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Zap,
  Shield,
  Layers,
  GitBranch,
  Code,
  Server,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const architectureSteps = [
  {
    id: 'dataset',
    title: 'Dataset',
    description: 'JSON/CSV evaluation datasets with input, expected output, optional context, and metadata tags.',
    icon: Database,
    color: 'bg-blue-500',
    details: [
      'Supports JSON and CSV formats',
      'Cases include: input, expected_output, context (optional), tags',
      'Metadata: name, description, version, custom fields',
      'Example: AI Knowledge Benchmark (22 cases)',
    ],
  },
  {
    id: 'pipeline',
    title: 'Evaluation Pipeline',
    description: 'Orchestrates the evaluation flow: loads dataset, runs cases through provider, computes metrics, persists results.',
    icon: Cpu,
    color: 'bg-purple-500',
    details: [
      'Sequential case evaluation',
      'Pluggable LLM provider abstraction',
      'Deterministic + model-based metrics',
      'Latency & token tracking per call',
      'Cost estimation from token counts',
    ],
  },
  {
    id: 'provider',
    title: 'LLM Provider',
    description: 'Abstract interface for language models — supports MockProvider (offline), OpenAI, and Amazon Bedrock.',
    icon: Brain,
    color: 'bg-green-500',
    details: [
      'MockProvider: deterministic, no API keys',
      'OpenAIProvider: GPT-4, GPT-3.5, etc.',
      'BedrockProvider: Claude, Titan, Llama',
      'Unified LLMResponse: text, tokens, latency',
      'System prompt support for judge metrics',
    ],
  },
  {
    id: 'evaluator',
    title: 'Evaluator (Metrics Engine)',
    description: 'Computes quality metrics — deterministic (exact match, keyword overlap, latency) and LLM-as-a-judge (relevance, faithfulness).',
    icon: ClipboardCheck,
    color: 'bg-orange-500',
    details: [
      'Deterministic: exact_match, keyword_overlap, response_length, latency, token_efficiency',
      'Model-based: answer_relevance, semantic_similarity, faithfulness, context_relevance',
      'Judge LLM can be separate from evaluation LLM',
      'Scores normalized to 0.0–1.0 with pass/fail threshold',
    ],
  },
  {
    id: 'metrics',
    title: 'Metrics & Results',
    description: 'Per-case scores aggregated into run summaries with pass rates, average scores, latency, cost, and token usage.',
    icon: BarChart3,
    color: 'bg-red-500',
    details: [
      'CaseResult: input, expected, generated, metrics[], latency, tokens, cost',
      'EvaluationRun: aggregate stats, pass rate, avg score, total cost',
      'RunStatus: pending, running, completed, failed',
      'Comparison: delta score, latency, cost, pass rate between runs',
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Persistence',
    description: 'SQLite database for persistence; JSON, CSV, and Markdown reports for sharing and CI/CD integration.',
    icon: FileText,
    color: 'bg-indigo-500',
    details: [
      'SQLite: runs + full per-case results as JSON',
      'JSON report: complete structured data',
      'CSV report: tabular per-case metrics',
      'Markdown report: human-readable summary',
      'FastAPI REST API for programmatic access',
    ],
  },
];

const techStack = [
  { category: 'Backend', items: ['FastAPI', 'Uvicorn', 'Pydantic v2', 'SQLite', 'Python 3.11+'] },
  { category: 'Frontend', items: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Recharts'] },
  { category: 'Evaluation', items: ['Deterministic metrics', 'LLM-as-a-judge', 'Multi-provider', 'Cost tracking'] },
  { category: 'DevOps', items: ['Docker', 'Docker Compose', 'GitHub Actions', 'pytest', 'ESLint'] },
];

const dataFlow = [
  { from: 'Dataset (JSON/CSV)', to: 'Evaluation Pipeline', description: 'Load cases with input, expected output, context' },
  { from: 'Evaluation Pipeline', to: 'LLM Provider', description: 'Send each case input to selected provider' },
  { from: 'LLM Provider', to: 'Generated Response', description: 'Receive text, latency, token counts' },
  { from: 'Generated Response', to: 'Metrics Engine', description: 'Run deterministic + model-based metrics' },
  { from: 'Metrics Engine', to: 'Results', description: 'Per-case scores + run aggregates' },
  { from: 'Results', to: 'SQLite Database', description: 'Persist run summary + full case results' },
  { from: 'SQLite Database', to: 'API / Dashboard', description: 'Query runs, compare, visualize' },
];

export function Architecture() {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <PageHeader
        title="System Architecture"
        subtitle="Visual explanation of the AI Evaluation Platform — understand the project in 30 seconds"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Architecture Overview
          </CardTitle>
          <CardDescription>
            The platform follows a linear data flow from dataset through evaluation to actionable insights.
            Each component is loosely coupled and replaceable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden lg:block" />
            <div className="space-y-6">
              {architectureSteps.map((step, index) => {
                const isExpanded = expandedStep === step.id;
                return (
                  <div key={step.id} className="relative flex lg:items-center">
                    <div className={cn('flex-1 lg:w-1/2 px-4', index % 2 === 0 ? 'lg:pr-8 lg:text-right' : 'lg:pl-8')}>
                      <div
                        className={cn(
                          'relative p-6 rounded-xl border transition-all',
                          isExpanded ? 'shadow-lg ring-2 ring-primary/20' : 'hover:shadow-md',
                          index % 2 === 0 ? 'bg-gradient-to-r from-transparent to-primary/5' : 'bg-gradient-to-l from-transparent to-primary/5'
                        )}
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'flex h-14 w-14 items-center justify-center rounded-xl flex-shrink-0',
                              step.color
                            )}
                          >
                            <step.icon className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="text-lg font-semibold">{step.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                            {isExpanded && (
                              <div className="mt-4 space-y-2">
                                {step.details.map((detail, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="text-primary mt-0.5">→</span>
                                    <span>{detail}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="absolute right-4 top-4 text-muted-foreground/50">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                    </div>
                    <div className="hidden lg:block lg:w-1/2 lg:flex lg:items-center lg:justify-center">
                      {index < architectureSteps.length - 1 && (
                        <ArrowRight className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    {index < architectureSteps.length - 1 && (
                      <div className="lg:hidden flex justify-center my-2">
                        <ArrowRight className="h-6 w-6 text-muted-foreground/50 rotate-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Data Flow
          </CardTitle>
          <CardDescription>
            Step-by-step data transformation through the evaluation pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataFlow.map((flow, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{flow.from}</p>
                    <p className="text-sm text-muted-foreground">{flow.description}</p>
                  </div>
                </div>
                {index < dataFlow.length - 1 && (
                  <div className="flex h-8 w-8 items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                {index === dataFlow.length - 1 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Technology Stack
            </CardTitle>
            <CardDescription>Key technologies powering the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {techStack.map((stack) => (
                <div key={stack.category}>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    {stack.category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {stack.items.map((item) => (
                      <Badge key={item} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Key Architectural Decisions
            </CardTitle>
            <CardDescription>Design choices that shape the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'Provider Abstraction',
                  desc: 'All LLM interactions go through a common LLMProvider interface, enabling MockProvider for offline testing and real OpenAI/Bedrock integration.',
                  icon: Shield,
                },
                {
                  title: 'Deterministic + Model-based Metrics',
                  desc: 'Separated by design so reproducible evaluation can happen offline (deterministic) while semantic evaluation uses a judge LLM (model-based).',
                  icon: ClipboardCheck,
                },
                {
                  title: 'SQLite for Portability',
                  desc: 'All evaluation runs persisted locally with full per-case results; no external dependencies required.',
                  icon: Database,
                },
                {
                  title: 'Cost Tracking',
                  desc: 'Estimated cost computed per case based on configurable token rates, enabling trade-off analysis.',
                  icon: BarChart3,
                },
                {
                  title: 'Latency Measurement',
                  desc: 'Native to every LLM response, measured end-to-end for performance analysis.',
                  icon: Zap,
                },
                {
                  title: 'Multi-format Reports',
                  desc: 'JSON for machines, CSV for spreadsheets, Markdown for humans — generated automatically per run.',
                  icon: FileText,
                },
              ].map((decision, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <decision.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{decision.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{decision.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Dashboard & API Access
          </CardTitle>
          <CardDescription>Multiple interfaces for different workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'React Dashboard',
                desc: 'Interactive web UI with charts, tables, drill-down details, and experiment comparison',
                icon: Monitor,
                features: ['Real-time charts', 'Drill-down case details', 'Model comparison', 'Cost/latency trade-offs'],
              },
              {
                title: 'FastAPI REST API',
                desc: 'Programmatic access for CI/CD, automation, and integration with other tools',
                icon: Server,
                features: ['Run evaluations', 'List/query runs', 'Compare runs', 'OpenAPI docs at /docs'],
              },
              {
                title: 'CLI',
                desc: 'Command-line interface for local evaluation runs and scripting',
                icon: Code,
                features: ['python -m app.cli evaluate', 'Configurable metrics', 'Multiple output formats', 'Works offline with mock'],
              },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-medium">{item.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                <ul className="space-y-1 text-sm">
                  {item.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-primary">→</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}