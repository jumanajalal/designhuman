from __future__ import annotations

import re
from dataclasses import dataclass
from pypdf import PdfReader


@dataclass(frozen=True)
class ParsedDimension:
    name: str
    min_value: float
    max_value: float
    unit: str


@dataclass(frozen=True)
class ParsedSpecification:
    product: str
    dimensions: list[ParsedDimension]


DIMENSION_ALIASES = {
    "head circumference": "head_circumference",
    "head length": "head_length",
    "head breadth": "head_breadth",
    "vertical head height": "vertical_head_height",
    "chest circumference": "chest_circumference",
    "stature": "stature",
    "body weight": "weight_kg",
    "weight": "weight_kg",
}

# Matches any numbered section heading ending in "requirements", e.g.
# "2. Head and Fit Requirements" or "2. Seating and Fit Requirements" —
# generalizes across domains instead of hardcoding one literal heading.
SECTION_HEADER_PATTERN = re.compile(r"^\d+\.\s+.*requirements$", re.IGNORECASE)

# Matches any numbered section heading at all, used to find where the
# dimensions section ENDS (i.e. the next numbered section, whatever it's
# called) instead of assuming it's always literally "3. ".
NUMBERED_SECTION_PATTERN = re.compile(r"^\d+\.\s")

# Accepted units in the dimension table. Add new ones here as new domains
# introduce new unit types (e.g. "deg" for automotive recline angle).
ACCEPTED_UNITS = {"mm", "cm", "kg", "0.1kg", "deg"}


def extract_pdf_text(pdf_path: str) -> str:
    """Extract all text from a PDF."""

    reader = PdfReader(pdf_path)

    pages = []

    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)

    return "\n".join(pages)


def canonicalize_dimension(name: str) -> str:
    """Convert human-readable PDF labels into backend dimension names."""

    cleaned = " ".join(name.lower().strip().split())

    return DIMENSION_ALIASES.get(cleaned, cleaned.replace(" ", "_"))


def parse_dimensions(text: str) -> list[ParsedDimension]:
    """
    Parse the table structure produced by a specification PDF, regardless
    of domain. Finds any numbered section heading ending in "Requirements"
    and reads its table until the next numbered section begins.

    The extracted PDF text looks like:

        Head circumference
        540
        620
        mm
    """

    dimensions: list[ParsedDimension] = []

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # Only parse the section containing dimensional requirements.
    try:
        start = next(
            i for i, line in enumerate(lines)
            if SECTION_HEADER_PATTERN.match(line)
        )
    except StopIteration:
        raise ValueError(
            "Could not find a dimensional requirements section "
            "(expected a numbered heading ending in 'Requirements', "
            "e.g. '2. Head and Fit Requirements')."
        )

    # Stop before the next numbered section, whatever it's called.
    end = len(lines)

    for i in range(start + 1, len(lines)):
        if NUMBERED_SECTION_PATTERN.match(lines[i]):
            end = i
            break

    section = lines[start:end]

    # Ignore table headers.
    ignored = {"parameter", "minimum", "maximum", "unit"}

    i = 0

    while i < len(section):
        name = section[i]

        if name.lower() in ignored:
            i += 1
            continue

        # We need:
        # name
        # minimum
        # maximum
        # unit
        if i + 3 >= len(section):
            break

        minimum = section[i + 1]
        maximum = section[i + 2]
        unit = section[i + 3]

        try:
            minimum_value = float(minimum)
            maximum_value = float(maximum)
        except ValueError:
            i += 1
            continue

        if unit.lower() not in ACCEPTED_UNITS:
            i += 1
            continue

        dimensions.append(
            ParsedDimension(
                name=canonicalize_dimension(name),
                min_value=minimum_value,
                max_value=maximum_value,
                unit=unit.lower(),
            )
        )

        i += 4

    return dimensions


def parse_product_name(text: str) -> str:
    """Extract the product name from the Product Identification table."""

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    for i, line in enumerate(lines):
        if line.lower() == "product" and i + 1 < len(lines):
            return lines[i + 1]

    return "Uploaded specification"


def parse_pdf_specification(pdf_path: str) -> ParsedSpecification:
    """Extract a normalized engineering specification from a PDF."""

    text = extract_pdf_text(pdf_path)

    dimensions = parse_dimensions(text)

    if not dimensions:
        raise ValueError(
            "No dimensional requirements could be extracted from the PDF."
        )

    return ParsedSpecification(
        product=parse_product_name(text),
        dimensions=dimensions,
    )