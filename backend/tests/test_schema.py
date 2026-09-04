from app.schemas.design import (
    ConstraintType,
    DesignSpecification,
    Domain,
)


def test_design_specification():
    specification = DesignSpecification(
        domain=Domain.PPE,
        name="Example PPE",
        dimensions=[
            {
                "dimension": "chest_circumference",
                "min_value": 86,
                "max_value": 112,
                "unit": "cm",
                "constraint_type": ConstraintType.RANGE,
            }
        ],
    )

    assert specification.domain == Domain.PPE
    assert specification.dimensions[0].dimension == "chest_circumference"
    assert specification.dimensions[0].min_value == 86
    assert specification.dimensions[0].max_value == 112