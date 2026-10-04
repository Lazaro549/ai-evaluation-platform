"""Tests for report generation."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.models.schemas import EvaluationCase, EvaluationDataset
from app.providers.mock_provider import MockProvider
from evaluation.reports.generator import save_csv_report, save_json_report, save_markdown_report
from evaluation.runners.pipeline import run_evaluation


@pytest.fixture
def completed_run(tmp_path):
    dataset = EvaluationDataset(
        name="report-test",
        cases=[
            EvaluationCase(
                id="r1",
                input="What is RAG?",
                expected_output="RAG combines retrieval with generation.",
                context="RAG retrieves documents.",
            ),
            EvaluationCase(id="r2", input="What is 2+2?", expected_output="4"),
        ],
    )
    run = run_evaluation(dataset, MockProvider(), MockProvider(model="judge"), ["exact_match", "keyword_overlap"])
    return run


class TestReportGenerator:
    def test_json_report_created(self, completed_run, tmp_path):
        path = save_json_report(completed_run, str(tmp_path))
        assert path.exists()
        data = json.loads(path.read_text())
        assert data["run_id"] == completed_run.run_id
        assert data["total_cases"] == 2

    def test_csv_report_created(self, completed_run, tmp_path):
        path = save_csv_report(completed_run, str(tmp_path))
        assert path.exists()
        content = path.read_text()
        assert "case_id" in content
        assert "r1" in content

    def test_markdown_report_created(self, completed_run, tmp_path):
        path = save_markdown_report(completed_run, str(tmp_path))
        assert path.exists()
        content = path.read_text(encoding="utf-8")
        assert "# Evaluation Report" in content
        assert completed_run.run_id in content
        assert "Total Cases" in content

    def test_reports_dir_created(self, completed_run, tmp_path):
        nested = tmp_path / "nested" / "reports"
        save_json_report(completed_run, str(nested))
        assert nested.exists()
