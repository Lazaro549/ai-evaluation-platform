"""Basic schema validation tests."""
import pytest
from app.models.schemas import EvaluationCase, EvaluationDataset


def test_evaluation_case_valid():
    case = EvaluationCase(input="What is RAG?", expected_output="Retrieval-Augmented Generation")
    assert case.input
    assert case.id


def test_evaluation_case_empty_raises():
    with pytest.raises(ValueError):
        EvaluationCase(input="  ", expected_output="ok")


def test_dataset_requires_cases():
    with pytest.raises(ValueError):
        EvaluationDataset(name="empty", cases=[])
