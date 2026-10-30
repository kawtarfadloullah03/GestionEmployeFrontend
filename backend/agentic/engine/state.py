"""
WorkflowState — Étape 2
État partagé entre tous les nœuds du graphe LangGraph.

LangGraph passe cet objet à chaque nœud. Chaque nœud retourne
un dictionnaire partiel qui met à jour l'état global.

Règle LangGraph : l'état doit être un TypedDict.
"""

from typing import Any
from typing_extensions import TypedDict


class StepResult(TypedDict):
    """Résultat d'une étape exécutée."""
    step_id:    str
    step_name:  str
    status:     str          # "done" | "failed" | "skipped"
    output:     dict[str, Any]
    error:      str          # Vide si succès
    duration_ms: int


class WorkflowState(TypedDict):
    """
    État global du workflow, partagé entre tous les nœuds.

    Champs en lecture seule (définis à l'init) :
      • plan_name       — nom du plan
      • steps           — liste des étapes sérialisées
      • execution_order — ordre topologique résolu (vient du validator)

    Champs mis à jour par les nœuds :
      • current_index   — index de l'étape courante dans execution_order
      • results         — step_id → StepResult (accumulé au fil des nœuds)
      • status          — état global : "running" | "done" | "failed" | "stopped"
      • stop_requested  — si True, le moteur finit l'étape en cours puis s'arrête
      • error_log       — liste de messages d'erreurs critiques
    """
    # ── Init ────────────────────────────────────────────────────────────────
    plan_name:       str
    steps:           list[dict[str, Any]]    # sérialisé depuis WorkflowStep
    execution_order: list[str]               # IDs dans l'ordre topologique

    # ── Mis à jour par les nœuds ────────────────────────────────────────────
    current_index:   int                     # prochain step à exécuter
    results:         dict[str, StepResult]   # accumulé
    status:          str                     # "running" | "done" | "failed" | "stopped"
    stop_requested:  bool
    error_log:       list[str]
