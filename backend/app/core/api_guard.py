"""Central fail-closed authorization for the legacy HR HTTP API."""

from __future__ import annotations

from urllib.parse import parse_qsl, urlencode

from fastapi import Request
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import AUTH_DEV_MODE, IS_PRODUCTION
from app.core.security import current_principal


PUBLIC_PATHS = {"/api/health", "/api/auth/login"}
ROLE_RULES = {
    "/api/auth/users": {"HR"},
    "/api/seed/reset": {"HR"},
    "/api/employees": {"HR", "MANAGER"},
    "/api/attendance/correct": {"HR", "MANAGER"},
    "/api/leaves": {"HR", "MANAGER"},
    "/api/leaves/approve": {"HR", "MANAGER"},
    "/api/leaves/reject": {"HR", "MANAGER"},
    "/api/holidays": {"HR"},
    "/api/reports/summary": {"HR", "MANAGER"},
    "/api/audit-logs": {"HR", "MANAGER"},
}


class HRAPIGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method.upper()
        if path in PUBLIC_PATHS or method == "OPTIONS" or not path.startswith("/api/"):
            return await call_next(request)

        # Demo data reset must never be available in a production deployment.
        if path == "/api/seed/reset" and (IS_PRODUCTION or not AUTH_DEV_MODE):
            return JSONResponse({"detail": "Route désactivée."}, status_code=404)

        try:
            authorization = request.headers.get("authorization", "")
            scheme, _, token = authorization.partition(" ")
            principal = current_principal(
                HTTPAuthorizationCredentials(scheme=scheme, credentials=token)
                if scheme and token else None
            )
        except Exception as exc:
            status = getattr(exc, "status_code", 401)
            detail = getattr(exc, "detail", "Authentification requise.")
            return JSONResponse({"detail": detail}, status_code=status)

        request.state.principal = principal
        role = str(principal.get("role", "")).upper()
        required = self._required_roles(path, method)
        if required and role not in required:
            return JSONResponse({"detail": "Rôle insuffisant pour cette opération."}, status_code=403)

        employee_id = str(principal.get("employee_id", ""))
        if role == "EMPLOYEE" and employee_id:
            # Scope self-service queries to the authenticated employee.
            scoped_paths = {"/api/attendance", "/api/leaves", "/api/notifications"}
            if path in scoped_paths:
                query = dict(parse_qsl(request.scope.get("query_string", b"").decode()))
                key = "user_id" if path == "/api/notifications" else "employee_id"
                requested = query.get(key)
                if requested and requested != (principal.get("sub") if key == "user_id" else employee_id):
                    return JSONResponse({"detail": "Accès limité à vos propres données."}, status_code=403)
                query[key] = str(principal.get("sub")) if key == "user_id" else employee_id
                request.scope["query_string"] = urlencode(query).encode()
            if path.startswith("/api/employees/") and path.rsplit("/", 1)[-1] != employee_id:
                return JSONResponse({"detail": "Accès limité à votre dossier."}, status_code=403)
        return await call_next(request)

    @staticmethod
    def _required_roles(path: str, method: str) -> set[str] | None:
        if path == "/api/leaves" and method == "GET":
            return {"HR", "MANAGER", "EMPLOYEE"}
        if path == "/api/leaves/request" and method == "POST":
            return {"HR", "MANAGER", "EMPLOYEE"}
        if path == "/api/leaves/types" and method == "GET":
            return {"HR", "MANAGER", "EMPLOYEE"}
        if path == "/api/employees" and method == "POST":
            return {"HR"}
        if path == "/api/attendance" and method == "GET":
            return {"HR", "MANAGER", "EMPLOYEE"}
        if path == "/api/attendance/clock" and method == "POST":
            return {"EMPLOYEE", "HR", "MANAGER"}
        if path.startswith("/api/leaves/") and path.endswith(("/approve", "/reject")):
            return {"HR", "MANAGER"}
        if path == "/api/holidays" and method == "GET":
            return {"HR", "MANAGER", "EMPLOYEE"}
        if path.startswith("/api/notifications"):
            return {"HR", "MANAGER", "EMPLOYEE"}
        if path.startswith("/api/chat"):
            return {"HR", "MANAGER", "EMPLOYEE"}
        if path == "/api/calendar/events" or path == "/api/departments":
            return {"HR", "MANAGER", "EMPLOYEE"}
        if path == "/api/schedules":
            return {"HR", "MANAGER", "EMPLOYEE"}
        if path.startswith("/api/employees/"):
            return {"HR", "MANAGER", "EMPLOYEE"}
        for route, roles in ROLE_RULES.items():
            if path == route or path.startswith(route + "/"):
                return roles
        return {"HR", "MANAGER", "EMPLOYEE"}
