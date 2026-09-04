from app.domains.ppe import normalize_dataset, normalize_profile
from app.engine.coverage import joint_coverage
from app.schemas.design import ConstraintType, DesignSpecification, Domain


def test_normalize_profile_converts_units_and_skips_missing():
    raw_row = {"chestcircumference": "900", "waistcircumference": ""}
    profile = normalize_profile(raw_row)
    assert profile == {"chest_circumference": 90.0}


def test_adapter_feeds_directly_into_engine():
    raw_rows = [
        {"chestcircumference": "900", "waistcircumference": "800"},   # -> 90, 80 cm: passes
        {"chestcircumference": "1150", "waistcircumference": "800"},  # -> 115 cm: fails chest
    ]
    profiles = normalize_dataset(raw_rows)

    spec = DesignSpecification(
        domain=Domain.PPE,
        name="Test PPE",
        dimensions=[
            {"dimension": "chest_circumference", "min_value": 86, "max_value": 112, "unit": "cm", "constraint_type": ConstraintType.RANGE},
            {"dimension": "waist_circumference", "min_value": 72, "max_value": 100, "unit": "cm", "constraint_type": ConstraintType.RANGE},
        ],
    )

    result = joint_coverage(spec, profiles)
    assert result["evaluated"] == 2
    assert result["passing"] == 1