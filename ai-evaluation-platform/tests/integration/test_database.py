"""Database persistence tests."""
from __future__ import annotations

import pytest

from app.models.schemas import EvaluationCase, EvaluationDataset, RunStatus
from app.providers.mock_provider import MockProvider
from app.services.database import get_run, init_db, list_runs, save_run
from evaluation.runners.pipeline import run_evaluation


@pytest.fixture
def db_url(tmp_path):
    return f"sqlite:///{tmp_path}/test.db"


@pytest.fixture
def sample_run(db_url):
    dataset = EvaluationDataset(
        name="db-test",
        cases=[EvaluationCase(input="What is AI?", expected_output="AI is artificial intelligence.")],
    )
    provider = MockProvider()
    judge = MockProvider(model="judge")
    run = run_evaluation(dataset, provider, judge, ["exact_match"])
    save_run(run, db_url)
    return run


class TestDatabase:
    def test_init_creates_table(self, db_url):
        init_db(db_url)  # Should not raise

    def test_save_and_retrieve(self, db_url, sample_run):
        retrieved = get_run(sample_run.run_id, db_url)
        assert retrieved is not None
        assert retrieved.run_id == sample_run.run_id
        assert retrieved.total_cases == sample_run.total_cases

    def test_results_persisted(self, db_url, sample_run):
        retrieved = get_run(sample_run.run_id, db_url)
        assert len(retrieved.results) == 1

    def test_list_runs(self, db_url, sample_run):
        runs = list_runs(db_url)
        assert len(runs) >= 1
        assert any(r.run_id == sample_run.run_id for r in runs)

    def test_get_nonexistent(self, db_url):
        result = get_run("nonexistent-id", db_url)
        assert result is None

    def test_upsert_replaces(self, db_url, sample_run):
        save_run(sample_run, db_url)  # Save again
        runs = list_runs(db_url)
        matching = [r for r in runs if r.run_id == sample_run.run_id]
        assert len(matching) == 1  # Not duplicated
