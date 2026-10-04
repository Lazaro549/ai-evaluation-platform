"""Provider factory."""
from __future__ import annotations

from app.providers.base import LLMProvider


def get_provider(provider: str, model: str, settings=None) -> LLMProvider:
    """Instantiate the requested LLM provider."""
    if settings is None:
        from app.core.config import get_settings
        settings = get_settings()

    if provider == "mock":
        from app.providers.mock_provider import MockProvider
        return MockProvider(model=model)

    if provider == "openai":
        from app.providers.openai_provider import OpenAIProvider
        return OpenAIProvider(api_key=settings.openai_api_key, model=model)

    if provider == "bedrock":
        from app.providers.bedrock_provider import BedrockProvider
        return BedrockProvider(
            model=model,
            region=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )

    raise ValueError(f"Unknown provider: {provider!r}. Choose from: mock, openai, bedrock")
