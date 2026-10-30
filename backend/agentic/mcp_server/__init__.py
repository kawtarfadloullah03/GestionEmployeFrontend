# mcp_server package
"""Serveur MCP. L'import est volontairement paresseux pour que `python -m` reste propre."""


def get_mcp_instance():
    from agentic.mcp_server.server import mcp

    return mcp
