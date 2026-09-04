from __future__ import annotations
import json

from app.schemas.design import ConstraintType, DesignSpecification, Domain


def load_hero_spec(json_path: str) -> DesignSpecification:
    """
    Load Esha's ppe_schema.json (dimension name -> {min, max, unit}) and
    convert it into our normalized DesignSpecification. Dimension names in
    her file must match ANSUR II raw column names exactly, since we keep
    everything in ANSUR's native units end-to-end (mm, 0.1kg) — no unit
    conversion, no room for conversion bugs.
    """
    with open(json_path) as f:
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