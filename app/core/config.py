"""Application configuration loaded from environment variables."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    # Provider
    provider: str = "mock"
    model_name: str = "mock-model"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Bedrock
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    bedrock_model: str = "anthropic.claude-3-haiku-20240307-v1:0"

    # Judge
    judge_provider: str = "mock"
    judge_model: str = "mock-model"

    # App
    log_level: str = "INFO"
    database_url: str = "sqlite:///./data/evaluations.db"
    reports_dir: str = "evaluation/reports"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Cost per 1K tokens (USD)
    cost_per_1k_input_tokens: float = 0.00015
    cost_per_1k_output_tokens: float = 0.0006

    @field_validator("provider", "judge_provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        allowed = {"mock", "openai", "bedrock"}
        if v not in allowed:
            raise ValueError(f"Provider must be one of {allowed}")
        return v

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
