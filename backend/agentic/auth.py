"""Authentification JWT et autorisations pour les routes agentiques RH."""

from typing import Any

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import ALGORITHM, JWT_SECRET

bearer = HTTPBearer(auto_error=False)


def current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentification requise.", headers={"WWW-Authenticate": "Bearer"})
    if len(JWT_SECRET.encode("utf-8")) < 32:
        raise HTTPException(status_code=503, detail="JWT_SECRET doit contenir au moins 32 octets.")
    try:
        claims = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Jeton invalide ou expiré.", headers={"WWW-Authenticate": "Bearer"}) from exc
    if not claims.get("sub") or not claims.get("role"):
        raise HTTPException(status_code=401, detail="Jeton incomplet.")
    return claims


def require_roles(*allowed_roles: str):
    def dependency(principal: dict[str, Any] = Depends(current_principal)) -> dict[str, Any]:
        if principal.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Rôle insuffisant pour cette opération RH.")
        return principal

    return dependency
