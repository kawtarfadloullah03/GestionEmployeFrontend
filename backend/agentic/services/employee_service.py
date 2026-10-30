"""
Données RH utilisées par les outils MCP et les workflows LangGraph.
S'appuie sur le seed du projet Gestion des Employés (sans remplacer MongoDB).
"""

import os
from typing import Any, Optional

from seed_data import INITIAL_DATA
from app.core.config import ALLOW_IN_MEMORY_FALLBACK, IS_PRODUCTION

SALARY_BY_ID = {
    "EMP-00124": 52000,
    "EMP-00101": 68000,
    "EMP-00100": 58000,
    "EMP-00125": 49000,
    "EMP-00126": 46000,
    "EMP-00130": 51000,
}


def _with_salary(emp: dict[str, Any]) -> dict[str, Any]:
    enriched = dict(emp)
    enriched["salary"] = emp.get("salary") or SALARY_BY_ID.get(emp["id"], 42000)
    return enriched


def _load_collection(collection: str) -> list[dict[str, Any]]:
    """Lit la collection Mongo du projet RH; utilise les seeds en mode démo hors ligne."""
    mongo_uri = os.getenv("MONGODB_URI", "").strip()
    if mongo_uri:
        try:
            from pymongo import MongoClient

            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1500)
            database = client[os.getenv("DATABASE_NAME", "GestionEmploye")]
            documents = list(database[collection].find({}, {"_id": 0}))
            client.close()
            if documents:
                return documents
        except Exception:
            if IS_PRODUCTION or not ALLOW_IN_MEMORY_FALLBACK:
                raise RuntimeError("Référentiel RH indisponible; aucune donnée de démonstration ne sera utilisée.")
    elif IS_PRODUCTION or not ALLOW_IN_MEMORY_FALLBACK:
        raise RuntimeError("MONGODB_URI est requis pour les outils RH.")
    value = INITIAL_DATA.get(collection, [])
    return value if isinstance(value, list) else []


def get_all_employees(department: Optional[str] = None) -> list[dict[str, Any]]:
    employees = [_with_salary(e) for e in _load_collection("employees")]
    if not department:
        return employees
    needle = " ".join(department.casefold().replace("&", "and").split())
    aliases = {
        "it": {"dept_it", "it & engineering", "it and engineering", "engineering"},
        "engineering": {"dept_it", "it & engineering", "it and engineering", "engineering"},
        "rh": {"dept_rh", "ressources humaines", "human resources", "hr"},
        "hr": {"dept_rh", "ressources humaines", "human resources", "hr"},
        "finance": {"dept_finance", "finance", "finance & comptabilité", "finance and comptabilité"},
    }
    accepted = aliases.get(needle, set()) | {needle}

    def normalized(value: Any) -> str:
        return " ".join(str(value or "").casefold().replace("&", "and").split())

    return [
        employee
        for employee in employees
        if normalized(employee.get("department_name")) in accepted
        or normalized(employee.get("department_id")) in accepted
        or normalized(employee.get("department")) in accepted
    ]


def get_leave_requests(status: Optional[str] = None) -> list[dict[str, Any]]:
    requests = _load_collection("leave_requests")
    if status:
        return [r for r in requests if r.get("status", "").upper() == status.upper()]
    return requests


def payroll_snapshot(department: Optional[str] = None, bonus_pct: float = 0.0) -> dict[str, Any]:
    employees = get_all_employees(department)
    rows = []
    total = 0.0
    for emp in employees:
        base = float(emp["salary"])
        bonus = round(base * (bonus_pct / 100.0), 2)
        gross = round(base + bonus, 2)
        total += gross
        rows.append(
            {
                "employee_id": emp["id"],
                "name": f"{emp['first_name']} {emp['last_name']}",
                "department": emp.get("department_name"),
                "position": emp.get("position"),
                "base_salary": base,
                "bonus": bonus,
                "gross": gross,
            }
        )
    return {
        "department": department or "all",
        "employee_count": len(rows),
        "bonus_pct": bonus_pct,
        "total_gross": round(total, 2),
        "rows": rows,
    }
