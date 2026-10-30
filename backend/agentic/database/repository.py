"""
Database Repository — Étape 5 : Logique Métier de Persistance, Versioning, Idempotence et Rejeu
"""

import uuid
import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError

from agentic.database.models import WorkflowPlanModel, WorkflowRunModel
from agentic.models.workflow import WorkflowPlan, WorkflowStep
from agentic.engine.graph import execute_plan


def save_or_version_plan(db: Session, plan: WorkflowPlan) -> WorkflowPlanModel:
    """
    Sauvegarde un WorkflowPlan en base de données.
    Si le plan existe déjà sous ce nom, incrémente automatiquement sa version.
    """
    latest = (
        db.query(WorkflowPlanModel)
        .filter(WorkflowPlanModel.name == plan.name)
        .order_by(desc(WorkflowPlanModel.version))
        .first()
    )

    next_version = (latest.version + 1) if latest else 1

    db_plan = WorkflowPlanModel(
        name=plan.name,
        version=next_version,
        description=plan.description,
        steps_json=[step.model_dump() for step in plan.steps]
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


def get_plan(db: Session, name: str, version: Optional[int] = None) -> Optional[WorkflowPlanModel]:
    """Récupère une version spécifique d'un plan ou sa version la plus récente."""
    query = db.query(WorkflowPlanModel).filter(WorkflowPlanModel.name == name)
    if version is not None:
        return query.filter(WorkflowPlanModel.version == version).first()
    return query.order_by(desc(WorkflowPlanModel.version)).first()


def list_versions(db: Session, name: str) -> list[dict[str, Any]]:
    """Retourne l'historique des versions d'un plan."""
    plans = (
        db.query(WorkflowPlanModel)
        .filter(WorkflowPlanModel.name == name)
        .order_by(WorkflowPlanModel.version.asc())
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "version": p.version,
            "description": p.description,
            "step_count": len(p.steps_json),
            "created_at": p.created_at.isoformat()
        }
        for p in plans
    ]


def execute_and_persist_run(
    db: Session,
    plan: WorkflowPlan,
    idempotency_key: Optional[str] = None,
    parameters: Optional[dict[str, Any]] = None,
    replayed_from: Optional[str] = None
) -> tuple[WorkflowRunModel, bool]:
    """
    Exécute un workflow et persiste son résultat.

    Garanties :
    1. Idempotence : si idempotency_key existe déjà, retourne l'enregistrement existant (aucun re-calcul).
    2. Paramétrage dynamique : applique d'éventuels paramètres surchargés pour le rejeu.
    3. Persistance complète de l'état, ordre topologique et résultats.

    Retourne : (WorkflowRunModel, was_executed: bool)
    """
    # 1. Prévention des doubles exécutions (Idempotence)
    if idempotency_key:
        existing = (
            db.query(WorkflowRunModel)
            .filter(WorkflowRunModel.idempotency_key == idempotency_key)
            .first()
        )
        if existing:
            # Idempotence déclenchée : retour immédiat sans réexécution !
            return existing, False

    # 2. Sauvegarde automatique du plan en base s'il n'est pas encore persisté
    db_plan = (
        db.query(WorkflowPlanModel)
        .filter(WorkflowPlanModel.name == plan.name, WorkflowPlanModel.version == plan.version)
        .first()
    )
    if not db_plan:
        db_plan = save_or_version_plan(db, plan)

    # 3. Application de paramètres surchargés éventuels (pour le rejeu paramétré)
    effective_plan = plan.model_copy(deep=True)
    if parameters:
        for step in effective_plan.steps:
            if step.id in parameters:
                step.params.update(parameters[step.id])

    # 4. Création de l'enregistrement en statut 'running'
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    run_record = WorkflowRunModel(
        id=run_id,
        plan_id=db_plan.id,
        plan_name=effective_plan.name,
        plan_version=db_plan.version,
        status="running",
        idempotency_key=idempotency_key,
        parameters=parameters or {},
        is_replay=bool(replayed_from),
        replayed_from_run_id=replayed_from
    )
    db.add(run_record)
    try:
        # Reserve the unique idempotency key before any tool can cause a side effect.
        db.commit()
    except IntegrityError:
        db.rollback()
        if idempotency_key:
            existing = db.query(WorkflowRunModel).filter(
                WorkflowRunModel.idempotency_key == idempotency_key
            ).first()
            if existing:
                return existing, False
        raise

    # 5. Exécution via LangGraph
    try:
        exec_res = execute_plan(effective_plan)
    except Exception as exc:
        run_record.status = "failed"
        run_record.error_log = [f"Erreur d'exécution : {type(exc).__name__}"]
        run_record.completed_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(run_record)
        return run_record, True

    # 6. Mise à jour de la persistance
    run_record.status = exec_res["status"]
    run_record.results = exec_res["results"]
    run_record.execution_order = exec_res["execution_order"]
    run_record.error_log = exec_res["error_log"]
    run_record.completed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(run_record)

    return run_record, True


def replay_run(
    db: Session,
    run_id: str,
    override_parameters: Optional[dict[str, Any]] = None
) -> tuple[Optional[WorkflowRunModel], Optional[str]]:
    """
    Rejoue une exécution passée en rechargeant son plan et en appliquant d'éventuels
    nouveaux paramètres (ex: nouveau fichier source ou nouvelle colonne).
    """
    original_run = db.query(WorkflowRunModel).filter(WorkflowRunModel.id == run_id).first()
    if not original_run:
        return None, f"Exécution introuvable avec l'ID '{run_id}'"

    plan_record = db.query(WorkflowPlanModel).filter(WorkflowPlanModel.id == original_run.plan_id).first()
    if not plan_record:
        return None, f"Plan associé à l'exécution '{run_id}' introuvable"

    # Reconstruction de l'instance Pydantic
    steps = [WorkflowStep(**s) for s in plan_record.steps_json]
    plan_to_replay = WorkflowPlan(
        name=plan_record.name,
        description=plan_record.description,
        version=plan_record.version,
        steps=steps
    )

    # Fusion des paramètres d'origine et des surcharges
    params = dict(original_run.parameters or {})
    if override_parameters:
        for step_id, overrides in override_parameters.items():
            if step_id not in params:
                params[step_id] = {}
            params[step_id].update(overrides)

    # Rejeu via execute_and_persist_run (génère un nouvel ID d'exécution tracé)
    new_run, _ = execute_and_persist_run(
        db=db,
        plan=plan_to_replay,
        idempotency_key=None,  # Pas d'idempotence pour un rejeu explicite
        parameters=params,
        replayed_from=original_run.id
    )

    return new_run, None


def list_runs(db: Session, limit: int = 50) -> list[dict[str, Any]]:
    """Retourne l'historique des exécutions récentes."""
    runs = db.query(WorkflowRunModel).order_by(desc(WorkflowRunModel.created_at)).limit(limit).all()
    return [
        {
            "run_id": r.id,
            "plan_name": r.plan_name,
            "plan_version": r.plan_version,
            "status": r.status,
            "idempotency_key": r.idempotency_key,
            "is_replay": r.is_replay,
            "replayed_from": r.replayed_from_run_id,
            "created_at": r.created_at.isoformat(),
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "step_count": len(r.results or {})
        }
        for r in runs
    ]
