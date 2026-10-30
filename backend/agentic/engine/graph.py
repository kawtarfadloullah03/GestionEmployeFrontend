"""
Graphe LangGraph — Étape 2
Construit et compile le graphe d'exécution à partir d'un WorkflowPlan.

Structure du graphe :
    START
      │
      ▼
  [run_step]  ◄──────────────────┐
      │                          │ (continue)
      ▼                          │
  should_continue ───────────────┘
      │
      │ (finalize)
      ▼
  [finalize]
      │
      ▼
    END

Point important pour l'entretien :
  LangGraph compile le graphe statiquement. On ne peut pas créer
  des nœuds dynamiques (un par étape). À la place, on utilise UNE
  boucle : le même nœud run_step est appelé N fois, il avance
  l'index à chaque appel. L'edge conditionnelle décide d'arrêter
  ou de continuer la boucle.
"""

from langgraph.graph import StateGraph, END

from agentic.engine.state import WorkflowState
from agentic.engine.nodes import node_run_step, node_finalize, should_continue
from agentic.models.workflow import WorkflowPlan
from agentic.services.validator import validate_plan


# ─────────────────────────────────────────────────────────────────────────────
# Construction du graphe
# ─────────────────────────────────────────────────────────────────────────────

def build_graph():
    """
    Construit et compile le graphe LangGraph.
    Ce graphe est réutilisable pour n'importe quel WorkflowPlan.
    """
    builder = StateGraph(WorkflowState)

    # Nœuds
    builder.add_node("run_step", node_run_step)
    builder.add_node("finalize", node_finalize)

    # Point d'entrée
    builder.set_entry_point("run_step")

    # Edge conditionnelle : après run_step → continue ou finalize
    builder.add_conditional_edges(
        "run_step",
        should_continue,
        {
            "continue": "run_step",   # boucle sur le même nœud
            "finalize": "finalize",
        },
    )

    # Sortie
    builder.add_edge("finalize", END)

    return builder.compile()


# Compile une fois à l'import (réutilisé pour toutes les exécutions)
WORKFLOW_GRAPH = build_graph()


# ─────────────────────────────────────────────────────────────────────────────
# Point d'entrée : execute_plan
# ─────────────────────────────────────────────────────────────────────────────

def execute_plan(plan: WorkflowPlan) -> dict:
    """
    Valide puis exécute un WorkflowPlan via le graphe LangGraph.

    Retourne un dict avec :
      • plan_name, plan_version
      • status      : "done" | "failed" | "stopped"
      • results     : dict step_id → StepResult
      • execution_order : ordre des étapes
      • error_log   : liste des erreurs rencontrées
    """
    # 1. Validation (réutilise le service de l'étape 1)
    is_valid, errors, _warnings, execution_order = validate_plan(plan)
    if not is_valid:
        return {
            "plan_name":       plan.name,
            "plan_version":    plan.version,
            "status":          "failed",
            "results":         {},
            "execution_order": [],
            "error_log":       errors,
        }

    # 2. État initial
    initial_state: WorkflowState = {
        "plan_name":       plan.name,
        "steps":           [s.model_dump() for s in plan.steps],
        "execution_order": execution_order,
        "current_index":   0,
        "results":         {},
        "status":          "running",
        "stop_requested":  False,
        "error_log":       [],
    }

    # 3. Exécution via LangGraph
    final_state = WORKFLOW_GRAPH.invoke(initial_state)

    return {
        "plan_name":       plan.name,
        "plan_version":    plan.version,
        "status":          final_state["status"],
        "results":         final_state["results"],
        "execution_order": final_state["execution_order"],
        "error_log":       final_state["error_log"],
    }
