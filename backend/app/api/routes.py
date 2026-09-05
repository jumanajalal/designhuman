from pathlib import Path
import tempfile

from fastapi import APIRouter, UploadFile, File

from app.parsers.pdf_spec import parse_pdf_specification
from app.domains.ppe import PPE_COLUMN_MAP, load_hero_spec
from app.domains.ppe_loader import load_ansur_profiles
from app.engine.coverage import joint_coverage
from app.schemas.design import ConstraintType, DesignSpecification, Domain


router = APIRouter(prefix="/coverage", tags=["coverage"])

# Project root:
# designhuman/
# ├── backend/
# └── data/
PROJECT_ROOT = Path(__file__).resolve().parents[3]
PPE_SCHEMA_PATH = PROJECT_ROOT / "data" / "schemas" / "ppe_schema.json"
MALE_DATA_PATH = PROJECT_ROOT / "data" / "ansur_ii_male.csv"
FEMALE_DATA_PATH = PROJECT_ROOT / "data" / "ansur_ii_female.csv"


@router.post("/joint")
def compute_joint_coverage(
    specification: DesignSpecification,
    profiles: list[dict[str, float]],
):
    """
    Given a design specification and a list of population profiles
    (dimension name -> measurement), return joint and per-dimension coverage.
    """
    return joint_coverage(specification, profiles)


@router.post("/analyze")
async def analyze_pdf(file: UploadFile = File(...)):
    # 1. save + parse
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    parsed = parse_pdf_specification(tmp_path)

    # 2. split parsed dimensions into supported / unsupported based on
    #    whether we actually have an ANSUR mapping for them
    supported_names = set(PPE_COLUMN_MAP.keys())
    supported_dims = [d for d in parsed.dimensions if d.name in supported_names]
    unsupported_dims = [d for d in parsed.dimensions if d.name not in supported_names]

    if not supported_dims:
        return {
            "product": parsed.product,
            "error": "None of the extracted dimensions have a matching anthropometric dataset column.",
            "unsupportedDimensions": [d.name for d in unsupported_dims],
        }

    # 3. build DesignSpecification from only the supported dimensions
    specification = DesignSpecification(
        domain=Domain.PPE,
        name=parsed.product,
        dimensions=[
            {
                "dimension": d.name,
                "min_value": d.min_value,
                "max_value": d.max_value,
                "unit": d.unit,
                "constraint_type": ConstraintType.RANGE,
            }
            for d in supported_dims
        ],
    )

    # 4. load data, compute
    profiles = load_ansur_profiles(str(MALE_DATA_PATH), str(FEMALE_DATA_PATH), specification)
    male_profiles = [p for p in profiles if p["sex"] == "male"]
    female_profiles = [p for p in profiles if p["sex"] == "female"]

    overall = joint_coverage(specification, profiles)
    male = joint_coverage(specification, male_profiles)
    female = joint_coverage(specification, female_profiles)

    # 5. blind spot = the supported dimension with the lowest coverage
    #    (skip any dimension with no valid measurements at all)
    per_dim = overall["per_dimension"]
    scored = [d for d in per_dim if d["coverage"] is not None]
    weakest = min(scored, key=lambda d: d["coverage"]) if scored else None

    return {
        "product": parsed.product,
        "domain": "ppe",
        "coveragePercent": round(overall["coverage"] * 100, 2) if overall["coverage"] is not None else None,
        "evaluated": overall["evaluated"],
        "passing": overall["passing"],
        "maleCoveragePercent": round(male["coverage"] * 100, 2) if male["coverage"] is not None else None,
        "femaleCoveragePercent": round(female["coverage"] * 100, 2) if female["coverage"] is not None else None,
        "perDimension": [
            {**d, "coveragePercent": round(d["coverage"] * 100, 2), "excludedPercent": round((1 - d["coverage"]) * 100, 2)}
            if d["coverage"] is not None else {**d, "coveragePercent": None, "excludedPercent": None}
            for d in per_dim
        ],
        "weakestDimension": weakest["dimension"] if weakest else None,
        "supportedDimensions": [d.name for d in supported_dims],
        "unsupportedDimensions": [
            {"dimension": d.name, "reason": "No matching column in the ANSUR II reference dataset"}
            for d in unsupported_dims
        ],
    }


@router.post("/analyze/ppe")
def analyze_ppe():
    """
    Run the real PPE analysis using the hero PPE specification
    and the ANSUR II male + female datasets.
    """
    specification = load_hero_spec(str(PPE_SCHEMA_PATH))

    profiles = load_ansur_profiles(
        str(MALE_DATA_PATH),
        str(FEMALE_DATA_PATH),
        specification,
    )

    male_profiles = [p for p in profiles if p["sex"] == "male"]
    female_profiles = [p for p in profiles if p["sex"] == "female"]

    overall = joint_coverage(specification, profiles)
    male = joint_coverage(specification, male_profiles)
    female = joint_coverage(specification, female_profiles)

    return {
        "domain": specification.domain.value,
        "name": specification.name,
        "coveragePercent": round(overall["coverage"] * 100, 2),
        "evaluated": overall["evaluated"],
        "passing": overall["passing"],
        "maleCoveragePercent": round(male["coverage"] * 100, 2),
        "femaleCoveragePercent": round(female["coverage"] * 100, 2),
        "perDimension": [
            {
                "dimension": item["dimension"],
                "evaluated": item["evaluated"],
                "passing": item["passing"],
                "coveragePercent": (
                    round(item["coverage"] * 100, 2)
                    if item["coverage"] is not None
                    else None
                ),
            }
            for item in overall["per_dimension"]
        ],
    }


@router.post("/whatif")
def whatif_coverage(specification: DesignSpecification, changed_dimension: str, new_min: float, new_max: float):
    """Recompute coverage with one dimension's range modified. Returns before/after."""
    profiles = load_ansur_profiles(str(MALE_DATA_PATH), str(FEMALE_DATA_PATH), specification)
    before = joint_coverage(specification, profiles)

    new_dims = [
        c.model_copy(update={"min_value": new_min, "max_value": new_max}) if c.dimension == changed_dimension else c
        for c in specification.dimensions
    ]
    new_spec = specification.model_copy(update={"dimensions": new_dims})
    after = joint_coverage(new_spec, profiles)

    return {
        "dimension": changed_dimension,
        "before": {
            "min": next(c.min_value for c in specification.dimensions if c.dimension == changed_dimension),
            "max": next(c.max_value for c in specification.dimensions if c.dimension == changed_dimension),
            "coveragePercent": round(before["coverage"] * 100, 2),
        },
        "after": {"min": new_min, "max": new_max, "coveragePercent": round(after["coverage"] * 100, 2)},
    }