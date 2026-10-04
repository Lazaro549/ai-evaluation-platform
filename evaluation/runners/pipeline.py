"""Evaluation pipeline runner."""
from __future__ import annotations

import logging
from typing import Optional

from app.core.config import get_settings
from app.models.schemas import (
    CaseResult,
    EvaluationCase,
    EvaluationDataset,
    EvaluationRun,
    RunStatus,
)
from app.providers.base import LLMProvider
from app.providers.factory import get_provider
from evaluation.metrics import deterministic as det
from evaluation.metrics import model_based as mb

logger = logging.getLogger(__name__)

DEFAULT_METRICS = [
    "exact_match",
    "keyword_overlap",
    "response_length",
    "latency",
    "answer_relevance",
    "semantic_similarity",
]

CONTEXT_METRICS = ["faithfulness", "context_relevance"]


def _compute_cost(input_tokens: int, output_tokens: int) -> float:
    settings = get_settings()
    return (
        input_tokens / 1000 * settings.cost_per_1k_input_tokens
        + output_tokens / 1000 * settings.cost_per_1k_output_tokens
    )


def evaluate_case(
    case: EvaluationCase,
    provider: LLMProvider,
    judge: LLMProvider,
    metrics: list[str],
) -> CaseResult:
    """Run a single evaluation case and return its result."""
    try:
        llm_response = provider.generate(case.input)
    except Exception as exc:
        logger.error("Provider error for case %s: %s", case.id, exc)
        return CaseResult(
            case_id=case.id,
            input=case.input,
            expected_output=case.expected_output,
            generated_output="",
            context=case.context,
            error=str(exc),
        )

    generated = llm_response.text
    metric_results = []

    # --- Deterministic metrics ---
    if "exact_match" in metrics:
        metric_results.append(det.exact_match(generated, case.expected_output))

    if "keyword_overlap" in metrics:
        metric_results.append(det.keyword_overlap(generated, case.expected_output))

    if "response_length" in metrics:
        metric_results.append(det.response_length(generated))

    if "latency" in metrics:
        metric_results.append(det.latency_score(llm_response.latency_ms))

    if "token_efficiency" in metrics:
        metric_results.append(
            det.token_efficiency(llm_response.input_tokens, llm_response.output_tokens)
        )

    # --- Model-based metrics ---
    if "answer_relevance" in metrics:
        metric_results.append(mb.answer_relevance(case.input, generated, judge))

    if "semantic_similarity" in metrics:
        metric_results.append(mb.semantic_similarity(case.expected_output, generated, judge))

    if case.context:
        if "faithfulness" in metrics:
            metric_results.append(mb.faithfulness(case.context, generated, judge))
        if "context_relevance" in metrics:
            metric_results.append(mb.context_relevance(case.input, case.context, judge))

    cost = _compute_cost(llm_response.input_tokens, llm_response.output_tokens)

    return CaseResult(
        case_id=case.id,
        input=case.input,
        expected_output=case.expected_output,
        generated_output=generated,
        context=case.context,
        metrics=metric_results,
        latency_ms=llm_response.latency_ms,
        input_tokens=llm_response.input_tokens,
        output_tokens=llm_response.output_tokens,
        estimated_cost_usd=cost,
    )


def run_evaluation(
    dataset: EvaluationDataset,
    provider: Optional[LLMProvider] = None,
    judge: Optional[LLMProvider] = None,
    metrics: Optional[list[str]] = None,
) -> EvaluationRun:
    """Run a full evaluation over a dataset."""
    settings = get_settings()

    if provider is None:
        provider = get_provider(settings.provider, settings.model_name)
    if judge is None:
        judge = get_provider(settings.judge_provider, settings.judge_model)
    if metrics is None:
        metrics = DEFAULT_METRICS + CONTEXT_METRICS

    run = EvaluationRun(
        provider=provider.provider_name,
        model=provider.model_name,
        dataset_name=dataset.name,
        status=RunStatus.RUNNING,
    )

    logger.info("Starting evaluation run %s on dataset '%s'", run.run_id, dataset.name)

    for case in dataset.cases:
        result = evaluate_case(case, provider, judge, metrics)
        run.results.append(result)
        logger.debug("Case %s: score=%.2f", case.id, result.overall_score)

    run.compute_summary()
    run.status = RunStatus.COMPLETED
    logger.info(
        "Run %s completed: %d/%d passed, avg_score=%.2f",
        run.run_id,
        run.passed_cases,
        run.total_cases,
        run.average_score,
    )
    return run
