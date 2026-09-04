from __future__ import annotations

import json
from dataclasses import dataclass

from app.schemas.design import ConstraintType, DesignSpecification, Domain


@dataclass(frozen=True)
class ColumnMapping:
    """Maps a canonical dimension name to a raw dataset column + unit conversion."""

    raw_column: str
    raw_unit: str
    to_canonical_unit: float


# TODO: VERIFY against Esha's actual ANSUR export before the demo.
PPE_COLUMN_MAP: dict[str, ColumnMapping] = {
    "chest_circumference": ColumnMapping(
        raw_column="chestcircumference",
        raw_unit="mm",
        to_canonical_unit=0.1,
    ),
    "waist_circumference": ColumnMapping(
        raw_column="waistcircumference",
        raw_unit="mm",
        to_canonical_unit=0.1,
    ),
}


def normalize_profile(
    raw_row: dict,
    column_map: dict[str, ColumnMapping] = PPE_COLUMN_MAP,
) -> dict[str, float]:
    """
    Convert one raw ANSUR row into a canonical profile.

    Missing or empty dimensions are skipped.
    """

    profile: dict[str, float] = {}

    for canonical_dim, mapping in column_map.items():
        raw_value = raw_row.get(mapping.raw_column)

        if raw_value in (None, ""):
            continue

        profile[canonical_dim] = float(raw_value) * mapping.to_canonical_unit

    return profile


def normalize_dataset(
    raw_rows: list[dict],
    column_map: dict[str, ColumnMapping] = PPE_COLUMN_MAP,
) -> list[dict[str, float]]:
    """Normalize every raw population row."""

    return [normalize_profile(row, column_map) for row in raw_rows]


def load_hero_spec(json_path: str) -> DesignSpecification:
    """
    Load the PPE hero specification JSON and convert it into
    the normalized DesignSpecification used by the engine.
    """

    with open(json_path, encoding="utf-8") as f:
        raw = json.load(f)

    dimensions = [
        {
            "dimension": name,
            "min_value": bounds["min"],
            "max_value": bounds["max"],
            "unit": bounds["unit"],
            "constraint_type": ConstraintType.RANGE,
        }
        for name, bounds in raw["dimensions"].items()
    ]

    return DesignSpecification(
        domain=Domain.PPE,
        name=raw.get("hero_spec", raw.get("domain", "PPE spec")),
        dimensions=dimensions,
    )