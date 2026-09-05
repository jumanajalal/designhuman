from __future__ import annotations

import pandas as pd

from app.domains.automotive import AUTOMOTIVE_COLUMN_MAP
from app.schemas.design import DesignSpecification


def load_ansur_profiles(
    male_csv: str,
    female_csv: str,
    specification: DesignSpecification,
) -> list[dict]:
    """
    Load both ANSUR II files and convert their raw columns into the
    canonical dimension names expected by the engine, automotive domain.
    """
    needed_dims = [c.dimension for c in specification.dimensions]

    def load_one(path: str, sex: str) -> list[dict]:
        df = pd.read_csv(path, encoding="latin1")

        raw_columns = []
        for dimension in needed_dims:
            if dimension not in AUTOMOTIVE_COLUMN_MAP:
                raise ValueError(f"No ANSUR mapping exists for dimension: {dimension}")

            raw_column = AUTOMOTIVE_COLUMN_MAP[dimension].raw_column
            if raw_column not in df.columns:
                raise ValueError(f"{path} is missing expected column: {raw_column}")

            raw_columns.append(raw_column)

        subset = df[raw_columns].copy()

        rename_map = {
            mapping.raw_column: canonical
            for canonical, mapping in AUTOMOTIVE_COLUMN_MAP.items()
            if canonical in needed_dims
        }
        subset = subset.rename(columns=rename_map)
        subset["sex"] = sex

        return subset.to_dict(orient="records")

    return load_one(male_csv, "male") + load_one(female_csv, "female")