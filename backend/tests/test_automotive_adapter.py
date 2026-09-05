from app.domains.automotive import load_hero_spec
from app.domains.automotive_loader import load_ansur_profiles
from app.engine.coverage import joint_coverage


def test_automotive_hero_spec_loads():
    spec = load_hero_spec("../data/schemas/automotive_schema.json")
    assert spec.name == "Standard Driver Seat Fit"
    dim_names = {d.dimension for d in spec.dimensions}
    assert dim_names == {"sitting_height", "hip_breadth_sitting", "knee_height_sitting"}


def test_automotive_end_to_end():
    spec = load_hero_spec("../data/schemas/automotive_schema.json")
    profiles = load_ansur_profiles("../data/ansur_ii_male.csv", "../data/ansur_ii_female.csv", spec)
    result = joint_coverage(spec, profiles)
    assert result["evaluated"] == 6068  # sanity: full dataset used, same as PPE
    assert 0 <= result["coverage"] <= 1