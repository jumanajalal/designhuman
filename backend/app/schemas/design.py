from enum import Enum

from pydantic import BaseModel, Field


class Domain(str, Enum):
    PPE = "ppe"
    AUTOMOTIVE = "automotive"
    WORKPLACE = "workplace"


class ConstraintType(str, Enum):
    RANGE = "range"


class DimensionConstraint(BaseModel):
    """
    A normalized constraint extracted from a design specification.

    Example:
        waist_circumference: 72-100 cm
    """

    dimension: str = Field(
        ...,
        description="Canonical dimension name used by the engine.",
    )

    min_value: float | None = Field(
        default=None,
        description="Minimum acceptable value.",
    )

    max_value: float | None = Field(
        default=None,
        description="Maximum acceptable value.",
    )

    unit: str = Field(
        ...,
        description="Canonical unit for this constraint.",
    )

    constraint_type: ConstraintType = ConstraintType.RANGE


class DesignSpecification(BaseModel):
    """
    Normalized representation of a physical design specification.
    """

    domain: Domain

    name: str

    dimensions: list[DimensionConstraint]