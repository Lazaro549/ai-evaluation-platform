"""SQLite persistence for evaluation runs."""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Optional

from app.models.schemas import EvaluationRun, RunStatus


def _db_path(database_url: str) -> str:
    """Extract file path from sqlite:/// URL."""
    return database_url.replace("sqlite:///", "")


def init_db(database_url: str) -> None:
    """Create tables if they don't exist."""
    path = _db_path(database_url)
    Path(path).parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS evaluation_runs (
                run_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                dataset_name TEXT NOT NULL,
                total_cases INTEGER DEFAULT 0,
                passed_cases INTEGER DEFAULT 0,
                failed_cases INTEGER DEFAULT 0,
                average_score REAL DEFAULT 0.0,
                avg_latency_ms REAL DEFAULT 0.0,
                total_input_tokens INTEGER DEFAULT 0,
                total_output_tokens INTEGER DEFAULT 0,
                total_cost_usd REAL DEFAULT 0.0,
                status TEXT DEFAULT 'completed',
                error TEXT,
                results_json TEXT NOT NULL DEFAULT '[]'
            )
        """)
        conn.commit()


@contextmanager
def get_connection(database_url: str) -> Generator[sqlite3.Connection, None, None]:
    path = _db_path(database_url)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def save_run(run: EvaluationRun, database_url: str) -> None:
    """Persist an evaluation run."""
    init_db(database_url)
    with get_connection(database_url) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO evaluation_runs VALUES (
                :run_id, :timestamp, :provider, :model, :dataset_name,
                :total_cases, :passed_cases, :failed_cases, :average_score,
                :avg_latency_ms, :total_input_tokens, :total_output_tokens,
                :total_cost_usd, :status, :error, :results_json
            )
            """,
            {
                "run_id": run.run_id,
                "timestamp": run.timestamp.isoformat(),
                "provider": run.provider,
                "model": run.model,
                "dataset_name": run.dataset_name,
                "total_cases": run.total_cases,
                "passed_cases": run.passed_cases,
                "failed_cases": run.failed_cases,
                "average_score": run.average_score,
                "avg_latency_ms": run.avg_latency_ms,
                "total_input_tokens": run.total_input_tokens,
                "total_output_tokens": run.total_output_tokens,
                "total_cost_usd": run.total_cost_usd,
                "status": run.status.value,
                "error": run.error,
                "results_json": json.dumps([r.model_dump() for r in run.results]),
            },
        )


def _row_to_run(row: sqlite3.Row) -> EvaluationRun:
    data = dict(row)
    results_raw = json.loads(data.pop("results_json", "[]"))
    run = EvaluationRun(**{k: v for k, v in data.items() if k != "results_json"})
    from app.models.schemas import CaseResult
    run.results = [CaseResult(**r) for r in results_raw]
    return run


def get_run(run_id: str, database_url: str) -> Optional[EvaluationRun]:
    init_db(database_url)
    with get_connection(database_url) as conn:
        row = conn.execute(
            "SELECT * FROM evaluation_runs WHERE run_id = ?", (run_id,)
        ).fetchone()
    return _row_to_run(row) if row else None


def list_runs(database_url: str, limit: int = 100) -> list[EvaluationRun]:
    init_db(database_url)
    with get_connection(database_url) as conn:
        rows = conn.execute(
            "SELECT * FROM evaluation_runs ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()
    return [_row_to_run(r) for r in rows]
