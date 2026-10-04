"""Amazon Bedrock LLM provider."""
from __future__ import annotations

import json
import time

from app.models.schemas import LLMResponse
from app.providers.base import LLMProvider


class BedrockProvider(LLMProvider):
    """Provider for Amazon Bedrock (Anthropic Claude models)."""

    def __init__(
        self,
        model: str = "anthropic.claude-3-haiku-20240307-v1:0",
        region: str = "us-east-1",
        aws_access_key_id: str = "",
        aws_secret_access_key: str = "",
    ) -> None:
        try:
            import boto3  # type: ignore
        except ImportError as exc:
            raise ImportError("Install boto3: pip install boto3") from exc

        self._model = model
        kwargs: dict = {"region_name": region}
        if aws_access_key_id and aws_secret_access_key:
            kwargs["aws_access_key_id"] = aws_access_key_id
            kwargs["aws_secret_access_key"] = aws_secret_access_key

        self._client = boto3.client("bedrock-runtime", **kwargs)

    def generate(self, prompt: str, system_prompt: str = "") -> LLMResponse:
        messages = [{"role": "user", "content": prompt}]
        body: dict = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": messages,
        }
        if system_prompt:
            body["system"] = system_prompt

        start = time.perf_counter()
        response = self._client.invoke_model(
            modelId=self._model,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )
        elapsed = (time.perf_counter() - start) * 1000

        result = json.loads(response["body"].read())
        text = result.get("content", [{}])[0].get("text", "")
        usage = result.get("usage", {})

        return LLMResponse(
            text=text,
            input_tokens=usage.get("input_tokens", 0),
            output_tokens=usage.get("output_tokens", 0),
            latency_ms=elapsed,
            model=self._model,
        )

    @property
    def provider_name(self) -> str:
        return "bedrock"

    @property
    def model_name(self) -> str:
        return self._model
