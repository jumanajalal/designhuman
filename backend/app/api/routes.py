from pathlib import Path
import tempfile

from fastapi import APIRouter, UploadFile, File

from app.parsers.pdf_spec import parse_pdf_specification
from app.domains.ppe import PPE_COLUMN_MAP, load_hero_spec
from app.domains.ppe_loader import load_ansur_profiles
from app.engine.coverage import joint_coverage
from app.schemas.design import ConstraintType, DesignSpecification, Domain
from app.domains.automotive import load_hero_spec as load_automotive_hero_spec
from app.domains.automotive_loader import load_ansur_profiles as load_automotive_profiles
from app.domains.automotive import AUTOMOTIVE_COLUMN_MAP
from app.domains.automotive_loader import load_ansur_profiles as load_automotive_profiles

router = APIRouter(prefix="/coverage", tags=["coverage"])

# Project root:
# designhuman/
# ├── backend/
# └── data/
DOMAIN_REGISTRY = {
    Domain.PPE: (PPE_COLUMN_MAP, load_ansur_profiles),
    Domain.AUTOMOTIVE: (AUTOMOTIVE_COLUMN_MAP, load_automotive_profiles),
}
PROJECT_ROOT = Path(__file__).resolve().parents[3]
PPE_SCHEMA_PATH = PROJECT_ROOT / "data" / "schemas" / "ppe_schema.json"
MALE_DATA_PATH = PROJECT_ROOT / "data" / "ansur_ii_male.csv"
FEMALE_DATA_PATH = PROJECT_ROOT / "data" / "ansur_ii_female.csv"
AUTOMOTIVE_SCHEMA_PATH = PROJECT_ROOT / "data" / "schemas" / "automotive_schema.json"

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
    parsed_names = {d.name for d in parsed.dimensions}

    # 2. figure out which domain this spec actually belongs to, by seeing
    #    which domain's column map matches the most extracted dimensions
    best_domain = None
    best_match_count = 0
    for domain, (column_map, _loader) in DOMAIN_REGISTRY.items():
        match_count = len(parsed_names & column_map.keys())
        if match_count > best_match_count:
            best_domain = domain
            best_match_count = match_count

    if best_domain is None:
        return {
            "product": parsed.product,
            "error": "None of the extracted dimensions match any known domain's reference dataset.",
            "extractedDimensions": list(parsed_names),
        }

    column_map, load_profiles_fn = DOMAIN_REGISTRY[best_domain]
    supported_dims = [d for d in parsed.dimensions if d.name in column_map]
    unsupported_dims = [d for d in parsed.dimensions if d.name not in column_map]

    # 3. build DesignSpecification for the detected domain
    specification = DesignSpecification(
        domain=best_domain,
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

    # 4. load data using the detected domain's loader, compute
    profiles = load_profiles_fn(str(MALE_DATA_PATH), str(FEMALE_DATA_PATH), specification)
    male_profiles = [p for p in profiles if p["sex"] == "male"]
    female_profiles = [p for p in profiles if p["sex"] == "female"]

    overall = joint_coverage(specification, profiles)
    male = joint_coverage(specification, male_profiles)
    female = joint_coverage(specification, female_profiles)

    per_dim = overall["per_dimension"]
    scored = [d for d in per_dim if d["coverage"] is not None]
    weakest = min(scored, key=lambda d: d["coverage"]) if scored else None

    return {
        "specification": specification.model_dump(),
        "product": parsed.product,
        "domain": best_domain.value,
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
            {"dimension": d.name, "reason": f"No matching column in the ANSUR II reference dataset for domain '{best_domain.value}'"}
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

@router.post("/analyze/automotive")
def analyze_automotive():
    specification = load_automotive_hero_spec(str(AUTOMOTIVE_SCHEMA_PATH))
    profiles = load_automotive_profiles(str(MALE_DATA_PATH), str(FEMALE_DATA_PATH), specification)

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
                "coveragePercent": round(item["coverage"] * 100, 2) if item["coverage"] is not None else None,
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