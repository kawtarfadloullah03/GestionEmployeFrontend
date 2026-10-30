"""Extract an anonymized, public compensation-band reference from the source PDF."""

from __future__ import annotations

import csv
import re
from pathlib import Path

from pypdf import PdfReader


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SOURCE_PDF = DATA_DIR / "norfolk_compensation_plan_fy2027.pdf"
TEXT_OUTPUT = DATA_DIR / "norfolk_compensation_plan_fy2027.txt"
CSV_OUTPUT = DATA_DIR / "norfolk_compensation_bands_fy2027.csv"
SOURCE_URL = "https://norfolk.gov/5303/FY-2027-Compensation-Plan"
PLANS = "ADM|CCC|COR|CWA|EXE|FLX|FR|GEN|LD|POL|SHC|SHS|SPE|TEL|TRA|TRO"
ROW_PATTERN = re.compile(
    rf"^(?P<job_code>[A-Z0-9]{{6}})\s+(?P<title>.+?)\s+"
    rf"(?P<plan>{PLANS})\s+(?P<grade>[A-Z0-9]{{1,4}})\s+"
    r"(?P<minimum>[\d,]+\.\d{2})\$\s+(?P<maximum>[\d,]+\.\d{2})\$"
)


def main() -> None:
    if not SOURCE_PDF.is_file():
        raise FileNotFoundError(f"Missing source document: {SOURCE_PDF}")
    reader = PdfReader(str(SOURCE_PDF))
    pages = [page.extract_text() or "" for page in reader.pages]
    extracted_text = "\n\n".join(pages[67:])
    TEXT_OUTPUT.write_text(extracted_text, encoding="utf-8")

    rows = []
    for line in extracted_text.splitlines():
        match = ROW_PATTERN.match(" ".join(line.split()))
        if not match:
            continue
        row = match.groupdict()
        row["classification_title"] = row.pop("title").strip()
        row["minimum_usd"] = row.pop("minimum").replace(",", "")
        row["maximum_usd"] = row.pop("maximum").replace(",", "")
        row["effective_date"] = "2026-07-01"
        row["source_url"] = SOURCE_URL
        rows.append(row)

    if len(rows) < 100:
        raise RuntimeError(f"Only {len(rows)} compensation bands parsed; refusing to write an incomplete table.")

    fieldnames = [
        "job_code", "classification_title", "plan", "grade", "minimum_usd",
        "maximum_usd", "effective_date", "source_url",
    ]
    with CSV_OUTPUT.open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Extracted {len(rows)} public salary-band rows; no employee names or identifiers are included.")


if __name__ == "__main__":
    main()
