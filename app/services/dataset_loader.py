"""Dataset loading utilities."""
from __future__ import annotations

import csv
import json
from pathlib import Path

from app.models.schemas import EvaluationCase, EvaluationDataset


def load_dataset(path: str) -> EvaluationDataset:
    """Load a dataset from a JSON or CSV file."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Dataset file not found: {path}")

    suffix = p.suffix.lower()
    if suffix == ".json":
        return _load_json(p)
    if suffix == ".csv":
        return _load_csv(p)
    raise ValueError(f"Unsupported dataset format: {suffix}. Use .json or .csv")


def _load_json(path: Path) -> EvaluationDataset:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        # Plain list of cases
        return EvaluationDataset(name=path.stem, cases=[EvaluationCase(**c) for c in data])
    # Full dataset object
    return EvaluationDataset(**data)


def _load_csv(path: Path) -> EvaluationDataset:
    cases = []
    with path.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            tags_raw = row.get("tags", "")
            tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if tags_raw else []
            cases.append(
                EvaluationCase(
                    id=row.get("id", ""),
                    input=row["input"],
                    expected_output=row["expected_output"],
                    context=row.get("context") or None,
                    tags=tags,
                )
            )
    return EvaluationDataset(name=path.stem, cases=cases)
