"""
Nœuds LangGraph — Étape 2
Chaque fonction est un nœud du graphe. Elle reçoit le WorkflowState
et retourne un dict partiel qui met à jour cet état.

Architecture du graphe :
                    ┌──────────────────────────────┐
    START ──► run_step ──► should_continue ──► END (done / failed / stopped)
                    └──────────────────────────────┘
                         ↑_________loop__________↓

Nœuds :
  • run_step      : exécute l'étape courante, avance l'index
  • handle_error  : log l'erreur critique, passe le status à "failed"
"""

import time
from agentic.engine.state import WorkflowState, StepResult
from agentic.engine.tools import dispatch


# ─────────────────────────────────────────────────────────────────────────────
# Nœud principal : run_step
# ─────────────────────────────────────────────────────────────────────────────

def node_run_step(state: WorkflowState) -> dict:
    """
    Exécute l'étape à l'index `current_index` dans l'ordre topologique.

    Logique :
    1. Récupère l'étape courante depuis execution_order + steps
    2. Appelle l'outil correspondant (dispatch)
    3. Enregistre le résultat (succès ou échec)
    4. Incrémente current_index
    5. Si l'étape échoue → ajoute à error_log
    """
    idx             = state["current_index"]
    execution_order = state["execution_order"]
    step_id         = execution_order[idx]

    # Retrouve l'étape complète depuis la liste sérialisée
    step_map = {s["id"]: s for s in state["steps"]}
    step     = step_map[step_id]

    # Appelle l'outil
    tool_result = dispatch(step, state["results"])

    error    = tool_result.get("error", "")
    status   = "failed" if error else "done"
    duration = tool_result.get("duration_ms", 0)

    step_result: StepResult = {
        "step_id":    step_id,
        "step_name":  step.get("name", step_id),
        "status":     status,
        "output":     tool_result.get("output", {}),
        "error":      error,
        "duration_ms": duration,
    }

    # Mise à jour de l'état (retour partiel)
    new_results    = {**state["results"], step_id: step_result}
    new_index      = idx + 1
    new_error_log  = list(state["error_log"])

    if error:
        new_error_log.append(
            f"[{step_id}] {step.get('name', step_id)} : {error}"
        )

    return {
        "results":       new_results,
        "current_index": new_index,
        "error_log":     new_error_log,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Nœud de finalisation : finalize
# ─────────────────────────────────────────────────────────────────────────────

def node_finalize(state: WorkflowState) -> dict:
    """
    Calcule le status final du workflow.
    Appelé quand toutes les étapes sont terminées ou qu'un arrêt est demandé.
    """
    if state["stop_requested"]:
        final_status = "stopped"
    elif any(r["status"] == "failed" for r in state["results"].values()):
        final_status = "failed"
    else:
        final_status = "done"

    return {"status": final_status}


# ─────────────────────────────────────────────────────────────────────────────
# Edge conditionnelle : décide du prochain nœud après run_step
# ─────────────────────────────────────────────────────────────────────────────

def should_continue(state: WorkflowState) -> str:
    """
    Fonction de routage appelée après chaque run_step.

    Retourne :
      "continue"  → il reste des étapes et aucun arrêt demandé
      "finalize"  → toutes les étapes sont faites ou arrêt demandé
    """
    # Arrêt explicite demandé (ex. via API)
    if state["stop_requested"]:
        return "finalize"

    # Arrête le workflow dès qu'une étape échoue. Les dépendances aval (surtout
    # export et notification) ne doivent pas s'exécuter sur des résultats incomplets.
    if any(result.get("status") == "failed" for result in state["results"].values()):
        return "finalize"

    # Plus d'étapes à exécuter
    if state["current_index"] >= len(state["execution_order"]):
        return "finalize"

    # Aucune erreur et il reste des étapes : poursuivre le plan déterministe.
    return "continue"
