"""
Workflow Models — Étape 1
Définit la structure d'un workflow et de ses étapes via Pydantic.
JSON Schema est auto-généré par Pydantic pour valider les plans LLM.
"""

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field, model_validator


# ─────────────────────────────────────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────────────────────────────────────

class StepType(str, Enum):
    """Types d'étapes supportés par le moteur."""
    LOAD_DATA    = "load_data"
    TRANSFORM    = "transform"
    ANALYZE      = "analyze"
    EXPORT       = "export"
    NOTIFY       = "notify"


class StepStatus(str, Enum):
    """État d'une étape pendant / après l'exécution."""
    PENDING   = "pending"
    RUNNING   = "running"
    DONE      = "done"
    FAILED    = "failed"
    SKIPPED   = "skipped"


# ─────────────────────────────────────────────────────────────────────────────
# Modèle d'une étape
# ─────────────────────────────────────────────────────────────────────────────

class WorkflowStep(BaseModel):
    """
    Représente une étape atomique du workflow.

    • id          : identifiant unique de l'étape (ex. "step_1")
    • type        : catégorie de l'action à réaliser
    • name        : libellé lisible par l'humain
    • description : ce que l'étape fait concrètement
    • params      : paramètres libres passés à l'outil
    • depends_on  : liste des id d'étapes qui doivent être terminées avant
    • timeout_s   : durée max d'exécution en secondes (défaut 60 s)
    """
    id:          str             = Field(..., min_length=1, max_length=64,
                                         pattern=r"^[a-zA-Z0-9_\-]+$",
                                         description="Identifiant unique de l'étape")
    type:        StepType        = Field(..., description="Type d'action à réaliser")
    name:        str             = Field(..., min_length=1, max_length=128,
                                         description="Nom lisible de l'étape")
    description: str             = Field("", max_length=512,
                                         description="Description détaillée")
    params:      dict[str, Any]  = Field(default_factory=dict,
                                         description="Paramètres libres de l'étape")
    depends_on:  list[str]       = Field(default_factory=list,
                                         description="IDs des étapes prérequises")
    timeout_s:   int             = Field(60, ge=1, le=3600,
                                         description="Timeout en secondes")

    model_config = {"json_schema_extra": {"examples": [
        {
            "id": "step_1",
            "type": "load_data",
            "name": "Charger le fichier CSV",
            "description": "Lit le fichier sales.csv depuis le disque",
            "params": {"file_path": "sales.csv", "delimiter": ","},
            "depends_on": [],
            "timeout_s": 30,
        }
    ]}}


# ─────────────────────────────────────────────────────────────────────────────
# Modèle d'un workflow complet
# ─────────────────────────────────────────────────────────────────────────────

class WorkflowPlan(BaseModel):
    """
    Plan d'exécution complet proposé par le LLM (ou l'utilisateur).

    • name        : nom du workflow
    • description : objectif global
    • steps       : liste ordonnée des étapes
    • version     : numéro de version du plan (géré par le backend)
    """
    name:        str              = Field(..., min_length=1, max_length=128)
    description: str              = Field("", max_length=1024)
    steps:       list[WorkflowStep] = Field(..., min_length=1)
    version:     int              = Field(1, ge=1, description="Version du plan")

    @model_validator(mode="after")
    def check_dependencies(self) -> "WorkflowPlan":
        """
        Validation métier : chaque depends_on doit référencer un id existant
        et il ne doit pas y avoir de cycle simple (A → A).
        """
        step_ids = {step.id for step in self.steps}

        for step in self.steps:
            # Dépendance vers soi-même
            if step.id in step.depends_on:
                raise ValueError(
                    f"L'étape '{step.id}' ne peut pas dépendre d'elle-même."
                )
            # Dépendance vers un id inexistant
            for dep in step.depends_on:
                if dep not in step_ids:
                    raise ValueError(
                        f"L'étape '{step.id}' dépend de '{dep}' "
                        f"qui n'existe pas dans le plan."
                    )
        return self

    model_config = {"json_schema_extra": {"examples": [
        {
            "name": "Analyse des ventes CSV",
            "description": "Charge, vérifie et calcule la moyenne des ventes",
            "version": 1,
            "steps": [
                {
                    "id": "step_1",
                    "type": "load_data",
                    "name": "Charger le CSV",
                    "description": "Lit sales.csv",
                    "params": {"file_path": "sales.csv"},
                    "depends_on": [],
                    "timeout_s": 30,
                },
                {
                    "id": "step_2",
                    "type": "analyze",
                    "name": "Calculer la moyenne",
                    "description": "Calcule la moyenne de la colonne 'ventes'",
                    "params": {"column": "ventes", "operation": "mean"},
                    "depends_on": ["step_1"],
                    "timeout_s": 60,
                },
            ],
        }
    ]}}


# ─────────────────────────────────────────────────────────────────────────────
# Réponse de validation / dry-run
# ─────────────────────────────────────────────────────────────────────────────

class StepPreview(BaseModel):
    """Aperçu de ce qu'une étape va faire, sans l'exécuter."""
    step_id:     str
    step_name:   str
    action:      str        # Description de l'action simulée
    inputs:      dict[str, Any] = {}
    outputs:     dict[str, Any] = {}  # Outputs simulés (types / exemples)
    side_effects: list[str] = []      # Effets de bord potentiels
    safe:        bool = True          # L'étape est-elle sans danger en dry-run ?


class DryRunResult(BaseModel):
    """Résultat global d'un dry-run."""
    plan_name:    str
    plan_version: int
    is_valid:     bool
    errors:       list[str]          = []
    warnings:     list[str]          = []
    steps_preview: list[StepPreview] = []
    execution_order: list[str]       = []  # Ordre topologique résolu
