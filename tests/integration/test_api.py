"""Integration tests for the FastAPI application."""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api.routes import app

client = TestClient(app)


@pytest.fixture
def sample_dataset_file(tmp_path: Path) -> str:
    data = {
        "name": "test-dataset",
        "cases": [
            {
                "id": "t1",
                "input": "What is retrieval augmented generation?",
                "expected_output": "RAG combines retrieval with generation.",
                "context": "RAG retrieves documents and uses them as context.",
                "tags": ["rag"],
            },
            {
                "id": "t2",
                "input": "What is 2 + 2?",
                "expected_output": "4",
                "tags": ["math"],
            },
        ],
    }
    p = tmp_path / "test_dataset.json"
    p.write_text(json.dumps(data))
    return str(p)


class TestHealthEndpoint:
    def test_health(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestEvaluationEndpoints:
    def test_run_evaluation(self, sample_dataset_file):
        r = client.post(
            "/evaluations/run",
            json={
                "dataset_path": sample_dataset_file,
                "provider": "mock",
                "model": "mock-model",
                "metrics": ["exact_match", "keyword_overlap"],
            },
        )
        assert r.status_code == 200
        data = r.json()
        assert data["total_cases"] == 2
        assert data["status"] == "completed"

    def test_list_evaluations(self, sample_dataset_file):
        # Create a run first
        client.post(
            "/evaluations/run",
            json={"dataset_path": sample_dataset_file, "provider": "mock", "model": "mock-model"},
        )
        r = client.get("/evaluations")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_evaluation(self, sample_dataset_file):
        run_r = client.post(
            "/evaluations/run",
            json={"dataset_path": sample_dataset_file, "provider": "mock", "model": "mock-model"},
        )
        run_id = run_r.json()["run_id"]
        r = client.get(f"/evaluations/{run_id}")
        assert r.status_code == 200
        assert r.json()["run_id"] == run_id

    def test_get_evaluation_not_found(self):
        r = client.get("/evaluations/nonexistent-id")
        assert r.status_code == 404

    def test_get_results(self, sample_dataset_file):
        run_r = client.post(
            "/evaluations/run",
            json={
                "dataset_path": sample_dataset_file,
                "provider": "mock",
                "model": "mock-model",
                "metrics": ["exact_match"],
            },
        )
        run_id = run_r.json()["run_id"]
        r = client.get(f"/evaluations/{run_id}/results")
        assert r.status_code == 200
        results = r.json()
        assert len(results) == 2

    def test_compare_runs(self, sample_dataset_file):
        r1 = client.post(
            "/evaluations/run",
            json={"dataset_path": sample_dataset_file, "provider": "mock", "model": "mock-model"},
        ).json()["run_id"]
        r2 = client.post(
            "/evaluations/run",
            json={"dataset_path": sample_dataset_file, "provider": "mock", "model": "mock-model"},
        ).json()["run_id"]

        r = client.get(f"/evaluations/compare/{r1}/{r2}")
        assert r.status_code == 200
        data = r.json()
        assert "delta_score" in data
        assert "delta_cost_usd" in data

    def test_invalid_dataset_path(self):
        r = client.post(
            "/evaluations/run",
            json={"dataset_path": "nonexistent.json", "provider": "mock"},
        )
        assert r.status_code == 400
