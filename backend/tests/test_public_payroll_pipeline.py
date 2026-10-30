from pathlib import Path

from agentic.engine.graph import execute_plan
from agentic.models.workflow import WorkflowPlan
from agentic.services.planner import generate_plan_from_prompt
from agentic.services.rag_engine import RAGAssistant
from agentic.mcp_client.client import get_mcp_client
from agentic.mcp_server.server import compute_statistics


def test_public_payroll_prompt_creates_public_dataset_plan():
    response = generate_plan_from_prompt(
        "Analyse les rémunérations publiques agrégées de la Ville de Norfolk et calcule le salaire annuel moyen pondéré par le nombre d’employés"
    )
    assert response["is_valid"] is True
    assert response["planner_source"] == "public_dataset_template"
    steps = response["plan"]["steps"]
    assert steps[0]["params"]["file_path"] == "data/norfolk_public_payroll_summary.csv"
    assert steps[0]["params"]["domain"] == "public_payroll"
    assert steps[1]["params"]["operation"] == "weighted_mean"
    assert response["execution_order"] == ["step_1", "step_2"]


def test_weighted_mean_uses_group_population_weights():
    result = compute_statistics(
        column="mean_salary_usd",
        operation="weighted_mean",
        weight_column="employee_count",
        data=[
            {"mean_salary_usd": 100, "employee_count": 1},
            {"mean_salary_usd": 200, "employee_count": 3},
        ],
    )
    assert result["status"] == "success"
    assert result["result"] == 175
    assert result["row_count"] == 4


def test_public_payroll_workflow_runs_through_langgraph_and_mcp():
    response = generate_plan_from_prompt(
        "Analyse les rémunérations publiques agrégées de la Ville de Norfolk et calcule le salaire annuel moyen pondéré"
    )
    result = execute_plan(WorkflowPlan.model_validate(response["plan"]))
    assert result["status"] == "done", result["error_log"]
    load_output = result["results"]["step_1"]["output"]
    analyze_output = result["results"]["step_2"]["output"]
    assert load_output["status"] == "success"
    assert load_output["rows"] > 100
    assert analyze_output["status"] == "success"
    assert analyze_output["operation"] == "weighted_mean"
    assert analyze_output["result"] > 0
    assert analyze_output["unit"] == "USD"


def test_rag_indexes_public_compensation_documents_without_invented_hr_rules(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    assistant = RAGAssistant()
    ids = {document["id"] for document in assistant.default_docs}
    assert "doc_norfolk_compensation_plan_fy2027" in ids
    assert "doc_norfolk_payroll_data_dictionary" in ids
    assert "doc_hr_convention" not in ids
    assert "doc_hr_payroll" not in ids
    result = assistant.query("Norfolk compensation plan salary grade minimum maximum")
    assert result["retrieved_context"]
    assert any("norfolk_compensation_plan_fy2027.pdf" in source["source"] for source in result["retrieved_context"])
    leave_answer = assistant.query("Combien de jours de congés payés ai-je droit ?")
    assert "25 jours" not in leave_answer["answer"]
    assert "Aucune règle" in leave_answer["answer"] or "aucune règle" in leave_answer["answer"]


def test_mcp_dry_run_does_not_write_or_send():
    client = get_mcp_client()
    destination = "output/dry_run_must_not_exist.csv"
    output_path = Path(__file__).resolve().parents[1] / destination
    if output_path.exists():
        output_path.unlink()
    export_result = client.call_tool(
        "export_data", {"destination": destination, "format": "csv", "data": [{"value": 1}]}, dry_run=True
    )["output"]
    notification_result = client.call_tool(
        "send_notification", {"message": "Test simulation", "channel": "email"}, dry_run=True
    )["output"]
    assert export_result["status"] == "simulated"
    assert export_result["bytes_written"] == 0
    assert not output_path.exists()
    assert notification_result["status"] == "simulated"
    assert notification_result["sent"] is False
