import { api } from './client';
import type {
  EvaluationRun,
  CaseResult,
  RunComparisonResult,
  RunEvaluationRequest,
  HealthResponse,
} from './types';

export const evaluationsApi = {
  health: () => api.get<HealthResponse>('/health'),
  
  list: (limit = 50) => 
    api.get<EvaluationRun[]>(`/evaluations?limit=${limit}`),
  
  get: (runId: string) => 
    api.get<EvaluationRun>(`/evaluations/${runId}`),
  
  getResults: (runId: string) => 
    api.get<CaseResult[]>(`/evaluations/${runId}/results`),
  
  run: (request: RunEvaluationRequest) => 
    api.post<EvaluationRun>('/evaluations/run', request),
  
  compare: (runAId: string, runBId: string) => 
    api.get<RunComparisonResult>(`/evaluations/compare/${runAId}/${runBId}`),
};