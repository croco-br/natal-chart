"""Pydantic request/response models for the JSON API.

Kept minimal and pydantic-v1-compatible (kerykeion pins pydantic<2). The domain
model lives in ``app.schema`` as framework-free dataclasses.
"""

from typing import Optional

from pydantic import BaseModel


class ChartRequest(BaseModel):
    date: str  # "YYYY-MM-DD"
    time: str  # "HH:MM" — required (missing field -> 422)
    city: str
    name: Optional[str] = None
    method: str = "traditional"
