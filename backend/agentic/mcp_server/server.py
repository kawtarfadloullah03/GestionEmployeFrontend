"""
MCP Server — Étape 4 : Serveur Model Context Protocol (FastMCP)
Expose les outils standardisés de données et d'actions pour le moteur de workflow.

Chaque outil expose :
- Son nom, sa description et son schéma de paramètres.
- La prise en compte explicite du paramètre `dry_run` pour simuler sans effets de bord.
"""

import time
import csv
import json
import os
import math
import statistics
import smtplib
from email.message import EmailMessage
from app.core.config import SMTP_ALLOWED_RECIPIENTS
from pathlib import Path
from typing import Any, Optional
from mcp.server.fastmcp import FastMCP

# Initialisation du serveur MCP
mcp = FastMCP("WorkflowDataToolsServer")


def _data_file_path(file_path: str) -> Path:
    data_root = (Path(__file__).resolve().parents[2] / "data").resolve()
    requested = Path(file_path)
    if requested.is_absolute() or ".." in requested.parts:
        raise ValueError("Le chemin doit désigner un fichier du dossier data/.")
    relative = Path(*requested.parts[1:]) if requested.parts and requested.parts[0] == "data" else requested
    target = (data_root / relative).resolve()
    if not target.is_relative_to(data_root) or target.suffix.lower() not in {".csv", ".json"}:
        raise ValueError("Formats autorisés : CSV et JSON dans le dossier data/.")
    return target


def _number(value: Any) -> float | None:
    try:
        number = float(str(value).replace(",", "."))
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


@mcp.tool(
    name="read_data_file",
    description="Charge et inspecte un fichier de données (CSV, JSON, etc.). Retourne les colonnes, un échantillon et le nombre de lignes."
)
def read_data_file(file_path: str, delimiter: str = ",") -> dict[str, Any]:
    """Lit un fichier CSV/JSON dans backend/data, sans modifier le fichier."""
    t = time.time()
    try:
        target = _data_file_path(file_path)
        if not target.is_file() or target.stat().st_size > 20 * 1024 * 1024:
            raise ValueError("Fichier absent ou supérieur à 20 Mo.")
        if target.suffix.lower() == ".csv":
            if len(delimiter) != 1:
                raise ValueError("Le délimiteur CSV doit être un caractère.")
            with target.open("r", newline="", encoding="utf-8-sig") as source:
                rows_data = list(csv.DictReader(source, delimiter=delimiter))
        else:
            loaded = json.loads(target.read_text(encoding="utf-8"))
            rows_data = loaded if isinstance(loaded, list) else loaded.get("rows", [])
        if len(rows_data) > 100_000 or any(not isinstance(row, dict) for row in rows_data):
            raise ValueError("Le fichier doit contenir au plus 100 000 lignes objet.")
        cols = list(rows_data[0].keys()) if rows_data else []
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as exc:
        return {"status": "error", "error": str(exc), "duration_ms": int((time.time() - t) * 1000)}
    return {
        "status": "success",
        "file_path": str(target),
        "delimiter": delimiter,
        "rows": len(rows_data),
        "columns": cols,
        "sample": rows_data[:3],
        "data": rows_data,
        "dataframe_id": f"df_{abs(hash(file_path)) % 10000}",
        "duration_ms": int((time.time() - t) * 1000)
    }


@mcp.tool(
    name="transform_data",
    description="Nettoie ou transforme les données (filtrage, suppression de colonnes, renommage, normalisation)."
)
def transform_data(operation: str, data: Optional[list[dict[str, Any]]] = None, params: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    """Applique des transformations explicites aux données reçues."""
    t = time.time()
    params = params or {}
    rows_data = [dict(row) for row in (data or [])]
    rows_in = len(rows_data)
    column = params.get("column")
    if operation == "filter":
        operator, expected = params.get("operator", "eq"), params.get("value")
        if not column or operator not in {"eq", "ne", "gt", "gte", "lt", "lte", "contains"}:
            return {"status": "error", "error": "filter requiert column et un opérateur autorisé."}
        def matches(row):
            actual = row.get(column)
            left, right = _number(actual), _number(expected)
            if operator == "contains":
                return str(expected).casefold() in str(actual or "").casefold()
            if left is not None and right is not None:
                return {"eq": left == right, "ne": left != right, "gt": left > right, "gte": left >= right, "lt": left < right, "lte": left <= right}[operator]
            if operator == "eq": return str(actual).casefold() == str(expected).casefold()
            if operator == "ne": return str(actual).casefold() != str(expected).casefold()
            return False
        rows_data = [row for row in rows_data if matches(row)]
    elif operation == "drop_column":
        if not column: return {"status": "error", "error": "drop_column requiert column."}
        rows_data = [{key: value for key, value in row.items() if key != column} for row in rows_data]
    elif operation == "rename":
        new_name = params.get("new_name")
        if not column or not new_name: return {"status": "error", "error": "rename requiert column et new_name."}
        rows_data = [{(new_name if key == column else key): value for key, value in row.items()} for row in rows_data]
    elif operation == "fill_na":
        rows_data = [{key: (params.get("value", "") if value in (None, "") else value) for key, value in row.items()} for row in rows_data]
    elif operation == "normalize":
        if not column: return {"status": "error", "error": "normalize requiert column."}
        numeric = [_number(row.get(column)) for row in rows_data]
        values = [value for value in numeric if value is not None]
        if not values: return {"status": "error", "error": f"Aucune valeur numérique dans {column}."}
        low, high = min(values), max(values)
        rows_data = [dict(row, **{column: 0.0 if high == low else round((_number(row[column]) - low) / (high - low), 6)}) if _number(row.get(column)) is not None else row for row in rows_data]
    else:
        return {"status": "error", "error": f"Transformation non supportée : {operation}."}
    return {"status": "success", "operation": operation, "description": f"{operation} appliquée sur {rows_in} lignes.", "rows_in": rows_in, "rows_out": len(rows_data), "data": rows_data, "duration_ms": int((time.time() - t) * 1000)}


@mcp.tool(
    name="compute_statistics",
    description="Calcule des agrégations et métriques statistiques (moyenne, somme, max, min, écart-type)."
)
def compute_statistics(column: str, operation: str, data: Optional[list[dict[str, Any]]] = None, weight_column: str = "") -> dict[str, Any]:
    """Calcule les statistiques à partir des lignes fournies par l'étape précédente."""
    t = time.time()
    supported = {"mean", "weighted_mean", "sum", "max", "min", "std", "count", "describe"}
    if operation not in supported:
        return {"status": "error", "error": f"Opération statistique non supportée : {operation}."}
    if operation == "weighted_mean":
        pairs = [(_number(row.get(column)), _number(row.get(weight_column))) for row in (data or [])]
        pairs = [(value, weight) for value, weight in pairs if value is not None and weight is not None and weight > 0]
        if not pairs:
            return {"status": "error", "error": f"Aucune paire valeur/poids valide pour '{column}'/'{weight_column}'."}
        result = round(sum(value * weight for value, weight in pairs) / sum(weight for _, weight in pairs), 4)
        return {"status": "success", "column": column, "operation": operation, "result": result, "row_count": sum(weight for _, weight in pairs), "group_count": len(pairs), "weight_column": weight_column, "data": data or [], "unit": "USD" if column.endswith("_usd") else None, "duration_ms": int((time.time() - t) * 1000)}
    values = [_number(row.get(column)) for row in (data or [])]
    values = [value for value in values if value is not None]
    if not values:
        return {"status": "error", "error": f"Aucune valeur numérique valide pour la colonne '{column}'."}
    result = {
        "mean": lambda: round(statistics.mean(values), 4),
        "sum": lambda: round(sum(values), 4),
        "max": lambda: max(values),
        "min": lambda: min(values),
        "std": lambda: round(statistics.pstdev(values), 4),
        "count": lambda: len(values),
        "describe": lambda: {"count": len(values), "sum": round(sum(values), 4), "mean": round(statistics.mean(values), 4), "min": min(values), "max": max(values), "std": round(statistics.pstdev(values), 4)},
    }[operation]()
    return {"status": "success", "column": column, "operation": operation, "result": result, "row_count": len(values), "data": data or [], "unit": "EUR" if "vente" in column.lower() or "ca" in column.lower() else None, "duration_ms": int((time.time() - t) * 1000)}


@mcp.tool(
    name="export_data",
    description="Sauvegarde les résultats vers un fichier de destination. Supporte le mode dry_run sans effet de bord."
)
def export_data(destination: str, format: str = "csv", dry_run: bool = False, data: Optional[list[dict[str, Any]]] = None) -> dict[str, Any]:
    """Exporte les données vers un fichier ou simule l'écriture si dry_run=True."""
    t = time.time()
    rows_data = data or []
    if dry_run:
        # En mode dry-run, aucune écriture disque n'est effectuée !
        return {
            "status": "simulated",
            "dry_run": True,
            "destination": destination,
            "format": format,
            "action": f"Simulation d'écriture vers '{destination}' (aucun octet écrit)",
            "safe": False,
            "bytes_written": 0,
            "row_count": len(rows_data),
            "duration_ms": int((time.time() - t) * 1000)
        }

    relative_path = Path(destination)
    output_root = (Path(__file__).resolve().parents[2] / "output").resolve()
    target = (Path(__file__).resolve().parents[2] / relative_path).resolve()
    if relative_path.is_absolute() or ".." in relative_path.parts or not relative_path.parts or relative_path.parts[0] != "output" or not target.is_relative_to(output_root):
        return {"status": "error", "error": "La destination doit rester dans output/.", "bytes_written": 0}
    if format not in {"csv", "json"}:
        return {"status": "error", "error": "Formats autorisés : csv ou json.", "bytes_written": 0}
    target.parent.mkdir(parents=True, exist_ok=True)
    if format == "json":
        payload = json.dumps(rows_data, ensure_ascii=False, indent=2).encode("utf-8")
        target.write_bytes(payload)
    else:
        fields = list(dict.fromkeys(key for row in rows_data for key in row.keys()))
        with target.open("w", newline="", encoding="utf-8-sig") as output_file:
            if fields:
                writer = csv.DictWriter(output_file, fieldnames=fields, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(rows_data)
        payload = target.read_bytes()
    return {
        "status": "success",
        "dry_run": False,
        "destination": str(target),
        "format": format,
        "action": f"Fichier écrit avec succès vers '{target}'",
        "bytes_written": len(payload),
        "row_count": len(rows_data),
        "duration_ms": int((time.time() - t) * 1000)
    }


def _send_email(message: str, recipient: str, subject: str, dry_run: bool) -> dict[str, Any]:
    if dry_run:
        return {"status": "simulated", "dry_run": True, "sent": False, "bytes_written": 0}
    recipient = recipient or os.getenv("HR_NOTIFICATION_TO", "")
    host = os.getenv("SMTP_HOST", "")
    sender = os.getenv("SMTP_FROM", "")
    if not host or not sender or not recipient:
        return {
            "status": "skipped",
            "sent": False,
            "reason": "SMTP_HOST, SMTP_FROM et un destinataire (ou HR_NOTIFICATION_TO) sont requis.",
        }
    if recipient.strip().casefold() not in SMTP_ALLOWED_RECIPIENTS:
        return {"status": "blocked", "sent": False, "reason": "Destinataire absent de la liste SMTP autorisée."}
    email = EmailMessage()
    email["From"] = sender
    email["To"] = recipient
    email["Subject"] = subject
    email.set_content(message)
    port = int(os.getenv("SMTP_PORT", "587"))
    timeout = float(os.getenv("SMTP_TIMEOUT_SECONDS", "10"))
    use_starttls = os.getenv("SMTP_STARTTLS", "true").lower() in {"1", "true", "yes"}
    with smtplib.SMTP(host, port, timeout=timeout) as smtp:
        smtp.ehlo()
        if use_starttls:
            smtp.starttls()
            smtp.ehlo()
        username = os.getenv("SMTP_USERNAME", "")
        password = os.getenv("SMTP_PASSWORD", "")
        if username:
            smtp.login(username, password)
        smtp.send_message(email)
    return {"status": "success", "sent": True, "recipient": recipient}


@mcp.tool(
    name="send_notification",
    description="Envoie un email via SMTP configuré. En dry-run, aucun email n'est envoyé."
)
def send_notification(message: str, channel: str = "email", dry_run: bool = False, recipient: str = "", subject: str = "Notification workflow") -> dict[str, Any]:
    """Transmet une alerte ou simule l'envoi si dry_run=True."""
    t = time.time()
    if dry_run:
        return {
            "status": "simulated",
            "dry_run": True,
            "channel": channel,
            "message": message,
            "action": f"Simulation d'envoi de notification sur [{channel}] : '{message}' (aucun message envoyé)",
            "safe": False,
            "sent": False,
            "duration_ms": int((time.time() - t) * 1000)
        }

    if channel.lower() != "email":
        return {"status": "skipped", "sent": False, "reason": f"Canal non configuré : {channel}.", "duration_ms": int((time.time() - t) * 1000)}
    result = _send_email(message, recipient, subject, dry_run=False)
    result.update({"dry_run": False, "channel": channel, "message": message, "duration_ms": int((time.time() - t) * 1000)})
    return result


@mcp.tool(
    name="read_employee_records",
    description="Charge les fiches employés RH (département, poste, salaire, solde de congés)."
)
def read_employee_records(department: str = "", source: str = "employees") -> dict[str, Any]:
    from agentic.services.employee_service import get_all_employees

    t = time.time()
    employees = get_all_employees(department or None)
    columns = ["id", "first_name", "last_name", "department_name", "position", "salary", "leave_balance"]
    sample = [
        {
            "id": e["id"],
            "name": f"{e['first_name']} {e['last_name']}",
            "department": e.get("department_name"),
            "position": e.get("position"),
            "salary": e.get("salary"),
            "leave_balance": e.get("leave_balance"),
        }
        for e in employees[:5]
    ]
    return {
        "status": "success",
        "source": source,
        "department": department or "all",
        "rows": len(employees),
        "columns": columns,
        "sample": sample,
        "employees": employees,
        "duration_ms": int((time.time() - t) * 1000),
    }


@mcp.tool(
    name="compute_salary_statistics",
    description="Calcule moyenne, somme, min ou max des salaires employés, avec prime optionnelle."
)
def compute_salary_statistics(
    department: str = "",
    operation: str = "mean",
    bonus_pct: float = 0.0,
    column: str = "salary",
) -> dict[str, Any]:
    from agentic.services.employee_service import payroll_snapshot

    t = time.time()
    if not math.isfinite(bonus_pct) or bonus_pct < 0 or bonus_pct > 100:
        return {"status": "error", "error": "bonus_pct doit être compris entre 0 et 100.", "duration_ms": int((time.time() - t) * 1000)}
    if operation not in {"mean", "sum", "min", "max", "count", "std", "describe"}:
        return {"status": "error", "error": f"Opération statistique non prise en charge : {operation}.", "duration_ms": int((time.time() - t) * 1000)}
    snap = payroll_snapshot(department or None, bonus_pct=bonus_pct)
    values = [row["gross"] for row in snap["rows"]]
    if not values:
        result = 0.0
    elif operation == "sum":
        result = round(sum(values), 2)
    elif operation == "min":
        result = round(min(values), 2)
    elif operation == "max":
        result = round(max(values), 2)
    elif operation == "count":
        result = len(values)
    elif operation == "std":
        result = round(statistics.pstdev(values), 2) if values else 0.0
    elif operation == "describe":
        result = {
            "count": len(values),
            "sum": round(sum(values), 2),
            "mean": round(statistics.mean(values), 2) if values else 0.0,
            "min": round(min(values), 2) if values else 0.0,
            "max": round(max(values), 2) if values else 0.0,
            "std": round(statistics.pstdev(values), 2) if values else 0.0,
        }
    else:
        result = round(sum(values) / len(values), 2)
    return {
        "status": "success",
        "column": column,
        "operation": operation,
        "department": snap["department"],
        "employee_count": snap["employee_count"],
        "bonus_pct": bonus_pct,
        "result": result,
        "unit": "EUR",
        "rows": snap["rows"],
        "duration_ms": int((time.time() - t) * 1000),
    }


@mcp.tool(
    name="export_payroll_report",
    description="Exporte un rapport de paie. Avec dry_run=True, aucun fichier n'est écrit."
)
def export_payroll_report(
    destination: str,
    format: str = "csv",
    rows: Optional[list[dict[str, Any]]] = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    t = time.time()
    rows = rows or []
    if dry_run:
        return {
            "status": "simulated",
            "dry_run": True,
            "destination": destination,
            "format": format,
            "action": f"Simulation d'export paie vers '{destination}' (aucun octet écrit)",
            "safe": False,
            "bytes_written": 0,
            "row_count": len(rows),
            "duration_ms": int((time.time() - t) * 1000),
        }

    relative_path = Path(destination)
    output_root = (Path(__file__).resolve().parents[2] / "output").resolve()
    target = (Path(__file__).resolve().parents[2] / relative_path).resolve()
    if relative_path.is_absolute() or ".." in relative_path.parts or not relative_path.parts or relative_path.parts[0] != "output":
        return {"status": "error", "error": "La destination doit rester dans le dossier output/.", "bytes_written": 0}
    if not target.is_relative_to(output_root):
        return {"status": "error", "error": "Destination hors du dossier output/ refusée.", "bytes_written": 0}
    if format not in {"csv", "json"}:
        return {"status": "error", "error": "Formats autorisés : csv ou json.", "bytes_written": 0}

    target.parent.mkdir(parents=True, exist_ok=True)
    if format == "json":
        payload = json.dumps(rows, ensure_ascii=False, indent=2).encode("utf-8")
        target.write_bytes(payload)
    else:
        fields = list(dict.fromkeys(key for row in rows for key in row.keys()))
        with target.open("w", newline="", encoding="utf-8-sig") as output_file:
            if fields:
                writer = csv.DictWriter(output_file, fieldnames=fields, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(rows)
        payload = target.read_bytes()
    return {
        "status": "success",
        "dry_run": False,
        "destination": str(target),
        "format": format,
        "action": f"Rapport de démonstration écrit vers '{target}'",
        "bytes_written": len(payload),
        "row_count": len(rows),
        "duration_ms": int((time.time() - t) * 1000),
    }


@mcp.tool(
    name="send_hr_notification",
    description="Envoie une notification RH (email manager/direction). Avec dry_run=True, aucun message n'est émis."
)
def send_hr_notification(message: str, channel: str = "email", dry_run: bool = False, recipient: str = "", subject: str = "Notification RH") -> dict[str, Any]:
    t = time.time()
    if dry_run:
        return {
            "status": "simulated",
            "dry_run": True,
            "channel": channel,
            "message": message,
            "action": f"Simulation d'alerte RH sur [{channel}] (aucun message envoyé)",
            "safe": False,
            "sent": False,
            "duration_ms": int((time.time() - t) * 1000),
        }
    if channel.lower() != "email":
        return {"status": "skipped", "sent": False, "reason": f"Canal non configuré : {channel}.", "duration_ms": int((time.time() - t) * 1000)}
    result = _send_email(message, recipient, subject, dry_run=False)
    result.update({"dry_run": False, "channel": channel, "message": message, "duration_ms": int((time.time() - t) * 1000)})
    return result


def get_mcp_instance() -> FastMCP:
    """Retourne l'instance configurée du serveur FastMCP."""
    return mcp


if __name__ == "__main__":
    mcp.run(transport="stdio")
