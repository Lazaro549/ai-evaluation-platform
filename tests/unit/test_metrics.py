"""Unit tests for deterministic metrics."""
from __future__ import annotations

import pytest

from evaluation.metrics.deterministic import (
    exact_match,
    keyword_overlap,
    latency_score,
    response_length,
    token_efficiency,
)


class TestExactMatch:
    def test_identical(self):
        r = exact_match("hello world", "hello world")
        assert r.score == 1.0
        assert r.passed is True

    def test_case_insensitive(self):
        r = exact_match("Hello World", "hello world")
        assert r.score == 1.0

    def test_whitespace_normalised(self):
        r = exact_match("hello  world", "hello world")
        assert r.score == 1.0

    def test_mismatch(self):
        r = exact_match("foo", "bar")
        assert r.score == 0.0
        assert r.passed is False

    def test_metric_name(self):
        r = exact_match("x", "x")
        assert r.name == "exact_match"


class TestKeywordOverlap:
    def test_identical(self):
        r = keyword_overlap("retrieval augmented generation", "retrieval augmented generation")
        assert r.score == 1.0

    def test_partial_overlap(self):
        r = keyword_overlap("retrieval generation", "retrieval augmented generation")
        assert 0.0 < r.score < 1.0

    def test_no_overlap(self):
        r = keyword_overlap("completely different text", "retrieval augmented generation")
        assert r.score < 0.3

    def test_empty_expected(self):
        r = keyword_overlap("some text", "")
        assert r.score == 0.0
        assert r.passed is False

    def test_threshold(self):
        r = keyword_overlap("a b c d e", "a b c d e", threshold=0.5)
        assert r.passed is True


class TestResponseLength:
    def test_acceptable(self):
        r = response_length("This is a reasonable response with enough words here.")
        assert r.score == 1.0
        assert r.passed is True

    def test_too_short(self):
        r = response_length("Hi", min_words=5)
        assert r.score == 0.0
        assert r.passed is False

    def test_very_long(self):
        long_text = " ".join(["word"] * 600)
        r = response_length(long_text, max_words=500)
        assert r.score == 0.5
        assert r.passed is True  # 0.5 >= 0.5


class TestLatencyScore:
    def test_fast(self):
        r = latency_score(100.0, threshold_ms=5000.0)
        assert r.score == 1.0
        assert r.passed is True

    def test_at_threshold(self):
        r = latency_score(5000.0, threshold_ms=5000.0)
        assert r.score == 1.0
        assert r.passed is True

    def test_over_threshold(self):
        r = latency_score(7500.0, threshold_ms=5000.0)
        assert r.score == pytest.approx(0.5, abs=0.01)
        assert r.passed is False

    def test_double_threshold(self):
        r = latency_score(10000.0, threshold_ms=5000.0)
        assert r.score == 0.0


class TestTokenEfficiency:
    def test_normal_ratio(self):
        r = token_efficiency(100, 200)
        assert r.score == 1.0
        assert r.passed is True

    def test_zero_input(self):
        r = token_efficiency(0, 100)
        assert r.score == 1.0

    def test_excessive_ratio(self):
        r = token_efficiency(10, 200, max_ratio=10.0)
        assert r.score < 1.0
        assert r.passed is False
