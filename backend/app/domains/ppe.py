from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ColumnMapping:
    """Maps a canonical dimension name to a raw dataset column + unit conversion."""
    raw_column: str
    raw_unit: str
    to_canonical_unit: float  # multiply raw value by this to get the canonical unit (cm)


# TODO: VERIFY against Esha's actual export before the demo. Column names and
# units below are PLACEHOLDERS — do not trust them until confirmed.
PPE_COLUMN_MAP: dict[str, ColumnMapping] = {
    "chest_circumference": ColumnMapping(raw_column="chestcircumference", raw_unit="mm", to_canonical_unit=0.1),
    "waist_circumference": ColumnMapping(raw_column="waistcircumference", raw_unit="mm", to_canonical_unit=0.1),
}


def normalize_profile(raw_row: dict, column_map: dict[str, ColumnMapping] = PPE_COLUMN_MAP) -> dict[str, float]:
    """
    Convert one raw dataset row into a canonical profile (dimension -> cm),
    skipping any dimension whose column is missing/empty for this row.
    """
    profile: dict[str, float] = {}
    for canonical_dim, mapping in column_map.items():
        raw_value = raw_row.get(mapping.raw_column)
        if raw_value in (None, ""):
            continue
        profile[canonical_dim] = float(raw_value) * mapping.to_canonical_unit
    return profile


def normalize_dataset(raw_rows: list[dict], column_map: dict[str, ColumnMapping] = PPE_COLUMN_MAP) -> list[dict[str, float]]:
    return [normalize_profile(row, column_map) for row in raw_rows]