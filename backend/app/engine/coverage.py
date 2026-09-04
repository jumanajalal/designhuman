from __future__ import annotations

from typing import Mapping, Sequence

from app.schemas.design import DesignSpecification, DimensionConstraint


def passes_constraint(constraint: DimensionConstraint, value: float) -> bool:
    """True if a single measurement satisfies a single dimension constraint."""
    if constraint.min_value is not None and value < constraint.min_value:
        return False
    if constraint.max_value is not None and value > constraint.max_value:
        return False
    return True


def dimension_coverage(constraint: DimensionConstraint, values: Sequence[float]) -> dict:
    """
    Coverage for ONE dimension across a population.
    `values` must already be filtered to non-missing measurements for this
    dimension — missing values are excluded from the denominator, never
    counted as failures.
    """
    evaluated = len(values)
    if evaluated == 0:
        return {"dimension": constraint.dimension, "evaluated": 0, "passing": 0, "coverage": None}

    passing = sum(1 for v in values if passes_constraint(constraint, v))
    return {
        "dimension": constraint.dimension,
        "evaluated": evaluated,
        "passing": passing,
        "coverage": passing / evaluated,
    }


def joint_coverage(specification: DesignSpecification, profiles: Sequence[Mapping[str, float]]) -> dict:
    """
    Joint coverage across ALL dimensions in the spec.
    A profile (dict of dimension -> value) is only evaluated if it has a
    value for every constrained dimension — missing dimensions exclude the
    profile from the denominator, they don't count as a failure.
    """
    required_dims = [c.dimension for c in specification.dimensions]

    valid_profiles = [
        p for p in profiles
        if all(dim in p and p[dim] is not None for dim in required_dims)
    ]

    evaluated = len(valid_profiles)
    if evaluated == 0:
        return {"evaluated": 0, "passing": 0, "coverage": None, "per_dimension": []}

    def profile_passes(profile: Mapping[str, float]) -> bool:
        return all(passes_constraint(c, profile[c.dimension]) for c in specification.dimensions)

    passing = sum(1 for p in valid_profiles if profile_passes(p))

    per_dimension = [
        dimension_coverage(c, [p[c.dimension] for p in valid_profiles])
        for c in specification.dimensions
    ]

    return {
        "evaluated": evaluated,
        "passing": passing,
        "coverage": passing / evaluated,
        "per_dimension": per_dimension,
    }