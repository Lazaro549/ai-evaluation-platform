"""Tests for the evaluation pipeline."""
from __future__ import annotations

import pytest

from app.models.schemas import EvaluationCase, EvaluationDataset, RunStatus
from app.providers.mock_provider import MockProvider
from evaluation.runners.pipeline import evaluate_case, run_evaluation


@pytest.fixture
def mock_provider():
    return MockProvider()


@pytest.fixture
def mock_judge():
    return MockProvider(model="mock-judge")


@pytest.fixture
def simple_dataset():
    return EvaluationDataset(
        name="test-dataset",
        cases=[
            EvaluationCase(
                id="t1",
                input="What is retrieval augmented generation?",
                expected_output="RAG combines retrieval with generation.",
                context="RAG is a technique that retrieves documents and uses them as context.",
                tags=["rag"],
            ),
            EvaluationCase(
                id="t2",
                input="What is 2 + 2?",
                expected_output="4",
                tags=["math"],
            ),
        ],
    )


class TestEvaluateCase:
    def test_returns_case_result(self, mock_provider, mock_judge):
        case = EvaluationCase(input="What is AI?", expected_output="AI is artificial intelligence.")
        result = evaluate_case(case, mock_provider, mock_judge, ["exact_match", "response_length"])
        assert result.case_id == case.id
        assert result.generated_output != ""
        assert len(result.metrics) == 2

    def test_metrics_have_scores(self, mock_provider, mock_judge):
        case = EvaluationCase(input="What is AI?", expected_output="AI is artificial intelligence.")
        result = evaluate_case(case, mock_provider, mock_judge, ["exact_match", "keyword_overlap"])
        for m in result.metrics:
            assert 0.0 <= m.score <= 1.0

    def test_context_metrics_only_when_context_present(self, mock_provider, mock_judge):
        case = EvaluationCase(input="q", expected_output="a")  # no context
        result = evaluate_case(case, mock_provider, mock_judge, ["faithfulness", "context_relevance"])
        metric_names = [m.name for m in result.metrics]
        assert "faithfulness" not in metric_names
        assert "context_relevance" not in metric_names

    def test_context_metrics_run_with_context(self, mock_provider, mock_judge):
        case = EvaluationCase(input="q", expected_output="a", context="some context")
        result = evaluate_case(case, mock_provider, mock_judge, ["faithfulness"])
        metric_names = [m.name for m in result.metrics]
        assert "faithfulness" in metric_names

    def test_latency_recorded(self, mock_provider, mock_judge):
        case = EvaluationCase(input="q", expected_output="a")
        result = evaluate_case(case, mock_provider, mock_judge, ["latency"])
        assert result.latency_ms > 0

    def test_token_counts_recorded(self, mock_provider, mock_judge):
        case = EvaluationCase(input="What is AI?", expected_output="AI is artificial intelligence.")
        result = evaluate_case(case, mock_provider, mock_judge, [])
        assert result.input_tokens > 0
        assert result.output_tokens > 0


class TestRunEvaluation:
    def test_run_completes(self, mock_provider, mock_judge, simple_dataset):
        run = run_evaluation(simple_dataset, mock_provider, mock_judge)
        assert run.status == RunStatus.COMPLETED
        assert run.total_cases == 2

    def test_summary_computed(self, mock_provider, mock_judge, simple_dataset):
        run = run_evaluation(simple_dataset, mock_provider, mock_judge)
        assert run.total_cases == len(simple_dataset.cases)
        assert run.passed_cases + run.failed_cases == run.total_cases
        assert 0.0 <= run.average_score <= 1.0

    def test_deterministic_results(self, simple_dataset):
        """Same dataset + MockProvider should produce identical scores."""
        p1, j1 = MockProvider(), MockProvider(model="judge")
        p2, j2 = MockProvider(), MockProvider(model="judge")
        metrics = ["exact_match", "keyword_overlap", "response_length"]
        run1 = run_evaluation(simple_dataset, p1, j1, metrics)
        run2 = run_evaluation(simple_dataset, p2, j2, metrics)
        assert run1.average_score == run2.average_score

    def test_run_has_results(self, mock_provider, mock_judge, simple_dataset):
        run = run_evaluation(simple_dataset, mock_provider, mock_judge)
        assert len(run.results) == len(simple_dataset.cases)

    def test_provider_info_recorded(self, mock_provider, mock_judge, simple_dataset):
        run = run_evaluation(simple_dataset, mock_provider, mock_judge)
        assert run.provider == "mock"
        assert run.model == "mock-model"
