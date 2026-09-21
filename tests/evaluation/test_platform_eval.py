"""Evaluation suite for the platform itself — determinism and correctness checks."""
from __future__ import annotations

import pytest

from app.models.schemas import EvaluationCase, EvaluationDataset
from app.providers.mock_provider import MockProvider
from evaluation.metrics.deterministic import exact_match, keyword_overlap
from evaluation.runners.pipeline import run_evaluation


class TestDeterministicMetricConsistency:
    """Verify deterministic metrics produce identical results on repeated runs."""

    @pytest.mark.parametrize("generated,expected,min_score", [
        ("RAG combines retrieval with generation.", "RAG combines retrieval with generation.", 1.0),
        ("completely unrelated answer", "RAG combines retrieval with generation.", 0.0),
    ])
    def test_exact_match_deterministic(self, generated, expected, min_score):
        r1 = exact_match(generated, expected)
        r2 = exact_match(generated, expected)
        assert r1.score == r2.score == min_score

    def test_keyword_overlap_deterministic(self):
        for _ in range(3):
            r = keyword_overlap("retrieval augmented generation", "retrieval augmented generation")
            assert r.score == 1.0

    def test_pipeline_deterministic_with_mock(self):
        dataset = EvaluationDataset(
            name="determinism-test",
            cases=[
                EvaluationCase(
                    id="d1",
                    input="What is retrieval augmented generation?",
                    expected_output="RAG combines retrieval with generation.",
                ),
                EvaluationCase(
                    id="d2",
                    input="What is 2 + 2?",
                    expected_output="4",
                ),
            ],
        )
        metrics = ["exact_match", "keyword_overlap", "response_length"]

        scores = []
        for _ in range(3):
            run = run_evaluation(
                dataset,
                MockProvider(),
                MockProvider(model="judge"),
                metrics,
            )
            scores.append(run.average_score)

        assert scores[0] == scores[1] == scores[2], (
            f"Non-deterministic results: {scores}"
        )


class TestMetricBoundaries:
    """Verify metric scores are always in [0, 1]."""

    def test_exact_match_bounds(self):
        for gen, exp in [("a", "a"), ("a", "b"), ("", "something"), ("long text here", "short")]:
            r = exact_match(gen, exp)
            assert 0.0 <= r.score <= 1.0

    def test_keyword_overlap_bounds(self):
        for gen, exp in [("a b c", "a b c"), ("x y z", "a b c"), ("", "a b c")]:
            r = keyword_overlap(gen, exp)
            assert 0.0 <= r.score <= 1.0
