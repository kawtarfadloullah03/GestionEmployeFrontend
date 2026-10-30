"""
Database Connection — Étape 5 : Persistance
Gère la connexion à la base de données (PostgreSQL en production/Docker,
avec fallback automatique sur SQLite en local pour les tests immédiats).
"""

import os
from app.core.config import DATABASE_URL, IS_PRODUCTION
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Si DATABASE_URL est défini (ex: postgresql://user:pwd@localhost:5432/workflows), on l'utilise.
# Sinon, fallback sécurisé sur SQLite local.
if IS_PRODUCTION and not DATABASE_URL:
    raise RuntimeError("DATABASE_URL PostgreSQL est obligatoire en production.")
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./workflows.db"

# Pour SQLite, check_same_thread=False est requis avec FastAPI
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Générateur de session de base de données pour FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialise les tables de la base de données."""
    Base.metadata.create_all(bind=engine)
