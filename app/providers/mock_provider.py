"""Mock LLM provider for offline testing."""
from __future__ import annotations

import hashlib
import time

from app.models.schemas import LLMResponse
from app.providers.base import LLMProvider

_RESPONSES: dict[str, str] = {
    "rag": (
        "Retrieval-Augmented Generation (RAG) is a technique that combines "
        "information retrieval with text generation. It retrieves relevant "
        "documents from a knowledge base and uses them as context for the LLM "
        "to produce grounded, accurate responses."
    ),
    "hallucination": (
        "I don't have enough information in the provided context to answer "
        "this question accurately. Please provide more context."
    ),
    "default": (
        "This is a mock response generated for evaluation purposes. "
        "The mock provider returns deterministic responses based on input hashing."
    ),
}


def _deterministic_response(prompt: str) -> str:
    """Return a deterministic response based on prompt content."""
    lower = prompt.lower()
    if "retrieval" in lower or "rag" in lower or "augmented generation" in lower:
        return _RESPONSES["rag"]
    if "hallucin" in lower or "made up" in lower or "fabricat" in lower:
        return _RESPONSES["hallucination"]
    # Vary response slightly based on hash so different inputs differ
    h = int(hashlib.md5(prompt.encode()).hexdigest(), 16) % 100
    return f"{_RESPONSES['default']} (variant {h})"


class MockProvider(LLMProvider):
    """Deterministic provider for local testing — no API credentials required."""

    def __init__(self, model: str = "mock-model", latency_ms: float = 50.0) -> None:
        self._model = model
        self._latency_ms = latency_ms

    def generate(self, prompt: str, system_prompt: str = "") -> LLMResponse:
        start = time.perf_counter()
        text = _deterministic_response(prompt)
        elapsed = (time.perf_counter() - start) * 1000 + self._latency_ms

        input_tokens = max(1, len(prompt.split()))
        output_tokens = max(1, len(text.split()))

        return LLMResponse(
            text=text,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=elapsed,
            model=self._model,
        )

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return self._model
