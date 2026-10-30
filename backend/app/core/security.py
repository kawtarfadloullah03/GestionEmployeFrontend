"""Authentification, hachage de mots de passe et autorisations API."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import ACCESS_TOKEN_TTL_MINUTES, ALGORITHM, AUTH_DEV_MODE, JWT_SECRET

_bearer = HTTPBearer(auto_error=False)
_PBKDF2_ITERATIONS = 600_000


def hash_password(password: str, *, salt: bytes | None = None, iterations: int = _PBKDF2_ITERATIONS) -> str:
    if len(password) < 12:
        raise ValueError("Le mot de passe doit contenir au moins 12 caractères.")
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations).hex()
    return f"pbkdf2_sha256${iterations}${salt.hex()}${digest}"


def verify_password(user: dict[str, Any], password: str) -> bool:
    encoded = user.get("password_hash")
    if encoded:
        try:
            scheme, iteration_text, salt_text, expected = encoded.split("$", 3)
            iterations = int(iteration_text)
            if scheme != "pbkdf2_sha256" or not 100_000 <= iterations <= 2_000_000:
                return False
            actual = hashlib.pbkdf2_hmac(
                "sha256", password.encode("utf-8"), bytes.fromhex(salt_text), iterations
            ).hex()
            return hmac.compare_digest(actual, expected)
        except (ValueError, TypeError):
            return False
    # Seed accounts use plaintext only in explicitly enabled local/demo environments.
    return AUTH_DEV_MODE and hmac.compare_digest(str(user.get("password", "")), password)


def create_access_token(user: dict[str, Any]) -> str:
    if len(JWT_SECRET.encode("utf-8")) < 32:
        raise HTTPException(status_code=503, detail="JWT_SECRET doit contenir au moins 32 octets.")
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user["id"]),
            "role": str(user["role"]).upper(),
            "employee_id": str(user.get("employee_id", "")),
            "iat": now,
            "exp": now + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES),
        },
        JWT_SECRET,
        algorithm=ALGORITHM,
    )


def current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
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
    allowed = {role.upper() for role in allowed_roles}

    def dependency(principal: dict[str, Any] = Depends(current_principal)) -> dict[str, Any]:
        if principal.get("role", "").upper() not in allowed:
            raise HTTPException(status_code=403, detail="Rôle insuffisant pour cette opération.")
        return principal

    return dependency
