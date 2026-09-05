from __future__ import annotations

import json

from app.domains.ppe import ColumnMapping  # reuse the same dataclass
from app.schemas.design import ConstraintType, DesignSpecification, Domain


AUTOMOTIVE_COLUMN_MAP: dict[str, ColumnMapping] = {
    "sitting_height": ColumnMapping(
        raw_column="sittingheight",
        raw_unit="mm",
        to_canonical_unit=1.0,  # unused, kept for consistency with ColumnMapping shape
    ),
    "hip_breadth_sitting": ColumnMapping(
        raw_column="hipbreadthsitting",
        raw_unit="mm",
        to_canonical_unit=1.0,
    ),
    "knee_height_sitting": ColumnMapping(
        raw_column="kneeheightsitting",
        raw_unit="mm",
        to_canonical_unit=1.0,
    ),
}


def load_hero_spec(json_path: str) -> DesignSpecification:
    """
    Load the automotive hero specification JSON and convert it into
    the normalized DesignSpecification used by the engine.
    """
    with open(json_path, encoding="utf-8") as f:
        raw = json.load(f)

    dimension_aliases = {
        "sittingheight": "sitting_height",
        "hipbreadthsitting": "hip_breadth_sitting",
        "kneeheightsitting": "knee_height_sitting",
    }

    dimensions = []
    for raw_name, bounds in raw["dimensions"].items():
        canonical_name = dimension_aliases.get(raw_name, raw_name)
        dimensions.append(
            {
                "dimension": canonical_name,
                "min_value": bounds["min"],
                "max_value": bounds["max"],
                "unit": bounds["unit"],
                "constraint_type": ConstraintType.RANGE,
            }
        )

    return DesignSpecification(
        domain=Domain.AUTOMOTIVE,
        name=raw.get("name", raw.get("domain", "Automotive spec")),
        dimensions=dimensions,
    )