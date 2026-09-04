from __future__ import annotations
import pandas as pd

from app.schemas.design import DesignSpecification


def load_ansur_profiles(
    male_csv: str,
    female_csv: str,
    specification: DesignSpecification,
) -> list[dict]:
    """
    Load both ANSUR II files, tag each row with its sex, and reduce each
    row to just the dimensions the given specification actually needs
    (plus 'sex'). Rows with a missing value for a needed dimension keep
    partial data — joint_coverage already excludes incomplete profiles.
    """
    needed_dims = [c.dimension for c in specification.dimensions]

    def load_one(path: str, sex: str) -> list[dict]:
        df = pd.read_csv(path, encoding="latin1")
        missing = [d for d in needed_dims if d not in df.columns]
        if missing:
            raise ValueError(f"{path} is missing expected columns: {missing}")
        subset = df[needed_dims].copy()
        subset["sex"] = sex
        return subset.to_dict(orient="records")

    return load_one(male_csv, "male") + load_one(female_csv, "female")