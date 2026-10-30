"""
Validator Service — Étape 1
Validation métier d'un WorkflowPlan (au-delà du JSON Schema Pydantic).

Pydantic valide la STRUCTURE (types, champs requis, format).
Ce service valide la LOGIQUE (cycles, permissions, cohérence métier).
"""

from collections import defaultdict, deque
from agentic.models.workflow import WorkflowPlan, WorkflowStep


# ─────────────────────────────────────────────────────────────────────────────
# Détection de cycles — algorithme de Kahn (tri topologique)
# ─────────────────────────────────────────────────────────────────────────────

def detect_cycles(steps: list[WorkflowStep]) -> list[str]:
    """
    Retourne une liste de messages d'erreur si le graphe de dépendances
    contient des cycles (ex. A → B → A).

    Utilise le tri topologique de Kahn :
    1. Calculer in-degree (nombre de prédécesseurs) pour chaque nœud.
    2. Mettre en file d'attente les nœuds avec in-degree = 0.
    3. Retirer un nœud, décrémenter ses successeurs.
    4. S'il reste des nœuds non visités → cycle détecté.
    """
    in_degree: dict[str, int] = {step.id: 0 for step in steps}
    graph: dict[str, list[str]] = defaultdict(list)

    for step in steps:
        for dep in step.depends_on:
            graph[dep].append(step.id)
            in_degree[step.id] += 1

    queue = deque(sid for sid, deg in in_degree.items() if deg == 0)
    visited = 0

    while queue:
        node = queue.popleft()
        visited += 1
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if visited < len(steps):
        # Nœuds impliqués dans le cycle
        cycle_nodes = [sid for sid, deg in in_degree.items() if deg > 0]
        return [
            f"Cycle de dépendances détecté entre les étapes : {cycle_nodes}. "
            f"Vérifiez les champs 'depends_on'."
        ]
    return []


def topological_order(steps: list[WorkflowStep]) -> list[str]:
    """
    Retourne l'ordre d'exécution topologique (tri de Kahn).
    Suppose qu'il n'y a pas de cycle (appeler detect_cycles avant).
    """
    in_degree: dict[str, int] = {step.id: 0 for step in steps}
    graph: dict[str, list[str]] = defaultdict(list)

    for step in steps:
        for dep in step.depends_on:
            graph[dep].append(step.id)
            in_degree[step.id] += 1

    queue = deque(sorted(sid for sid, deg in in_degree.items() if deg == 0))
    order: list[str] = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in sorted(graph[node]):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order


# ─────────────────────────────────────────────────────────────────────────────
# Règles métier supplémentaires
# ─────────────────────────────────────────────────────────────────────────────

# Paramètres obligatoires par type d'étape
REQUIRED_PARAMS: dict[str, list[str]] = {
    "load_data":  ["file_path"],
    "transform":  ["operation"],
    "analyze":    ["column", "operation"],
    "export":     ["destination"],
    "notify":     ["message"],
}

# Opérations autorisées par type
ALLOWED_OPERATIONS: dict[str, list[str]] = {
    "transform": ["filter", "rename", "drop_column", "fill_na", "normalize"],
    "analyze":   ["mean", "weighted_mean", "sum", "count", "min", "max", "std", "describe"],
}


def validate_params(steps: list[WorkflowStep]) -> tuple[list[str], list[str]]:
    """
    Vérifie que chaque étape possède les paramètres requis
    et que les valeurs sont cohérentes.
    Retourne (errors, warnings).
    """
    errors:   list[str] = []
    warnings: list[str] = []

    for step in steps:
        required = REQUIRED_PARAMS.get(step.type.value, [])
        for param in required:
            if param not in step.params:
                errors.append(
                    f"Etape '{step.id}' ({step.type.value}) : "
                    f"parametre obligatoire manquant -> '{param}'."
                )

        # Vérifie les opérations autorisées
        if step.type.value in ALLOWED_OPERATIONS:
            op = step.params.get("operation")
            allowed = ALLOWED_OPERATIONS[step.type.value]
            if op and op not in allowed:
                errors.append(
                    f"Étape '{step.id}' : opération '{op}' non autorisée "
                    f"pour le type '{step.type.value}'. "
                    f"Valeurs valides : {allowed}."
                )

        # Avertissement si timeout très court
        if step.timeout_s < 5:
            warnings.append(
                f"Étape '{step.id}' : timeout de {step.timeout_s} s "
                f"semble très court."
            )

    return errors, warnings


# ─────────────────────────────────────────────────────────────────────────────
# Point d'entrée principal
# ─────────────────────────────────────────────────────────────────────────────

def validate_plan(plan: WorkflowPlan) -> tuple[bool, list[str], list[str], list[str]]:
    """
    Valide complètement un WorkflowPlan.

    Retourne : (is_valid, errors, warnings, execution_order)

    Note : Pydantic a déjà validé la structure et les dépendances orphelines.
    Ici, on ajoute : cycles, paramètres métier, règles de sécurité.
    """
    all_errors:   list[str] = []
    all_warnings: list[str] = []

    # 1. Détection des cycles
    cycle_errors = detect_cycles(plan.steps)
    all_errors.extend(cycle_errors)

    # 2. Validation des paramètres métier
    param_errors, param_warnings = validate_params(plan.steps)
    all_errors.extend(param_errors)
    all_warnings.extend(param_warnings)

    # 3. Ordre d'exécution (uniquement si pas de cycle)
    execution_order: list[str] = []
    if not cycle_errors:
        execution_order = topological_order(plan.steps)

    is_valid = len(all_errors) == 0
    return is_valid, all_errors, all_warnings, execution_order
