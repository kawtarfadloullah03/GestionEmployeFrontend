"""Fetch and aggregate a public payroll dataset without persisting employee-level rows."""

from __future__ import annotations

import csv
import json
import statistics
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
OUTPUT = DATA_DIR / "norfolk_public_payroll_summary.csv"
SOURCE_URL = "https://data.norfolk.gov/resource/4fsk-z8s8.json"
SELECTED_FIELDS = "department,job_title,annual_base_rate"
MIN_GROUP_SIZE = 3


def main() -> None:
    query = urllib.parse.urlencode({
        "$select": SELECTED_FIELDS,
        "$where": "annual_base_rate IS NOT NULL",
        "$limit": "10000",
    })
    request = urllib.request.Request(
        f"{SOURCE_URL}?{query}",
        headers={"Accept": "application/json", "User-Agent": "WorkFlow-HR-M2-educational-project"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        payload = response.read(20 * 1024 * 1024 + 1)
    if len(payload) > 20 * 1024 * 1024:
        raise RuntimeError("Source response exceeds the 20 MiB import limit.")
    records = json.loads(payload)
    if not isinstance(records, list) or not records:
        raise RuntimeError("The public payroll source returned no records.")

    prohibited = {"name", "first_name", "last_name", "email", "employee_id", "ssn"}
    if prohibited.intersection({key.casefold() for row in records for key in row}):
        raise RuntimeError("The source response unexpectedly contains direct identifiers; import aborted.")

    groups: dict[tuple[str, str], list[float]] = defaultdict(list)
    for row in records:
        department = " ".join(str(row.get("department") or "Non renseigné").split())
        position = " ".join(str(row.get("job_title") or "Non renseigné").split())
        try:
            salary = float(str(row.get("annual_base_rate", "")).replace("$", "").replace(",", ""))
        except (TypeError, ValueError):
            continue
        if salary > 0:
            groups[(department, position)].append(salary)

    snapshot_date = date.today().isoformat()
    output_rows = []
    for (department, position), values in sorted(groups.items()):
        if len(values) < MIN_GROUP_SIZE:
            continue
        output_rows.append({
            "department": department,
            "position": position,
            "employee_count": len(values),
            "mean_salary_usd": round(statistics.mean(values), 2),
            "total_annual_base_usd": round(sum(values), 2),
            "currency": "USD",
            "snapshot_date": snapshot_date,
        })
    if not output_rows:
        raise RuntimeError("No role groups meet the minimum aggregation threshold.")

    with OUTPUT.open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(output, fieldnames=list(output_rows[0]))
        writer.writeheader()
        writer.writerows(output_rows)
    print(
        f"Imported {len(records)} public source rows into {len(output_rows)} department/role aggregates; "
        "no individual salary rows or direct identifiers were written."
    )


if __name__ == "__main__":
    main()
