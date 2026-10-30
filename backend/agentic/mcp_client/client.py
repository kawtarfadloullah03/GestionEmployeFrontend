"""Client MCP utilisant réellement le transport stdio du SDK officiel."""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


class MCPWorkflowClient:
    def __init__(self) -> None:
        self.backend_dir = Path(__file__).resolve().parents[2]
        self.server_params = StdioServerParameters(
            command=sys.executable,
            args=["-m", "agentic.mcp_server.server"],
            env={
                **os.environ,
                "PYTHONPATH": os.pathsep.join(
                    [str(self.backend_dir), os.environ.get("PYTHONPATH", "")]
                ).rstrip(os.pathsep),
            },
        )

    async def _list_tools(self) -> list[dict[str, Any]]:
        async with stdio_client(self.server_params) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.list_tools()
                tools = []
                for tool in result.tools:
                    schema = getattr(tool, "inputSchema", {}) or {}
                    properties = schema.get("properties", {})
                    tools.append({
                        "name": tool.name,
                        "description": tool.description or "",
                        "parameters": properties,
                        "input_schema": schema,
                        "supports_dry_run": "dry_run" in properties,
                    })
                return tools

    async def _call_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        async with stdio_client(self.server_params) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments=arguments)
                if getattr(result, "isError", False):
                    message = " ".join(
                        item.text for item in result.content if getattr(item, "text", None)
                    )
                    return {"status": "error", "output": {}, "error": message or "Erreur MCP", "duration_ms": 0}
                structured = getattr(result, "structuredContent", None)
                if structured is not None:
                    output = structured
                else:
                    output = {}
                    for item in result.content:
                        text = getattr(item, "text", None)
                        if text:
                            try:
                                output = json.loads(text)
                                break
                            except json.JSONDecodeError:
                                output["message"] = text
                return {
                    "status": "success",
                    "output": output,
                    "error": "",
                    "duration_ms": output.get("duration_ms", 0) if isinstance(output, dict) else 0,
                }

    async def alist_tools(self) -> list[dict[str, Any]]:
        """Découverte asynchrone adaptée aux routes ASGI et aux boucles déjà actives."""
        try:
            return await self._list_tools()
        except Exception as exc:
            raise RuntimeError(f"Impossible de découvrir les outils MCP : {exc}") from exc

    def list_tools(self) -> list[dict[str, Any]]:
        """Pont synchrone réservé aux scripts et aux chemins d'exécution synchrones."""
        try:
            return asyncio.run(self.alist_tools())
        except Exception as exc:
            raise RuntimeError(f"Impossible de découvrir les outils MCP : {exc}") from exc

    def call_tool(self, tool_name: str, arguments: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
        args = dict(arguments)
        if dry_run:
            args["dry_run"] = True
        try:
            return asyncio.run(self._call_tool(tool_name, args))
        except Exception as exc:
            return {
                "status": "error",
                "output": {},
                "error": f"Erreur d'appel MCP '{tool_name}' : {exc}",
                "duration_ms": 0,
            }


mcp_client = MCPWorkflowClient()


def get_mcp_client() -> MCPWorkflowClient:
    return mcp_client
