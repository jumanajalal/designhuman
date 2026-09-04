from fastapi import APIRouter

from app.engine.coverage import joint_coverage
from app.schemas.design import DesignSpecification

router = APIRouter(prefix="/coverage", tags=["coverage"])


@router.post("/joint")
def compute_joint_coverage(specification: DesignSpecification, profiles: list[dict[str, float]]):
    """
    Given a design specification and a list of population profiles
    (dimension name -> measurement), return joint and per-dimension coverage.
    """
    return joint_coverage(specification, profiles)