"""Routes FastAPI du moteur M2 : validation, dry-run, LangGraph, MCP, RAG, persistance."""

import asyncio
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from agentic.models.workflow import WorkflowPlan, DryRunResult
from agentic.services.validator import validate_plan
from agentic.services.dry_run import run_dry_run
from agentic.services.planner import generate_plan_from_prompt
from agentic.services.rag_engine import get_rag_assistant
from agentic.engine.graph import execute_plan
from agentic.database.connection import get_db
from agentic.database import repository
from agentic.mcp_client.client import get_mcp_client
from agentic.auth import current_principal, require_roles

router = APIRouter(dependencies=[Depends(current_principal)])


class PromptPlanRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)
    model: Optional[str] = Field("gpt-4o-mini")


class RAGQueryRequest(BaseModel):
    question: str = Field(..., min_length=3)
    top_k: Optional[int] = Field(3, ge=1, le=10)


class RAGIngestRequest(BaseModel):
    doc_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=10)
    source: Optional[str] = Field("api_upload")


class ExecuteRunRequest(BaseModel):
    plan: WorkflowPlan
    idempotency_key: Optional[str] = None
    parameters: Optional[dict[str, Any]] = Field(default_factory=dict)


class ReplayRunRequest(BaseModel):
    parameters: Optional[dict[str, Any]] = Field(default_factory=dict)


@router.get("/mcp/tools", tags=["mcp"], dependencies=[Depends(require_roles("HR"))])
async def list_mcp_tools():
    client = get_mcp_client()
    try:
        tools = await asyncio.wait_for(client.alist_tools(), timeout=30)
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=504, detail="Le serveur MCP n'a pas répondu dans le délai imparti.") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "protocol": "Model Context Protocol (MCP)",
        "server": "WorkflowDataToolsServer",
        "tool_count": len(tools),
        "tools": tools,
    }


@router.get("/workflows/schema", tags=["schema"], dependencies=[Depends(require_roles("HR"))])
def get_workflow_schema():
    return WorkflowPlan.model_json_schema()


@router.post("/workflows/validate", tags=["workflows"], dependencies=[Depends(require_roles("HR"))])
def validate_workflow(plan: WorkflowPlan):
    is_valid, errors, warnings, execution_order = validate_plan(plan)
    return {
        "plan_name": plan.name,
        "plan_version": plan.version,
        "is_valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "execution_order": execution_order,
        "step_count": len(plan.steps),
    }


@router.post("/workflows/dry-run", tags=["workflows"], response_model=DryRunResult, dependencies=[Depends(require_roles("HR"))])
def dry_run_workflow(plan: WorkflowPlan):
    is_valid, errors, warnings, execution_order = validate_plan(plan)
    if not is_valid:
        return DryRunResult(
            plan_name=plan.name,
            plan_version=plan.version,
            is_valid=False,
            errors=errors,
            warnings=warnings,
        )
    steps_preview = run_dry_run(plan.steps, execution_order)
    return DryRunResult(
        plan_name=plan.name,
        plan_version=plan.version,
        is_valid=True,
        errors=[],
        warnings=warnings,
        steps_preview=steps_preview,
        execution_order=execution_order,
    )


@router.post("/workflows/plan", tags=["workflows"], dependencies=[Depends(require_roles("HR"))])
async def plan_workflow(req: PromptPlanRequest):
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(generate_plan_from_prompt, prompt=req.prompt, model_name=req.model),
            timeout=18,
        )
    except asyncio.TimeoutError:
        fallback = await asyncio.to_thread(
            generate_plan_from_prompt, prompt=req.prompt, model_name=req.model, force_local=True
        )
        fallback["planner_source"] = "mock_semantic_planner_timeout_fallback"
        fallback["warnings"] = [*fallback.get("warnings", []), "Le fournisseur LLM a dépassé le délai ; planification locale utilisée."]
        return fallback


@router.post("/rag/query", tags=["rag"])
def query_rag_assistant(req: RAGQueryRequest):
    return get_rag_assistant().query(question=req.question, top_k=req.top_k)


@router.post("/rag/ingest", tags=["rag"], dependencies=[Depends(require_roles("HR"))])
def ingest_document_rag(req: RAGIngestRequest):
    get_rag_assistant().ingest_document(req.doc_id, req.title, req.content, req.source)
    return {"status": "ingested", "doc_id": req.doc_id, "title": req.title}


@router.get("/rag/documents", tags=["rag"], dependencies=[Depends(require_roles("HR"))])
def list_rag_documents():
    assistant = get_rag_assistant()
    return {
        "total_chunks": len(assistant.vector_store.chunks),
        "chunks": [c.to_dict() for c in assistant.vector_store.chunks],
    }


@router.post("/workflows/execute", tags=["workflows"], dependencies=[Depends(require_roles("HR"))])
def execute_workflow(plan: WorkflowPlan):
    return execute_plan(plan)


@router.post("/workflows/save", tags=["persistence"], dependencies=[Depends(require_roles("HR"))])
def save_workflow_plan(plan: WorkflowPlan, db: Session = Depends(get_db)):
    db_plan = repository.save_or_version_plan(db, plan)
    return {
        "status": "saved",
        "id": db_plan.id,
        "name": db_plan.name,
        "version": db_plan.version,
        "step_count": len(db_plan.steps_json),
        "created_at": db_plan.created_at.isoformat(),
    }


@router.get("/workflows/{name}/versions", tags=["persistence"], dependencies=[Depends(require_roles("HR"))])
def get_workflow_versions(name: str, db: Session = Depends(get_db)):
    versions = repository.list_versions(db, name)
    if not versions:
        raise HTTPException(status_code=404, detail=f"Aucun workflow trouvé avec le nom '{name}'")
    return {"name": name, "total_versions": len(versions), "versions": versions}


@router.post("/workflows/runs", tags=["persistence"], dependencies=[Depends(require_roles("HR"))])
def run_and_persist_workflow(req: ExecuteRunRequest, db: Session = Depends(get_db)):
    run_record, was_executed = repository.execute_and_persist_run(
        db=db,
        plan=req.plan,
        idempotency_key=req.idempotency_key,
        parameters=req.parameters,
    )
    return {
        "run_id": run_record.id,
        "plan_name": run_record.plan_name,
        "plan_version": run_record.plan_version,
        "status": run_record.status,
        "was_executed": was_executed,
        "idempotency_triggered": not was_executed,
        "idempotency_key": run_record.idempotency_key,
        "is_replay": run_record.is_replay,
        "results": run_record.results,
        "execution_order": run_record.execution_order,
        "error_log": run_record.error_log,
        "created_at": run_record.created_at.isoformat(),
        "completed_at": run_record.completed_at.isoformat() if run_record.completed_at else None,
    }


@router.get("/workflows/runs", tags=["persistence"], dependencies=[Depends(require_roles("HR"))])
def get_all_runs(limit: int = 50, db: Session = Depends(get_db)):
    return {"runs": repository.list_runs(db, limit=limit)}


@router.get("/workflows/runs/{run_id}", tags=["persistence"], dependencies=[Depends(require_roles("HR"))])
def get_run_details(run_id: str, db: Session = Depends(get_db)):
    run = db.query(repository.WorkflowRunModel).filter(repository.WorkflowRunModel.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Exécution introuvable avec l'ID '{run_id}'")
    return {
        "run_id": run.id,
        "plan_name": run.plan_name,
        "plan_version": run.plan_version,
        "status": run.status,
        "idempotency_key": run.idempotency_key,
        "is_replay": run.is_replay,
        "replayed_from": run.replayed_from_run_id,
        "parameters": run.parameters,
        "results": run.results,
        "execution_order": run.execution_order,
        "error_log": run.error_log,
        "created_at": run.created_at.isoformat(),
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
    }


@router.post("/workflows/runs/{run_id}/replay", tags=["persistence"], dependencies=[Depends(require_roles("HR"))])
def replay_workflow_run(run_id: str, req: ReplayRunRequest = None, db: Session = Depends(get_db)):
    override_params = req.parameters if req else None
    new_run, err = repository.replay_run(db, run_id, override_parameters=override_params)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return {
        "status": "replayed",
        "new_run_id": new_run.id,
        "original_run_id": run_id,
        "plan_name": new_run.plan_name,
        "plan_version": new_run.plan_version,
        "execution_status": new_run.status,
        "parameters": new_run.parameters,
        "results": new_run.results,
    }
