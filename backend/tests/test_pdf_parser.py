from app.parsers.pdf_spec import parse_dimensions


def test_parses_head_and_fit_requirements_section():
    text = """1. Product Identification
Product
Test Helmet
2. Head and Fit Requirements
Parameter
Minimum
Maximum
Unit
Head circumference
540
620
mm
3. Fit and Safety Criteria
"""
    dims = parse_dimensions(text)
    assert len(dims) == 1
    assert dims[0].name == "head_circumference"
    assert dims[0].min_value == 540
    assert dims[0].max_value == 620


def test_parses_seating_and_fit_requirements_section():
    text = """1. Product Identification
2. Seating and Fit Requirements
Parameter
Minimum
Maximum
Unit
Sitting height
800
980
mm
Hip breadth sitting
310
450
mm
3. Fit and Safety Criteria
"""
    dims = parse_dimensions(text)
    names = {d.name for d in dims}
    assert names == {"sitting_height", "hip_breadth_sitting"}