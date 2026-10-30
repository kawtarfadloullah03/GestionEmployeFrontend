"""FastAPI application composition root."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agentic.router import router as agentic_router
from app.api.routes.hr import router as hr_router
from app.core.api_guard import HRAPIGuardMiddleware
from app.core.config import CORS_ORIGINS
from app.api.routes.hr import shutdown_db_client, startup_db_client


@asynccontextmanager
async def lifespan(_app):
    await startup_db_client()
    try:
        yield
    finally:
        await shutdown_db_client()

app = FastAPI(
    title="WorkFlow HR + Moteur Agentique M2",
    description="Gestion des employés, LangGraph, MCP, dry-run, RAG et persistance PostgreSQL.",
    version="2.2.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)
app.add_middleware(HRAPIGuardMiddleware)
app.include_router(hr_router)
app.include_router(agentic_router)
