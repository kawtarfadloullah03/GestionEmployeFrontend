"""
Tool Dispatcher & MCP Integration — Étape 4
Connecte les étapes de workflow exécutées par LangGraph au protocole MCP.

Chaque type d'étape est mappé à un outil du serveur MCP :
  • load_data  -> read_data_file
  • transform  -> transform_data
  • analyze    -> compute_statistics
  • export     -> export_data (avec simulation dry_run si activé)
  • notify     -> send_notification (avec simulation dry_run si activé)
"""

from typing import Any
from agentic.mcp_client.client import get_mcp_client


def _get_upstream_output(step: dict, results: dict[str, Any]) -> dict[str, Any]:
    """Récupère l'output de la première étape prérequise pour le chaînage."""
    for dep_id in step.get("depends_on", []):
        dep = results.get(dep_id)
        if dep and dep.get("status") == "done":
            return dep.get("output", {})
    return {}


def _is_hr_step(params: dict[str, Any]) -> bool:
    if params.get("domain") == "public_payroll" or params.get("source") == "public_dataset":
        return False
    haystack = " ".join(
        str(params.get(k, ""))
        for k in ("source", "file_path", "destination", "domain", "department")
    ).lower()
    return any(
        token in haystack
        for token in ("employee", "employe", "hr", "paie", "payroll", "salaire", "conge")
    ) or params.get("domain") == "hr"


def dispatch_mcp(step: dict, results: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
    """
    Exécute l'action d'une étape en interrogeant le serveur MCP via le client MCP.
    """
    client = get_mcp_client()
    step_type = step.get("type", "")
    params = step.get("params", {})
    upstream = _get_upstream_output(step, results)
    hr_mode = _is_hr_step(params) or _is_hr_step(upstream)

    # 1. load_data -> read_data_file ou read_employee_records
    if step_type == "load_data":
        if params.get("domain") == "public_payroll":
            mcp_res = client.call_tool("read_data_file", {"file_path": params.get("file_path", "data/norfolk_public_payroll_summary.csv"), "delimiter": params.get("delimiter", ",")})
        elif hr_mode:
            mcp_res = client.call_tool(
                "read_employee_records",
                {
                    "department": params.get("department", ""),
                    "source": params.get("source", "employees"),
                },
            )
        else:
            file_path = params.get("file_path", "data.csv")
            delimiter = params.get("delimiter", ",")
            mcp_res = client.call_tool("read_data_file", {"file_path": file_path, "delimiter": delimiter})

    # 2. transform -> transform_data
    elif step_type == "transform":
        operation = params.get("operation", "filter")
        rows_in = upstream.get("rows", 100)
        mcp_res = client.call_tool("transform_data", {
            "operation": operation,
            "data": upstream.get("data", []),
            "params": params
        })

    # 3. analyze -> compute_statistics ou compute_salary_statistics
    elif step_type == "analyze":
        if params.get("domain") == "public_payroll":
            mcp_res = client.call_tool("compute_statistics", {"column": params.get("column", "mean_salary_usd"), "operation": params.get("operation", "weighted_mean"), "weight_column": params.get("weight_column", "employee_count"), "data": upstream.get("data", [])})
        elif hr_mode or params.get("column") in ("salary", "salaire", "paie"):
            mcp_res = client.call_tool(
                "compute_salary_statistics",
                {
                    "department": params.get("department", ""),
                    "operation": params.get("operation", "mean"),
                    "bonus_pct": float(params.get("bonus_pct", 0) or 0),
                    "column": params.get("column", "salary"),
                },
            )
        else:
            column = params.get("column", "ventes")
            operation = params.get("operation", "mean")
            mcp_res = client.call_tool("compute_statistics", {
                "column": column,
                "operation": operation,
                "data": upstream.get("data", []),
            })

    # 4. export -> export_data / export_payroll_report (avec dry_run)
    elif step_type == "export":
        destination = params.get("destination", "output/result.csv")
        fmt = params.get("format", "csv")
        tool_name = "export_payroll_report" if hr_mode else "export_data"
        export_args = {
            "destination": destination,
            "format": fmt,
            "data": upstream.get("rows", []) if hr_mode else upstream.get("data", []),
            "dry_run": dry_run
        }
        mcp_res = client.call_tool(tool_name, export_args, dry_run=dry_run)

    # 5. notify -> send_notification / send_hr_notification (avec dry_run)
    elif step_type == "notify":
        message = params.get("message", "Workflow terminé")
        channel = params.get("channel", "email")
        tool_name = "send_hr_notification" if hr_mode else "send_notification"
        mcp_res = client.call_tool(tool_name, {
            "message": message,
            "channel": channel,
            "recipient": params.get("recipient", ""),
            "subject": params.get("subject", "Notification RH" if hr_mode else "Notification workflow"),
            "dry_run": dry_run
        }, dry_run=dry_run)

    else:
        return {
            "output": {},
            "error": f"Type d'étape non supporté par le protocole MCP : '{step_type}'",
            "duration_ms": 0
        }

    output = mcp_res.get("output", {})
    tool_error = mcp_res.get("error", "")
    if not tool_error and isinstance(output, dict) and output.get("status") == "error":
        tool_error = output.get("error", "Erreur retournée par l'outil MCP")
    if not tool_error and step_type == "notify" and isinstance(output, dict):
        if output.get("status") != "success" or output.get("sent") is not True:
            tool_error = output.get("reason", "La notification n'a pas été envoyée.")

    return {
        "output": output,
        "error": tool_error,
        "duration_ms": mcp_res.get("duration_ms", 0),
        "mcp_protocol": True
    }


# Alias pour rétrocompatibilité avec les étapes précédentes
def dispatch(step: dict, results: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
    return dispatch_mcp(step, results, dry_run=dry_run)
