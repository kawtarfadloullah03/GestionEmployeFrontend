"""
Dry-Run Service — Étape 1
Simule l'exécution d'un workflow SANS effets de bord.

Règle fondamentale :
    En mode dry-run, aucun outil ne lit, n'écrit, ni ne modifie de données réelles.
    On retourne uniquement ce que l'étape FERAIT, et quels en seraient les impacts.
"""

from agentic.models.workflow import WorkflowStep, StepPreview, StepType


# ─────────────────────────────────────────────────────────────────────────────
# Simulateurs par type d'étape
# ─────────────────────────────────────────────────────────────────────────────

def _simulate_load_data(step: WorkflowStep) -> StepPreview:
    if step.params.get("domain") == "hr" or step.params.get("source") == "employees":
        department = step.params.get("department") or "tous les départements"
        return StepPreview(
            step_id=step.id,
            step_name=step.name,
            action=f"Lire les fiches employés du périmètre « {department} »",
            inputs={"source": "employees", "department": department},
            outputs={
                "rows": "nombre d’employés correspondant au filtre",
                "columns": ["id", "first_name", "last_name", "department_name", "position", "salary", "leave_balance"],
            },
            side_effects=["Lecture simulée — aucune donnée n’est modifiée"],
            safe=True,
        )
    file_path = step.params.get("file_path", "<inconnu>")
    delimiter = step.params.get("delimiter", ",")
    return StepPreview(
        step_id=step.id,
        step_name=step.name,
        action=f"Lire le fichier '{file_path}' (délimiteur : '{delimiter}')",
        inputs={"file_path": file_path, "delimiter": delimiter},
        outputs={
            "dataframe": "DataFrame<rows=N, cols=M>",
            "columns": ["col1", "col2", "..."],
        },
        side_effects=["Lecture seule — aucune écriture"],
        safe=True,
    )


def _simulate_transform(step: WorkflowStep) -> StepPreview:
    operation = step.params.get("operation", "<inconnu>")
    return StepPreview(
        step_id=step.id,
        step_name=step.name,
        action=f"Transformer les données avec l'opération '{operation}'",
        inputs=step.params,
        outputs={"dataframe": "DataFrame<transformé>"},
        side_effects=["Modifie le DataFrame en mémoire (pas de fichier)"],
        safe=True,
    )


def _simulate_analyze(step: WorkflowStep) -> StepPreview:
    column    = step.params.get("column", "<inconnu>")
    operation = step.params.get("operation", "<inconnu>")
    return StepPreview(
        step_id=step.id,
        step_name=step.name,
        action=f"Calculer '{operation}' sur la colonne '{column}'",
        inputs={"column": column, "operation": operation},
        outputs={"result": f"<valeur numérique — {operation}({column})>"},
        side_effects=["Calcul pur — aucun effet de bord"],
        safe=True,
    )


def _simulate_export(step: WorkflowStep) -> StepPreview:
    destination = step.params.get("destination", "<inconnu>")
    return StepPreview(
        step_id=step.id,
        step_name=step.name,
        action=f"[UNSAFE] Ecrire le resultat vers '{destination}' (NON execute en dry-run)",
        inputs=step.params,
        outputs={"file_written": False},
        side_effects=[
            f"ÉCRITURE vers '{destination}' — bloqué en mode dry-run",
            "Crée ou écrase un fichier existant en mode réel",
        ],
        safe=False,  # ← action avec effets de bord → bloquée en dry-run
    )


def _simulate_notify(step: WorkflowStep) -> StepPreview:
    message = step.params.get("message", "<inconnu>")
    return StepPreview(
        step_id=step.id,
        step_name=step.name,
        action=f"[UNSAFE] Envoyer une notification : '{message}' (NON executee en dry-run)",
        inputs=step.params,
        outputs={"sent": False},
        side_effects=[
            "ENVOI de notification externe — bloqué en mode dry-run",
            "Peut envoyer un e-mail ou un webhook en mode réel",
        ],
        safe=False,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Dispatcher
# ─────────────────────────────────────────────────────────────────────────────

_SIMULATORS = {
    StepType.LOAD_DATA: _simulate_load_data,
    StepType.TRANSFORM: _simulate_transform,
    StepType.ANALYZE:   _simulate_analyze,
    StepType.EXPORT:    _simulate_export,
    StepType.NOTIFY:    _simulate_notify,
}


def simulate_step(step: WorkflowStep) -> StepPreview:
    """Simule une étape unique et retourne son aperçu."""
    simulator = _SIMULATORS.get(step.type)
    if simulator is None:
        return StepPreview(
            step_id=step.id,
            step_name=step.name,
            action=f"Type d'étape inconnu : '{step.type}'",
            safe=False,
        )
    return simulator(step)


def run_dry_run(steps: list[WorkflowStep], execution_order: list[str]) -> list[StepPreview]:
    """
    Simule toutes les étapes dans l'ordre topologique.
    Retourne la liste des aperçus.
    """
    step_map = {step.id: step for step in steps}
    previews: list[StepPreview] = []

    for step_id in execution_order:
        step = step_map[step_id]
        preview = simulate_step(step)
        previews.append(preview)

    return previews
