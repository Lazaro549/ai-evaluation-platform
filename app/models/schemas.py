"""Pydantic data models for the evaluation platform."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Dataset models
# ---------------------------------------------------------------------------

class EvaluationCase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    input: str
    expected_output: str
    context: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)

    @field_validator("input", "expected_output")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field must not be empty")
        return v


class EvaluationDataset(BaseModel):
    name: str
    description: str = ""
    cases: list[EvaluationCase]
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("cases")
    @classmethod
    def at_least_one(cls, v: list) -> list:
        if not v:
            raise ValueError("Dataset must contain at least one case")
        return v


# ---------------------------------------------------------------------------
# Provider / LLM models
# ---------------------------------------------------------------------------

class LLMResponse(BaseModel):
    text: str
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: float = 0.0
    model: str = ""
    raw: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Metric models
# ---------------------------------------------------------------------------

class MetricType(str, Enum):
    DETERMINISTIC = "deterministic"
    MODEL_BASED = "model_based"


class MetricResult(BaseModel):
    name: str
    score: float  # 0.0 – 1.0
    passed: bool
    reason: str = ""
    metric_type: MetricType = MetricType.DETERMINISTIC


# ---------------------------------------------------------------------------
# Evaluation result models
# ---------------------------------------------------------------------------

class CaseResult(BaseModel):
    case_id: str
    input: str
    expected_output: str
    generated_output: str
    context: Optional[str] = None
    metrics: list[MetricResult] = Field(default_factory=list)
    latency_ms: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0
    estimated_cost_usd: float = 0.0
    error: Optional[str] = None

    @property
    def overall_score(self) -> float:
        if not self.metrics:
            return 0.0
        return sum(m.score for m in self.metrics) / len(self.metrics)

    @property
    def passed(self) -> bool:
        return self.overall_score >= 0.5


class RunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class EvaluationRun(BaseModel):
    run_id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    provider: str
    model: str
    dataset_name: str
    total_cases: int = 0
    passed_cases: int = 0
    failed_cases: int = 0
    average_score: float = 0.0
    avg_latency_ms: float = 0.0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost_usd: float = 0.0
    status: RunStatus = RunStatus.PENDING
    error: Optional[str] = None
    results: list[CaseResult] = Field(default_factory=list)

    def compute_summary(self) -> None:
        """Recompute aggregate fields from results."""
        if not self.results:
            return
        self.total_cases = len(self.results)
        self.passed_cases = sum(1 for r in self.results if r.passed)
        self.failed_cases = self.total_cases - self.passed_cases
        self.average_score = sum(r.overall_score for r in self.results) / self.total_cases
        self.avg_latency_ms = sum(r.latency_ms for r in self.results) / self.total_cases
        self.total_input_tokens = sum(r.input_tokens for r in self.results)
        self.total_output_tokens = sum(r.output_tokens for r in self.results)
        self.total_cost_usd = sum(r.estimated_cost_usd for r in self.results)


# ---------------------------------------------------------------------------
# API request / response models
# ---------------------------------------------------------------------------

class RunEvaluationRequest(BaseModel):
    dataset_path: str
    provider: Optional[str] = None
    model: Optional[str] = None
    metrics: list[str] = Field(default_factory=list)


class RunComparisonResult(BaseModel):
    run_a: EvaluationRun
    run_b: EvaluationRun
    delta_score: float
    delta_latency_ms: float
    delta_cost_usd: float
    delta_pass_rate: float
