from fastapi.testclient import TestClient
from main import app
from app.core.security import create_access_token

client = TestClient(app)
HR_HEADERS = {"Authorization": f"Bearer {create_access_token({'id': 'test-hr', 'role': 'HR', 'employee_id': 'EMP-00100'})}"}
EMPLOYEE_HEADERS = {"Authorization": f"Bearer {create_access_token({'id': 'test-employee', 'role': 'EMPLOYEE', 'employee_id': 'EMP-00124'})}"}


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "online"


def test_get_employees():
    assert client.get("/api/employees").status_code == 401
    res = client.get("/api/employees", headers=HR_HEADERS)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_employee_cannot_list_all_employee_records():
    res = client.get("/api/employees", headers=EMPLOYEE_HEADERS)
    assert res.status_code == 403


def test_user_passwords_are_not_returned():
    res = client.get("/api/auth/users", headers=HR_HEADERS)
    assert res.status_code == 200
    assert all("password" not in user and "password_hash" not in user for user in res.json())


def test_chat_reply():
    res = client.post("/api/chat", json={"message": "Bonjour", "history": []})
    assert res.status_code == 401


def test_expired_token_is_rejected():
    import jwt
    from datetime import datetime, timedelta, timezone
    from app.core.config import ALGORITHM, JWT_SECRET

    token = jwt.encode(
        {"sub": "expired-user", "role": "HR", "iat": datetime.now(timezone.utc) - timedelta(hours=2),
         "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        JWT_SECRET,
        algorithm=ALGORITHM,
    )
    response = client.get("/api/employees", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "expiré" in response.json()["detail"].lower()


def test_authenticated_chat_fallback_explains_leave_scope(monkeypatch):
    from app.api.routes import hr as hr_routes

    monkeypatch.setattr(hr_routes, "OPENROUTER_API_KEY", "")
    monkeypatch.setattr(hr_routes, "HF_TOKEN", "")
    response = client.post(
        "/api/chat",
        headers=HR_HEADERS,
        json={"message": "Bonjour, quels types de congés sont proposés ?", "history": []},
    )
    assert response.status_code == 200
    assert response.json()["source"] == "local"
    assert "congé maladie" in response.json()["reply"].lower()
    assert "règlement rh officiel" in response.json()["reply"].lower()


def test_agentic_planning_and_preview_use_public_payroll_data():
    prompt = "Analyse les rémunérations publiques agrégées de la Ville de Norfolk et calcule le salaire annuel moyen pondéré"
    planned = client.post("/workflows/plan", headers=HR_HEADERS, json={"prompt": prompt})
    assert planned.status_code == 200
    body = planned.json()
    assert body["is_valid"] is True
    assert body["planner_source"] == "public_dataset_template"
    assert body["plan"]["steps"][0]["params"]["file_path"] == "data/norfolk_public_payroll_summary.csv"

    preview = client.post("/workflows/dry-run", headers=HR_HEADERS, json=body["plan"])
    assert preview.status_code == 200
    assert preview.json()["is_valid"] is True
    assert preview.json()["execution_order"] == ["step_1", "step_2"]


def test_agentic_planning_and_preview_enforce_hr_role():
    payload = {"prompt": "Analyse les salaires publics de Norfolk"}
    assert client.post("/workflows/plan", json=payload).status_code == 401
    assert client.post("/workflows/plan", headers=EMPLOYEE_HEADERS, json=payload).status_code == 403


def test_mcp_catalogue_discovers_tools_over_stdio():
    response = client.get("/mcp/tools", headers=HR_HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert body["tool_count"] >= 8
    names = {tool["name"] for tool in body["tools"]}
    assert {"read_data_file", "compute_statistics", "read_employee_records"} <= names


def test_local_planner_fallback_is_valid_without_provider():
    from agentic.services.planner import generate_plan_from_prompt

    result = generate_plan_from_prompt(
        "Analyse demo.csv et calcule la moyenne de la colonne montant",
        force_local=True,
    )
    assert result["is_valid"] is True
    assert result["planner_source"] == "mock_semantic_planner"
    assert result["execution_order"]


def test_invalid_structured_llm_plan_uses_validated_local_fallback(monkeypatch):
    import langchain_openai
    from agentic.models.workflow import WorkflowPlan, WorkflowStep
    from agentic.services.planner import generate_plan_from_prompt

    class IncompleteStructuredModel:
        def __init__(self, **kwargs):
            pass

        def with_structured_output(self, schema):
            return self

        def invoke(self, messages):
            return WorkflowPlan(
                name="Plan incomplet",
                steps=[WorkflowStep(id="load", type="load_data", name="Lire CSV", params={})],
            )

    monkeypatch.setattr(langchain_openai, "ChatOpenAI", IncompleteStructuredModel)
    monkeypatch.setenv("OPENAI_API_KEY", "")
    monkeypatch.setenv("OPENROUTER_API_KEY", "synthetic-test-key")
    monkeypatch.setenv("OPENROUTER_MODEL", "openrouter/free")
    monkeypatch.setenv("MOCK_LLM", "false")

    result = generate_plan_from_prompt("Analyse demo.csv et calcule la moyenne de la colonne montant")
    assert result["planner_source"] == "mock_semantic_planner_after_invalid_llm"
    assert result["is_valid"] is True
    assert result["plan"]["steps"][0]["params"]["file_path"].endswith("demo.csv")
    assert any("validation métier" in warning for warning in result["warnings"])
