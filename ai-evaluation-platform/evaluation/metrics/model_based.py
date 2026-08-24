"""Model-based evaluation metrics using an LLM judge."""
from __future__ import annotations

import json
import re
from typing import Optional

from app.models.schemas import MetricResult, MetricType
from app.providers.base import LLMProvider

_JUDGE_SYSTEM = (
    "You are an objective evaluator. Respond ONLY with valid JSON matching: "
    '{"score": <float 0-1>, "reason": "<string>", "passed": <bool>}'
)

_RELEVANCE_PROMPT = """Evaluate whether the generated answer is relevant to the question.

Question: {question}
Generated Answer: {answer}

Score 1.0 if fully relevant, 0.5 if partially relevant, 0.0 if irrelevant.
Respond ONLY with JSON: {{"score": <0-1>, "reason": "<string>", "passed": <bool>}}"""

_FAITHFULNESS_PROMPT = """Evaluate whether the generated answer is faithful to the provided context.
Only information present in the context should be stated as fact.

Context: {context}
Generated Answer: {answer}

Score 1.0 if fully faithful, 0.5 if minor unsupported claims, 0.0 if hallucinated.
Respond ONLY with JSON: {{"score": <0-1>, "reason": "<string>", "passed": <bool>}}"""

_CONTEXT_RELEVANCE_PROMPT = """Evaluate whether the provided context is relevant to answering the question.

Question: {question}
Context: {context}

Score 1.0 if highly relevant, 0.5 if partially relevant, 0.0 if irrelevant.
Respond ONLY with JSON: {{"score": <0-1>, "reason": "<string>", "passed": <bool>}}"""

_SEMANTIC_SIMILARITY_PROMPT = """Evaluate the semantic similarity between the generated answer and the expected answer.

Expected Answer: {expected}
Generated Answer: {generated}

Score 1.0 if semantically equivalent, 0.5 if partially similar, 0.0 if unrelated.
Respond ONLY with JSON: {{"score": <0-1>, "reason": "<string>", "passed": <bool>}}"""


def _parse_judge_response(text: str) -> dict:
    """Safely parse JSON from judge response, handling markdown code blocks."""
    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()
    # Extract first JSON object
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {"score": 0.0, "reason": f"Could not parse judge response: {text[:200]}", "passed": False}


def _judge_metric(name: str, prompt: str, judge: LLMProvider) -> MetricResult:
    """Run a single judge evaluation and return a MetricResult."""
    response = judge.generate(prompt, system_prompt=_JUDGE_SYSTEM)
    data = _parse_judge_response(response.text)
    score = float(data.get("score", 0.0))
    score = max(0.0, min(1.0, score))
    return MetricResult(
        name=name,
        score=round(score, 4),
        passed=bool(data.get("passed", score >= 0.5)),
        reason=str(data.get("reason", "")),
        metric_type=MetricType.MODEL_BASED,
    )


def answer_relevance(question: str, answer: str, judge: LLMProvider) -> MetricResult:
    prompt = _RELEVANCE_PROMPT.format(question=question, answer=answer)
    return _judge_metric("answer_relevance", prompt, judge)


def faithfulness(context: str, answer: str, judge: LLMProvider) -> MetricResult:
    prompt = _FAITHFULNESS_PROMPT.format(context=context, answer=answer)
    return _judge_metric("faithfulness", prompt, judge)


def context_relevance(question: str, context: str, judge: LLMProvider) -> MetricResult:
    prompt = _CONTEXT_RELEVANCE_PROMPT.format(question=question, context=context)
    return _judge_metric("context_relevance", prompt, judge)


def semantic_similarity(expected: str, generated: str, judge: LLMProvider) -> MetricResult:
    prompt = _SEMANTIC_SIMILARITY_PROMPT.format(expected=expected, generated=generated)
    return _judge_metric("semantic_similarity", prompt, judge)
