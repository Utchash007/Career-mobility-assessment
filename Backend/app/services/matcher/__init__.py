"""Deterministic matching with no HTTP, persistence or external-service imports."""

from app.services.matcher.engine import evaluate, ranking_key

__all__ = ["evaluate", "ranking_key"]
