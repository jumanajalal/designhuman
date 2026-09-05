# Design//Human — Demo Backup

Use this if live demo fails (wifi drops, laptop crashes, server won't start, etc).
Every number below is a REAL result already verified during development —
not fabricated for backup purposes. Screenshots of these exact runs should
also be saved to docs/screenshots/ before judging.

---

## Setup (if backend needs restarting)

```powershell
cd designhuman/backend
.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

Confirm alive: http://127.0.0.1:8000/health should return `{"status":"ok"}`

---

## Fallback 1 — Hero PPE result (Fall-Arrest Harness M/L)

**Command:**
```powershell
curl.exe -X POST http://127.0.0.1:8000/coverage/analyze/ppe
```

**Verified output (recorded [DATE]):**
```json
{
  "domain": "ppe",
  "name": "Fall-Arrest Safety Harness M/L",
  "coveragePercent": 73.78,
  "evaluated": 6068,
  "passing": 4477,
  "maleCoveragePercent": 74.6,
  "femaleCoveragePercent": 72.1,
  "perDimension": [
    {"dimension": "chest_circumference", "coveragePercent": 82.22},
    {"dimension": "stature", "coveragePercent": 93.0},
    {"dimension": "weight_kg", "coveragePercent": 91.96}
  ]
}
```

**Talking point:** 6,068 real ANSUR II profiles evaluated (4,082 male + 1,986
female). Weakest dimension is chest circumference, not stature or weight —
that's the design blind spot.

---

## Fallback 2 — Real PDF upload (Industrial Safety Helmet)

**Command:**
```powershell
curl.exe -X POST "http://127.0.0.1:8000/coverage/analyze" -F "file=@../data/sample.pdf"
```

**Verified output (recorded [DATE]):**
```json
{
  "product": "Industrial Safety Helmet",
  "coveragePercent": 77.83,
  "maleCoveragePercent": 87.97,
  "femaleCoveragePercent": 57.0,
  "weakestDimension": "head_length",
  "perDimension": [
    {"dimension": "head_circumference", "coveragePercent": 95.07},
    {"dimension": "head_length", "coveragePercent": 86.39},
    {"dimension": "head_breadth", "coveragePercent": 88.55}
  ],
  "unsupportedDimensions": [
    "vertical_head_height", "helmet_shell_internal_length",
    "helmet_shell_internal_breadth", "adjustment_range"
  ]
}
```

**THIS IS THE HEADLINE NUMBER: male 87.97% vs female 57.0%.**
A helmet with a stated fit range that appears "universal" excludes
nearly 43% of women in the reference population, driven mainly by
head_length. This is the core demo moment — say it early, say it clearly.

Also mention: 3 of 7 extracted spec dimensions could be evaluated against
ANSUR II (the rest have no matching column) — this is honest transparency,
not a weakness. Frame it as "we tell you what we can and can't verify,"
which is the whole point of the product.

---

## Fallback 3 — What-if redesign (before/after)

**Command:**
```powershell
python -c "import requests; r = requests.post('http://127.0.0.1:8000/coverage/whatif', params={'changed_dimension': 'head_length', 'new_min': 180, 'new_max': 215}, json={'domain': 'ppe', 'name': 'Industrial Safety Helmet', 'dimensions': [{'dimension': 'head_circumference', 'min_value': 540, 'max_value': 620, 'unit': 'mm', 'constraint_type': 'range'}, {'dimension': 'head_length', 'min_value': 185, 'max_value': 210, 'unit': 'mm', 'constraint_type': 'range'}, {'dimension': 'head_breadth', 'min_value': 145, 'max_value': 170, 'unit': 'mm', 'constraint_type': 'range'}]}); print(r.json())"
```

**Verified output (recorded [DATE]):**
```json
{
  "dimension": "head_length",
  "before": {"min": 185.0, "max": 210.0, "coveragePercent": 77.83},
  "after": {"min": 180.0, "max": 215.0, "coveragePercent": 84.85}
}
```

**Talking point:** Widening the weakest dimension by just 25mm total
(12.5mm each side) raises overall coverage from 77.83% → 84.85% —
a real, reproducible, deterministically-calculated redesign result,
not a slider gimmick.

---

## Methodology / Limitations (say this regardless of demo path)

- Reference population: ANSUR II, 2012 US Army anthropometric survey —
  4,082 male + 1,986 female active duty/reserve/guard personnel.
- This is NOT a general civilian population sample. Coverage percentages
  describe fit against this specific reference group, not humanity at large.
- Coverage = anthropometric design-envelope coverage, not a safety
  certification. Being outside the envelope is a design-coverage finding,
  not a claim that a person is unsafe.
- All percentages are deterministic calculations over verified data —
  no LLM-generated numbers anywhere in the pipeline.

---

## If EVERYTHING fails (no backend, no wifi)

Show screenshots (save these to docs/screenshots/ before judging):
1. Terminal output of Fallback 2 (helmet PDF result)
2. Terminal output of Fallback 3 (before/after)
3. Swagger /docs page showing the live endpoint list

Say: "Here's the actual output from our engine, captured earlier today,
running against the real ANSUR II dataset" — then walk through the
same three talking points above using the screenshots instead of a live call.