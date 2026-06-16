"""
IT [Tangram 3.0] cross-field validators (RISK-04).

This module exposes a single public function `validate_it_params(payload)`
that parses and validates a raw dict against ITParams Pydantic model,
returning the validated model or raising ValidationError.

The cross-field rules are encoded in the Pydantic model_validator methods
inside it_params_schema.py. This module is the entry point wired into
PATCH /robots/{id} in routers/robots.py.

Rules enforced (per PRD §12 + RISK-04 annotation):
  1. At least one indicator must be enabled → ITParams.model_validator
  2. Each indicator: all required fields present when habilitado=True → per-indicator model_validator
  3. MACD filtro_de_valor=True → valor_do_filtro required
  4. ADX filtro_valor_minimo=True → adx_valor_minimo required
  5. ADX filtro_valor_maximo=True → adx_valor_maximo required
  6. ADX filtro_aumento_diminuicao=True → tendencia_direction required
  7. OBV candles_mesmo_sentido must be > 0
  8. tipo_envio_ordem='limite' → sentido_spread + spread_valor required
"""
from __future__ import annotations

from typing import Any, Dict

from pydantic import ValidationError

from strategies.it_params_schema import ITParams


def validate_it_params(payload: Dict[str, Any]) -> ITParams:
    """
    Validate raw IT params dict against the full IT [Tangram 3.0] schema.

    Returns the validated ITParams model on success.
    Raises pydantic.ValidationError on failure (caller maps to 422).

    RISK-04: cross-field rules are enforced inside ITParams model_validators.
    """
    return ITParams(**payload)


def format_validation_errors(exc: ValidationError) -> Dict[str, Any]:
    """
    Format Pydantic ValidationError into a FastAPI-compatible 422 response body.

    Returns {"detail": [{"loc": [...], "msg": "...", "type": "..."}, ...]}
    """
    return {"detail": exc.errors(include_url=False)}
