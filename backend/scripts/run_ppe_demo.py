from app.domains.ppe import load_hero_spec
from app.domains.ppe_loader import load_ansur_profiles
from app.engine.coverage import joint_coverage

spec = load_hero_spec("../data/schemas/ppe_schema.json")
profiles = load_ansur_profiles("../data/ansur_ii_male.csv", "../data/ansur_ii_female.csv", spec)

male_profiles = [p for p in profiles if p["sex"] == "male"]
female_profiles = [p for p in profiles if p["sex"] == "female"]

print("ALL:", joint_coverage(spec, profiles)["coverage"])
print("MALE:", joint_coverage(spec, male_profiles)["coverage"])
print("FEMALE:", joint_coverage(spec, female_profiles)["coverage"])