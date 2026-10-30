"""
Database Models — Étape 5 : Versioning des plans & Historique des exécutions
"""

import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from agentic.database.connection import Base


class WorkflowPlanModel(Base):
    """
    Table stockant les plans d'action et leur historique de versioning.
    Un même nom de workflow peut avoir les versions 1, 2, 3...
    """
    __tablename__ = "workflow_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(128), index=True, nullable=False)
    version = Column(Integer, index=True, default=1, nullable=False)
    description = Column(Text, default="")
    steps_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    runs = relationship("WorkflowRunModel", back_populates="plan", cascade="all, delete-orphan")


class WorkflowRunModel(Base):
    """
    Table stockant les exécutions, l'idempotence et les rejeux.
    """
    __tablename__ = "workflow_runs"

    id = Column(String(64), primary_key=True, index=True)  # UUID
    plan_id = Column(Integer, ForeignKey("workflow_plans.id"), nullable=True)
    plan_name = Column(String(128), nullable=False)
    plan_version = Column(Integer, nullable=False)

    status = Column(String(32), default="pending", index=True, nullable=False)
    # Clé d'idempotence pour la prévention des doubles exécutions
    idempotency_key = Column(String(128), unique=True, index=True, nullable=True)

    parameters = Column(JSON, default=dict)
    results = Column(JSON, default=dict)
    execution_order = Column(JSON, default=list)
    error_log = Column(JSON, default=list)

    is_replay = Column(Boolean, default=False)
    replayed_from_run_id = Column(String(64), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    plan = relationship("WorkflowPlanModel", back_populates="runs")


class RAGChunkModel(Base):
    """Fragments documentaires et vecteurs utilisés par la recherche RAG."""
    __tablename__ = "rag_chunks"

    id = Column(String(64), primary_key=True)
    doc_id = Column(String(128), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    source = Column(String(512), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding_model = Column(String(128), nullable=False)
    embedding = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
