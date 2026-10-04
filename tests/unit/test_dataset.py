"""Unit tests for dataset validation."""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

import pytest

from app.models.schemas import EvaluationCase, EvaluationDataset
from app.services.dataset_loader import load_dataset


class TestEvaluationCase:
    def test_valid(self):
        c = EvaluationCase(input="What is RAG?", expected_output="RAG is...")
        assert c.input == "What is RAG?"

    def test_empty_input_raises(self):
        with pytest.raises(ValueError):
            EvaluationCase(input="   ", expected_output="answer")

    def test_empty_expected_raises(self):
        with pytest.raises(ValueError):
            EvaluationCase(input="question", expected_output="")

    def test_default_id_generated(self):
        c = EvaluationCase(input="q", expected_output="a")
        assert c.id != ""

    def test_tags_default_empty(self):
        c = EvaluationCase(input="q", expected_output="a")
        assert c.tags == []


class TestEvaluationDataset:
    def test_valid(self):
        ds = EvaluationDataset(
            name="test",
            cases=[EvaluationCase(input="q", expected_output="a")],
        )
        assert len(ds.cases) == 1

    def test_empty_cases_raises(self):
        with pytest.raises(ValueError):
            EvaluationDataset(name="test", cases=[])


class TestDatasetLoader:
    def test_load_json_list(self, tmp_path: Path):
        data = [{"input": "What is AI?", "expected_output": "AI is..."}]
        p = tmp_path / "ds.json"
        p.write_text(json.dumps(data))
        ds = load_dataset(str(p))
        assert len(ds.cases) == 1
        assert ds.cases[0].input == "What is AI?"

    def test_load_json_object(self, tmp_path: Path):
        data = {
            "name": "my-dataset",
            "cases": [{"input": "q", "expected_output": "a"}],
        }
        p = tmp_path / "ds.json"
        p.write_text(json.dumps(data))
        ds = load_dataset(str(p))
        assert ds.name == "my-dataset"

    def test_load_csv(self, tmp_path: Path):
        csv_content = "id,input,expected_output,context,tags\nc1,What is AI?,AI is...,some context,ai\n"
        p = tmp_path / "ds.csv"
        p.write_text(csv_content)
        ds = load_dataset(str(p))
        assert len(ds.cases) == 1
        assert ds.cases[0].tags == ["ai"]

    def test_file_not_found(self):
        with pytest.raises(FileNotFoundError):
            load_dataset("nonexistent.json")

    def test_unsupported_format(self, tmp_path: Path):
        p = tmp_path / "ds.txt"
        p.write_text("data")
        with pytest.raises(ValueError, match="Unsupported"):
            load_dataset(str(p))
