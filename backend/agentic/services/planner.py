"""
Planner Service — Étape 3 : LLM et Function Calling
Convertit une intention utilisateur en langage naturel en un WorkflowPlan structuré.

Fonctionnalités clés :
1. Prompt système guidant le LLM avec la liste des types d'étapes et leurs paramètres.
2. Structured Output / Tool Calling imposant le schéma Pydantic `WorkflowPlan`.
3. Validation métier post-génération (`validate_plan`).
4. Fallback intelligent (Heuristic Parser / Mock) si `OPENAI_API_KEY` n'est pas renseignée,
   permettant des tests immédiats et fiables même hors-ligne.
"""

import os
import re
from typing import Optional
from dotenv import load_dotenv

from agentic.models.workflow import WorkflowPlan, WorkflowStep, StepType
from agentic.services.validator import validate_plan, ALLOWED_OPERATIONS, REQUIRED_PARAMS
from agentic.services.dry_run import run_dry_run

load_dotenv()

SYSTEM_PROMPT = """Tu es un planificateur expert en workflows RH et de données.
Ton rôle est de traduire l'intention utilisateur en langage naturel en un plan d'action structuré (WorkflowPlan).
Pour une demande qui cite Norfolk ou les rémunérations publiques, utilise le CSV data/norfolk_public_payroll_summary.csv, domain='public_payroll', column='mean_salary_usd' et weighted_mean avec weight_column='employee_count'. Pour les employés locaux de démonstration seulement, utilise source='employees', domain='hr', column='salary'.

RÈGLES ET CONTRAINTES STRICTES :
1. Chaque étape doit avoir un id unique alphanumérique (ex: "step_1", "step_2").
2. Les types d'étapes autorisés sont :
   - 'load_data' : obligatoire au début si des données sont analysées (paramètre obligatoire: 'file_path').
   - 'transform' : pour nettoyer ou filtrer (paramètre obligatoire: 'operation' parmi ['filter', 'rename', 'drop_column', 'fill_na', 'normalize']).
   - 'analyze' : pour des calculs statistiques (paramètres obligatoires: 'column', 'operation' parmi ['mean', 'sum', 'count', 'min', 'max', 'std', 'describe']).
   - 'export' : pour sauvegarder les résultats (paramètre obligatoire: 'destination').
   - 'notify' : pour envoyer un message ou alerter (paramètre obligatoire: 'message').
3. Dépendances :
   - Indique clairement les dépendances 'depends_on' de chaque étape (ex: 'step_2' dépend de ['step_1']).
   - AUCUN cycle ou auto-dépendance n'est toléré.
4. Génère des descriptions claires et concises.
"""


def _is_hr_prompt(prompt_lower: str) -> bool:
    return any(
        token in prompt_lower
        for token in (
            "employé", "employe", "employee", "salary", "salaire", "paie", "payroll", "prime",
            "bonus", "onboarding", "cong", "leave", "masse salariale",
        )
    ) or re.search(r"\b(it|rh|hr)\b", prompt_lower) is not None


def _hr_semantic_planner(prompt: str) -> WorkflowPlan:
    prompt_lower = prompt.lower()
    department = ""
    if re.search(r"\b(it|engineering)\b", prompt_lower):
        department = "IT"
    elif re.search(r"\bfinance\b", prompt_lower):
        department = "Finance"
    elif "rh" in prompt_lower or "humain" in prompt_lower:
        department = "Ressources Humaines"

    bonus = 0.0
    bonus_match = re.search(r"(\d+(?:[.,]\d+)?)\s*%", prompt)
    if bonus_match:
        bonus = float(bonus_match.group(1).replace(",", "."))

    op = "mean"
    if any(k in prompt_lower for k in ["somme", "total", "masse"]):
        op = "sum"

    steps = [
        WorkflowStep(
            id="step_1",
            type=StepType.LOAD_DATA,
            name="Charger les fiches employés",
            description="Lecture des employés depuis le référentiel RH",
            params={"source": "employees", "domain": "hr", "department": department, "file_path": "employees.csv"},
            depends_on=[],
            timeout_s=30,
        ),
        WorkflowStep(
            id="step_2",
            type=StepType.ANALYZE,
            name="Calculer la masse salariale",
            description=f"Agrégation {op} sur salary" + (f" avec prime {bonus}%" if bonus else ""),
            params={"column": "salary", "operation": op, "department": department, "bonus_pct": bonus, "domain": "hr"},
            depends_on=["step_1"],
            timeout_s=45,
        ),
    ]
    last = "step_2"
    n = 3
    if any(k in prompt_lower for k in ["export", "rapport", "fiche", "csv", "sauvegarde"]):
        steps.append(WorkflowStep(
            id=f"step_{n}",
            type=StepType.EXPORT,
            name="Exporter le rapport de paie",
            description="Génération du fichier de paie",
            params={"destination": "output/payroll_report.csv", "format": "csv", "domain": "hr"},
            depends_on=[last],
            timeout_s=30,
        ))
        last = f"step_{n}"
        n += 1
    if any(k in prompt_lower for k in ["notifie", "alerte", "email", "mail", "manager", "direction"]):
        steps.append(WorkflowStep(
            id=f"step_{n}",
            type=StepType.NOTIFY,
            name="Notifier les RH",
            description="Envoi du récapitulatif de paie",
            params={"message": "Rapport RH / paie prêt.", "channel": "email", "domain": "hr"},
            depends_on=[last],
            timeout_s=15,
        ))
    return WorkflowPlan(
        name="Workflow RH généré",
        description=f"Plan RH pour : '{prompt[:100]}'",
        steps=steps,
        version=1,
    )


def _public_payroll_planner(prompt: str) -> WorkflowPlan:
    """Planifie sur le snapshot public agrégé, distinct des employés de démonstration."""
    lower = prompt.casefold()
    operation = "sum" if any(word in lower for word in ("masse salariale", "total", "somme")) else "weighted_mean"
    column = "total_annual_base_usd" if operation == "sum" else "mean_salary_usd"
    plan = WorkflowPlan(
        name="Analyse de la paie publique de Norfolk",
        description="Analyse d'un snapshot public agrégé en USD, sans données nominatives.",
        version=1,
        steps=[
            WorkflowStep(id="step_1", type=StepType.LOAD_DATA, name="Charger les agrégats publics", description="Lecture du snapshot public; les groupes de moins de trois personnes sont exclus.", params={"file_path": "data/norfolk_public_payroll_summary.csv", "delimiter": ",", "domain": "public_payroll", "source": "public_dataset"}, depends_on=[], timeout_s=30),
            WorkflowStep(id="step_2", type=StepType.ANALYZE, name="Calculer la statistique de rémunération", description="La moyenne des groupes est pondérée par leur effectif.", params={"column": column, "operation": operation, "weight_column": "employee_count", "domain": "public_payroll"}, depends_on=["step_1"], timeout_s=45),
        ],
    )
    return plan


def _mock_semantic_planner(prompt: str) -> WorkflowPlan:
    """
    Planificateur heuristique intelligent utilisé en mode local/hors-ligne
    ou lorsqu'aucune clé API LLM n'est configurée.
    Extrait le nom du fichier, les colonnes et les opérations demandées.
    """
    prompt_lower = prompt.lower()
    if _is_hr_prompt(prompt_lower):
        return _hr_semantic_planner(prompt)
    steps: list[WorkflowStep] = []

    # 1. Extraction ou déduction du fichier CSV
    file_match = re.search(r'([a-zA-Z0-9_\-/\\]+\.(?:csv|xlsx|json|parquet))', prompt, re.IGNORECASE)
    file_path = file_match.group(1) if file_match else "data/sales_demo.csv"

    steps.append(WorkflowStep(
        id="step_1",
        type=StepType.LOAD_DATA,
        name="Charger le fichier de données",
        description=f"Chargement des données depuis '{file_path}'",
        params={"file_path": file_path, "delimiter": ","},
        depends_on=[],
        timeout_s=30
    ))
    last_step_id = "step_1"
    step_num = 2

    # 2. Détection de transformation / filtrage
    if any(k in prompt_lower for k in ["filtre", "filtrer", "nettoie", "nettoyer", "clean", "supprime"]):
        op = "filter"
        if "supprime" in prompt_lower or "drop" in prompt_lower:
            op = "drop_column"
        steps.append(WorkflowStep(
            id=f"step_{step_num}",
            type=StepType.TRANSFORM,
            name="Transformation et nettoyage",
            description="Filtrage ou nettoyage des données brutes",
            params={"operation": op},
            depends_on=[last_step_id],
            timeout_s=30
        ))
        last_step_id = f"step_{step_num}"
        step_num += 1

    # 3. Détection d'analyse statistique
    op = "mean"
    if "somme" in prompt_lower or "sum" in prompt_lower or "total" in prompt_lower:
        op = "sum"
    elif "maximum" in prompt_lower or "max" in prompt_lower:
        op = "max"
    elif "minimum" in prompt_lower or "min" in prompt_lower:
        op = "min"
    elif "ecart" in prompt_lower or "std" in prompt_lower:
        op = "std"
    elif "compte" in prompt_lower or "nombre" in prompt_lower or "count" in prompt_lower:
        op = "count"

    # Détection de la colonne ciblée
    col = "ventes"
    col_match = re.search(r'colonne\s+[\'"]?([a-zA-Z0-9_]+)[\'"]?', prompt_lower)
    if col_match:
        col = col_match.group(1)
    elif "prix" in prompt_lower:
        col = "prix"
    elif re.search(r"\bca\b", prompt_lower) or "chiffre d'affaires" in prompt_lower:
        col = "ca"

    steps.append(WorkflowStep(
        id=f"step_{step_num}",
        type=StepType.ANALYZE,
        name=f"Calcul de {op} sur {col}",
        description=f"Calcul statistique de '{op}' sur la colonne '{col}'",
        params={"column": col, "operation": op},
        depends_on=[last_step_id],
        timeout_s=45
    ))
    last_step_id = f"step_{step_num}"
    step_num += 1

    # 4. Détection d'export ou notification
    if any(k in prompt_lower for k in ["export", "sauvegarde", "enregistre", "rapport"]):
        steps.append(WorkflowStep(
            id=f"step_{step_num}",
            type=StepType.EXPORT,
            name="Exporter les résultats",
            description="Génération du fichier de rapport",
            params={"destination": "output/analyse_resultat.csv", "format": "csv"},
            depends_on=[last_step_id],
            timeout_s=30
        ))
        last_step_id = f"step_{step_num}"
        step_num += 1

    if any(k in prompt_lower for k in ["notifie", "alerte", "message", "mail", "email"]):
        steps.append(WorkflowStep(
            id=f"step_{step_num}",
            type=StepType.NOTIFY,
            name="Notification d'achèvement",
            description="Envoi d'un message récapitulatif",
            params={"message": "Traitement du workflow terminé avec succès.", "channel": "slack"},
            depends_on=[last_step_id],
            timeout_s=15
        ))

    return WorkflowPlan(
        name="Plan généré par intention",
        description=f"Workflow automatisé généré pour : '{prompt[:100]}...'",
        steps=steps,
        version=1
    )


def generate_plan_from_prompt(
    prompt: str,
    api_key: Optional[str] = None,
    model_name: str = "gpt-4o-mini",
    force_local: bool = False,
) -> dict:
    """
    Point d'entrée principal pour la planification LLM.

    1. Interroge le LLM via Function Calling / Structured Output (ou fallback heuristique).
    2. Valide le plan avec `validate_plan`.
    3. Génère une simulation dry-run pour retour immédiat.
    """
    if any(term in prompt.casefold() for term in ("norfolk", "données publiques de rémunération", "paies publiques", "salaires publics")):
        plan = _public_payroll_planner(prompt)
        is_valid, errors, warnings, execution_order = validate_plan(plan)
        previews = [p.model_dump() for p in run_dry_run(plan.steps, execution_order)] if is_valid else []
        return {"user_prompt": prompt, "planner_source": "public_dataset_template", "plan": plan.model_dump(), "is_valid": is_valid, "errors": errors, "warnings": warnings, "execution_order": execution_order, "dry_run_preview": previews, "data_source": "City of Norfolk public employee salary dataset; aggregated snapshot"}
    key = None if force_local else (api_key or os.getenv("OPENAI_API_KEY") or os.getenv("OPENROUTER_API_KEY"))
    is_openrouter = not api_key and not os.getenv("OPENAI_API_KEY") and bool(os.getenv("OPENROUTER_API_KEY"))
    selected_model = (os.getenv("OPENROUTER_MODEL") or "") if is_openrouter else (model_name or "gpt-4o-mini")
    plan: Optional[WorkflowPlan] = None
    planner_source = "mock_semantic_planner"

    if key and not force_local and os.getenv("MOCK_LLM", "false").lower() not in ("true", "1"):
        try:
            from langchain_openai import ChatOpenAI
            llm_kwargs = {
                "model": (os.getenv("OPENROUTER_MODEL") if is_openrouter else selected_model),
                "api_key": key,
                "temperature": 0.0,
                "timeout": 15,
                "max_retries": 0,
            }
            if is_openrouter:
                llm_kwargs["base_url"] = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1")
            llm = ChatOpenAI(**llm_kwargs)
            # Imposition du schéma Pydantic WorkflowPlan par Structured Output
            structured_llm = llm.with_structured_output(WorkflowPlan)
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
            plan = structured_llm.invoke(messages)
            planner_source = f"{'openrouter' if is_openrouter else 'openai'}:{selected_model}"
        except Exception as e:
            # En cas de problème réseau ou d'API, fallback sécurisé avec avertissement
            planner_source = f"fallback_after_error:{type(e).__name__}"
            plan = _mock_semantic_planner(prompt)
    else:
        plan = _mock_semantic_planner(prompt)

    # Validation métier obligatoire, y compris après une sortie structurée du fournisseur.
    is_valid, errors, warnings, execution_order = validate_plan(plan)
    if not is_valid and planner_source.startswith(("openrouter:", "openai:")):
        rejected_errors = list(errors)
        plan = _mock_semantic_planner(prompt)
        is_valid, errors, warnings, execution_order = validate_plan(plan)
        planner_source = "mock_semantic_planner_after_invalid_llm"
        warnings = [*warnings, "Le plan LLM a échoué à la validation métier ; le planificateur local a été utilisé. " + "; ".join(rejected_errors)]

    # Préparation du dry-run si valide
    previews = []
    if is_valid:
        previews = [p.model_dump() for p in run_dry_run(plan.steps, execution_order)]

    return {
        "user_prompt": prompt,
        "planner_source": planner_source,
        "plan": plan.model_dump(),
        "is_valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "execution_order": execution_order,
        "dry_run_preview": previews
    }
