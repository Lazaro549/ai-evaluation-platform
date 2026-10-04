"""Abstract base class for LLM providers."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.schemas import LLMResponse


class LLMProvider(ABC):
    """Common interface for all LLM providers."""

    @abstractmethod
    def generate(self, prompt: str, system_prompt: str = "") -> LLMResponse:
        """Generate a response for the given prompt."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name."""

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Model identifier."""
