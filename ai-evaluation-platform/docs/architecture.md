# Architecture

## Overview

The AI Evaluation Platform follows a layered, provider-agnostic architecture.

## Layers

### 1. Data Layer (`app/models/schemas.py`)
Pydantic models define the data contracts:
- `EvaluationCase` — a single test case
- `EvaluationDataset` — a collection of cases
- `LLMResponse` — raw provider output
- `MetricResult` — a single metric score
- `CaseResult` — all metrics for one case
- `EvaluationRun` — aggregate run summary

### 2. Provider Layer (`app/providers/`)
Abstract `LLMProvider` interface with three implementations:
- `MockProvider` — deterministic, offline, no credentials
- `OpenAIProvider` — OpenAI and compatible APIs
- `BedrockProvider` — Amazon Bedrock (Anthropic Claude)

### 3. Metrics Layer (`evaluation/metrics/`)
Two categories:
- **Deterministic** — pure functions, no external calls
- **Model-based** — LLM-as-a-judge via structured prompts

### 4. Pipeline Layer (`evaluation/runners/pipeline.py`)
Orchestrates: dataset → provider → metrics → results → summary

### 5. Persistence Layer (`app/services/database.py`)
SQLite via raw `sqlite3` — no ORM dependency.

### 6. API Layer (`app/api/routes.py`)
FastAPI endpoints expose all evaluation functionality over HTTP.

### 7. Presentation Layer (`dashboard/streamlit_app.py`)
Streamlit dashboard for visual exploration.

## Design Decisions

- **No ORM** — SQLite with raw queries keeps the dependency footprint minimal
- **Pydantic v2** — strict validation at all boundaries
- **Provider factory** — decouples evaluation logic from provider specifics
- **Deterministic mock** — enables reproducible CI without API costs
