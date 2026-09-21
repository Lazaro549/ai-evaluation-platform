"""CLI entry point: python -m app.cli evaluate --dataset <path>"""
from __future__ import annotations

import argparse
import json
import sys

from app.core.config import get_settings
from app.providers.factory import get_provider
from app.services.database import save_run
from app.services.dataset_loader import load_dataset
from evaluation.reports.generator import save_csv_report, save_json_report, save_markdown_report
from evaluation.runners.pipeline import run_evaluation


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m app.cli",
        description="AI Evaluation Platform CLI",
    )
    sub = parser.add_subparsers(dest="command")

    ev = sub.add_parser("evaluate", help="Run an evaluation")
    ev.add_argument("--dataset", required=True, help="Path to dataset file (.json or .csv)")
    ev.add_argument("--provider", default=None, help="LLM provider (mock/openai/bedrock)")
    ev.add_argument("--model", default=None, help="Model name")
    ev.add_argument(
        "--output",
        choices=["json", "csv", "markdown", "all"],
        default="all",
        help="Report output format",
    )
    ev.add_argument("--metrics", nargs="*", help="Metrics to evaluate (space-separated)")

    return parser


def cmd_evaluate(args: argparse.Namespace) -> int:
    settings = get_settings()
    provider_name = args.provider or settings.provider
    model = args.model or settings.model_name

    print(f"Loading dataset: {args.dataset}")
    try:
        dataset = load_dataset(args.dataset)
    except (FileNotFoundError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(f"Provider: {provider_name} / Model: {model}")
    print(f"Cases: {len(dataset.cases)}")

    try:
        provider = get_provider(provider_name, model, settings)
        judge = get_provider(settings.judge_provider, settings.judge_model, settings)
    except (ValueError, ImportError) as exc:
        print(f"Provider error: {exc}", file=sys.stderr)
        return 1

    print("Running evaluation…")
    run = run_evaluation(
        dataset=dataset,
        provider=provider,
        judge=judge,
        metrics=args.metrics or None,
    )

    save_run(run, settings.database_url)

    # Print summary
    pass_rate = run.passed_cases / run.total_cases * 100 if run.total_cases else 0
    print(f"\n{'='*50}")
    print(f"Run ID:        {run.run_id}")
    print(f"Total cases:   {run.total_cases}")
    print(f"Passed:        {run.passed_cases} ({pass_rate:.1f}%)")
    print(f"Avg score:     {run.average_score:.4f}")
    print(f"Avg latency:   {run.avg_latency_ms:.0f} ms")
    print(f"Total tokens:  {run.total_input_tokens + run.total_output_tokens}")
    print(f"Est. cost:     ${run.total_cost_usd:.4f}")
    print(f"{'='*50}\n")

    fmt = args.output
    reports_dir = settings.reports_dir

    if fmt in ("json", "all"):
        p = save_json_report(run, reports_dir)
        print(f"JSON report:     {p}")
    if fmt in ("csv", "all"):
        p = save_csv_report(run, reports_dir)
        print(f"CSV report:      {p}")
    if fmt in ("markdown", "all"):
        p = save_markdown_report(run, reports_dir)
        print(f"Markdown report: {p}")

    return 0


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    if args.command == "evaluate":
        sys.exit(cmd_evaluate(args))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
