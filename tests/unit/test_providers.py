"""Tests for MockProvider and provider factory."""
from __future__ import annotations

import pytest

from app.providers.factory import get_provider
from app.providers.mock_provider import MockProvider


class TestMockProvider:
    def test_generate_returns_response(self):
        provider = MockProvider()
        response = provider.generate("What is RAG?")
        assert response.text != ""
        assert response.latency_ms > 0
        assert response.input_tokens > 0
        assert response.output_tokens > 0

    def test_deterministic_same_input(self):
        provider = MockProvider()
        r1 = provider.generate("What is retrieval augmented generation?")
        r2 = provider.generate("What is retrieval augmented generation?")
        assert r1.text == r2.text

    def test_different_inputs_differ(self):
        provider = MockProvider()
        r1 = provider.generate("What is RAG?")
        r2 = provider.generate("What is the capital of France?")
        # Both should return non-empty responses
        assert r1.text != ""
        assert r2.text != ""

    def test_provider_name(self):
        provider = MockProvider()
        assert provider.provider_name == "mock"

    def test_model_name(self):
        provider = MockProvider(model="test-model")
        assert provider.model_name == "test-model"

    def test_rag_keyword_triggers_rag_response(self):
        provider = MockProvider()
        response = provider.generate("Explain retrieval augmented generation in detail")
        assert "retrieval" in response.text.lower() or "rag" in response.text.lower()


class TestProviderFactory:
    def test_mock_provider(self):
        p = get_provider("mock", "mock-model")
        assert isinstance(p, MockProvider)

    def test_unknown_provider_raises(self):
        with pytest.raises(ValueError, match="Unknown provider"):
            get_provider("unknown", "model")

    def test_openai_without_key_raises(self):
        from unittest.mock import patch
        with patch("app.core.config.get_settings") as mock_settings:
            mock_settings.return_value.openai_api_key = ""
            with pytest.raises((ValueError, ImportError)):
                get_provider("openai", "gpt-4o-mini")
