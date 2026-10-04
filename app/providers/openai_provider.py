"""OpenAI-compatible LLM provider."""
from __future__ import annotations

import time
from typing import Optional

from app.models.schemas import LLMResponse
from app.providers.base import LLMProvider


class OpenAIProvider(LLMProvider):
    """Provider for OpenAI and OpenAI-compatible APIs."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini", base_url: Optional[str] = None) -> None:
        if not api_key:
            raise ValueError(
                "OpenAI API key is required. Set OPENAI_API_KEY in your .env file "
                "or use PROVIDER=mock for offline testing."
            )
        try:
            from openai import OpenAI  # type: ignore
        except ImportError as exc:
            raise ImportError("Install openai: pip install openai") from exc

        self._model = model
        self._client = OpenAI(api_key=api_key, base_url=base_url)

    def generate(self, prompt: str, system_prompt: str = "") -> LLMResponse:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        start = time.perf_counter()
        response = self._client.chat.completions.create(
            model=self._model,
            messages=messages,
        )
        elapsed = (time.perf_counter() - start) * 1000

        choice = response.choices[0]
        usage = response.usage

        return LLMResponse(
            text=choice.message.content or "",
            input_tokens=usage.prompt_tokens if usage else 0,
            output_tokens=usage.completion_tokens if usage else 0,
            latency_ms=elapsed,
            model=self._model,
        )

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self._model
