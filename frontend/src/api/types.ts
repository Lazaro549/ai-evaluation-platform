export type MetricType = 'deterministic' | 'model_based';

export interface MetricResult {
  name: string;
  score: number;
  passed: boolean;
  reason: string;
  metric_type: MetricType;
}

export interface CaseResult {
  case_id: string;
  input: string;
  expected_output: string;
  generated_output: string;
  context?: string | null;
  metrics: MetricResult[];
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  error?: string | null;
  overall_score: number;
  passed: boolean;
}

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface EvaluationRun {
  run_id: string;
  timestamp: string;
  provider: string;
  model: string;
  dataset_name: string;
  total_cases: number;
  passed_cases: number;
  failed_cases: number;
  average_score: number;
  avg_latency_ms: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  status: RunStatus;
  error?: string | null;
  results?: CaseResult[];
}

export interface RunComparisonResult {
  run_a: EvaluationRun;
  run_b: EvaluationRun;
  delta_score: number;
  delta_latency_ms: number;
  delta_cost_usd: number;
  delta_pass_rate: number;
}

export interface RunEvaluationRequest {
  dataset_path: string;
  provider?: string;
  model?: string;
  metrics?: string[];
}

export interface HealthResponse {
  status: string;
  version: string;
}