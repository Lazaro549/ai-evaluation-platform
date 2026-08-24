"""Deterministic evaluation metrics."""
from __future__ import annotations

import math
import re
from typing import Optional

from app.models.schemas import MetricResult, MetricType


def exact_match(generated: str, expected: str) -> MetricResult:
    """Case-insensitive exact match after normalisation."""
    def normalise(s: str) -> str:
        return re.sub(r"\s+", " ", s.strip().lower())

    score = 1.0 if normalise(generated) == normalise(expected) else 0.0
    return MetricResult(
        name="exact_match",
        score=score,
        passed=score == 1.0,
        reason="Exact match after normalisation" if score == 1.0 else "Outputs differ",
        metric_type=MetricType.DETERMINISTIC,
    )


def response_length(generated: str, min_words: int = 5, max_words: int = 500) -> MetricResult:
    """Score based on whether response length is within acceptable bounds."""
    words = len(generated.split())
    if words < min_words:
        score, reason = 0.0, f"Response too short ({words} words, min {min_words})"
    elif words > max_words:
        score, reason = 0.5, f"Response very long ({words} words, max {max_words})"
    else:
        score, reason = 1.0, f"Response length acceptable ({words} words)"
    return MetricResult(
        name="response_length",
        score=score,
        passed=score >= 0.5,
        reason=reason,
        metric_type=MetricType.DETERMINISTIC,
    )


def keyword_overlap(generated: str, expected: str, threshold: float = 0.3) -> MetricResult:
    """Jaccard similarity of content word sets (stopword-filtered)."""
    _STOPWORDS = {
        "a", "an", "the", "is", "it", "in", "on", "at", "to", "for",
        "of", "and", "or", "but", "with", "this", "that", "are", "was",
        "be", "by", "as", "from", "has", "have", "had", "not", "its",
    }

    def tokens(text: str) -> set[str]:
        words = re.findall(r"\b[a-z]+\b", text.lower())
        return {w for w in words if w not in _STOPWORDS}

    gen_tokens = tokens(generated)
    exp_tokens = tokens(expected)

    if not exp_tokens:
        return MetricResult(
            name="keyword_overlap",
            score=0.0,
            passed=False,
            reason="Expected output has no content words",
            metric_type=MetricType.DETERMINISTIC,
        )

    intersection = gen_tokens & exp_tokens
    union = gen_tokens | exp_tokens
    score = len(intersection) / len(union) if union else 0.0

    return MetricResult(
        name="keyword_overlap",
        score=round(score, 4),
        passed=score >= threshold,
        reason=f"Jaccard similarity: {score:.2%} ({len(intersection)}/{len(union)} tokens)",
        metric_type=MetricType.DETERMINISTIC,
    )


def latency_score(latency_ms: float, threshold_ms: float = 5000.0) -> MetricResult:
    """Score latency: 1.0 if under threshold, decays linearly to 0 at 2x threshold."""
    if latency_ms <= threshold_ms:
        score = 1.0
    elif latency_ms >= 2 * threshold_ms:
        score = 0.0
    else:
        score = 1.0 - (latency_ms - threshold_ms) / threshold_ms

    return MetricResult(
        name="latency",
        score=round(score, 4),
        passed=latency_ms <= threshold_ms,
        reason=f"Latency {latency_ms:.0f}ms (threshold {threshold_ms:.0f}ms)",
        metric_type=MetricType.DETERMINISTIC,
    )


def token_efficiency(input_tokens: int, output_tokens: int, max_ratio: float = 10.0) -> MetricResult:
    """Score based on output/input token ratio — penalises extremely verbose responses."""
    if input_tokens == 0:
        return MetricResult(
            name="token_efficiency",
            score=1.0,
            passed=True,
            reason="No input tokens recorded",
            metric_type=MetricType.DETERMINISTIC,
        )
    ratio = output_tokens / input_tokens
    score = max(0.0, 1.0 - max(0.0, ratio - max_ratio) / max_ratio)
    return MetricResult(
        name="token_efficiency",
        score=round(score, 4),
        passed=ratio <= max_ratio,
        reason=f"Output/input token ratio: {ratio:.2f} (max {max_ratio})",
        metric_type=MetricType.DETERMINISTIC,
    )
