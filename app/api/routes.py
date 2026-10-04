"""FastAPI application and route definitions."""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.models.schemas import (
    EvaluationRun,
    RunComparisonResult,
    RunEvaluationRequest,
)
from app.services.database import get_run, list_runs, save_run
from app.services.dataset_loader import load_dataset
from evaluation.runners.pipeline import run_evaluation
from app.providers.factory import get_provider

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Evaluation Platform",
    description="Production-quality LLM evaluation framework",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _settings():
    return get_settings()


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/evaluations/run", response_model=EvaluationRun)
def start_evaluation(request: RunEvaluationRequest):
    """Run an evaluation and persist the results."""
    settings = _settings()

    try:
        dataset = load_dataset(request.dataset_path)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    provider_name = request.provider or settings.provider
    model = request.model or settings.model_name

    try:
        provider = get_provider(provider_name, model, settings)
        judge = get_provider(settings.judge_provider, settings.judge_model, settings)
    except (ValueError, ImportError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        run = run_evaluation(
            dataset=dataset,
            provider=provider,
            judge=judge,
            metrics=request.metrics or None,
        )
    except Exception as exc:
        logger.exception("Evaluation failed")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {exc}")

    save_run(run, settings.database_url)
    return run


@app.get("/evaluations", response_model=list[EvaluationRun])
def get_evaluations(limit: int = Query(default=50, le=200)):
    settings = _settings()
    runs = list_runs(settings.database_url, limit=limit)
    # Exclude results list for brevity in list view
    for run in runs:
        run.results = []
    return runs


@app.get("/evaluations/{run_id}", response_model=EvaluationRun)
def get_evaluation(run_id: str):
    settings = _settings()
    run = get_run(run_id, settings.database_url)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {run_id!r} not found")
    run.results = []
    return run


@app.get("/evaluations/{run_id}/results")
def get_evaluation_results(run_id: str):
    settings = _settings()
    run = get_run(run_id, settings.database_url)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {run_id!r} not found")
    return run.results


@app.get("/evaluations/compare/{run_a_id}/{run_b_id}", response_model=RunComparisonResult)
def compare_evaluations(run_a_id: str, run_b_id: str):
    settings = _settings()
    run_a = get_run(run_a_id, settings.database_url)
    run_b = get_run(run_b_id, settings.database_url)

    if not run_a:
        raise HTTPException(status_code=404, detail=f"Run {run_a_id!r} not found")
    if not run_b:
        raise HTTPException(status_code=404, detail=f"Run {run_b_id!r} not found")

    pass_rate_a = run_a.passed_cases / run_a.total_cases if run_a.total_cases else 0
    pass_rate_b = run_b.passed_cases / run_b.total_cases if run_b.total_cases else 0

    return RunComparisonResult(
        run_a=run_a,
        run_b=run_b,
        delta_score=run_b.average_score - run_a.average_score,
        delta_latency_ms=run_b.avg_latency_ms - run_a.avg_latency_ms,
        delta_cost_usd=run_b.total_cost_usd - run_a.total_cost_usd,
        delta_pass_rate=pass_rate_b - pass_rate_a,
    )
