"""Report generation: JSON, CSV, and Markdown."""
from __future__ import annotations

import csv
import json
from pathlib import Path

from app.models.schemas import EvaluationRun


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def save_json_report(run: EvaluationRun, reports_dir: str = "evaluation/reports") -> Path:
    out_dir = Path(reports_dir)
    _ensure_dir(out_dir)
    path = out_dir / f"run_{run.run_id}.json"
    path.write_text(run.model_dump_json(indent=2), encoding="utf-8")
    return path


def save_csv_report(run: EvaluationRun, reports_dir: str = "evaluation/reports") -> Path:
    out_dir = Path(reports_dir)
    _ensure_dir(out_dir)
    path = out_dir / f"run_{run.run_id}.csv"

    rows = []
    for r in run.results:
        base = {
            "case_id": r.case_id,
            "input": r.input,
            "expected_output": r.expected_output,
            "generated_output": r.generated_output,
            "overall_score": round(r.overall_score, 4),
            "passed": r.passed,
            "latency_ms": round(r.latency_ms, 2),
            "input_tokens": r.input_tokens,
            "output_tokens": r.output_tokens,
            "estimated_cost_usd": round(r.estimated_cost_usd, 6),
            "error": r.error or "",
        }
        for m in r.metrics:
            base[f"metric_{m.name}"] = round(m.score, 4)
        rows.append(base)

    if rows:
        with path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)

    return path


def save_markdown_report(run: EvaluationRun, reports_dir: str = "evaluation/reports") -> Path:
    out_dir = Path(reports_dir)
    _ensure_dir(out_dir)
    path = out_dir / f"run_{run.run_id}.md"

    pass_rate = run.passed_cases / run.total_cases * 100 if run.total_cases else 0

    lines = [
        f"# Evaluation Report — Run `{run.run_id}`",
        "",
        f"**Timestamp:** {run.timestamp.isoformat()}  ",
        f"**Provider:** {run.provider}  ",
        f"**Model:** {run.model}  ",
        f"**Dataset:** {run.dataset_name}  ",
        "",
        "## Summary",
        "",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Total Cases | {run.total_cases} |",
        f"| Passed | {run.passed_cases} |",
        f"| Failed | {run.failed_cases} |",
        f"| Pass Rate | {pass_rate:.1f}% |",
        f"| Average Score | {run.average_score:.4f} |",
        f"| Avg Latency | {run.avg_latency_ms:.0f} ms |",
        f"| Total Input Tokens | {run.total_input_tokens} |",
        f"| Total Output Tokens | {run.total_output_tokens} |",
        f"| Estimated Cost | ${run.total_cost_usd:.4f} |",
        "",
        "## Results by Case",
        "",
        "| Case ID | Score | Passed | Latency (ms) | Error |",
        "|---------|-------|--------|--------------|-------|",
    ]

    for r in run.results:
        lines.append(
            f"| {r.case_id} | {r.overall_score:.2f} | {'✅' if r.passed else '❌'} "
            f"| {r.latency_ms:.0f} | {r.error or ''} |"
        )

    path.write_text("\n".join(lines), encoding="utf-8")
    return path
