from app.engine.coverage import dimension_coverage, joint_coverage
from app.schemas.design import ConstraintType, DesignSpecification, Domain


def make_spec():
    return DesignSpecification(
        domain=Domain.PPE,
        name="Test PPE",
        dimensions=[
            {"dimension": "chest_circumference", "min_value": 86, "max_value": 112, "unit": "cm", "constraint_type": ConstraintType.RANGE},
            {"dimension": "waist_circumference", "min_value": 72, "max_value": 100, "unit": "cm", "constraint_type": ConstraintType.RANGE},
        ],
    )


def test_dimension_coverage_basic():
    spec = make_spec()
    chest = spec.dimensions[0]
    values = [84, 87, 91, 100, 112, 115]  # 84 and 115 fail, 4 of 6 pass
    result = dimension_coverage(chest, values)
    assert result["evaluated"] == 6
    assert result["passing"] == 4
    assert result["coverage"] == 4 / 6


def test_joint_coverage_excludes_missing():
    spec = make_spec()
    profiles = [
        {"chest_circumference": 90, "waist_circumference": 80},   # passes both
        {"chest_circumference": 90, "waist_circumference": 110},  # fails waist
        {"chest_circumference": 90},                               # missing waist -> excluded
    ]
    result = joint_coverage(spec, profiles)
    assert result["evaluated"] == 2          # the incomplete profile is excluded
    assert result["passing"] == 1
    assert result["coverage"] == 0.5