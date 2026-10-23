"""Unit tests for deterministic metrics."""
from evaluation.metrics.deterministic import (
    exact_match,
    keyword_overlap,
    response_length,
    toxicity_heuristic,
    contains_expected,
)


def test_exact_match_positive():
    r = exact_match("Hello World", "hello world")
    assert r.score == 1.0
    assert r.passed is True


def test_exact_match_negative():
    r = exact_match("Hello", "World")
    assert r.score == 0.0
    assert r.passed is False


def test_keyword_overlap():
    r = keyword_overlap(
        "Retrieval Augmented Generation combines search with generation",
        "RAG combines retrieval and generation",
    )
    assert r.score > 0.2
    assert r.name == "keyword_overlap"


def test_response_length_ok():
    text = " ".join(["word"] * 50)
    r = response_length(text)
    assert r.passed is True


def test_toxicity_clean():
    r = toxicity_heuristic("This is a normal helpful answer about Python.")
    assert r.score == 1.0
    assert r.passed is True


def test_contains_expected():
    r = contains_expected(
        "The capital of France is Paris and it is beautiful.",
        "capital of France is Paris",
    )
    assert r.score >= 0.5
    assert r.passed is True
