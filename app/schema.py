"""Canonical chart data model.

The source of truth for a chart is the vector of absolute ecliptic longitudes
(``PointData.lon``, 0-360 degrees), one per canonical point. Sign, decan,
sephirah, and aspects are all *derived* from those longitudes. Framework-free
dataclasses keep this layer testable and independent of pydantic/kerykeion.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Optional

# Canonical point set: 10 classical planets + Ascendant (order is stable and is
# the order used by Chart.longitudes() / the harmonic embedding in later phases).
CANONICAL_POINTS = (
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
    "asc",
)


@dataclass
class Birth:
    """Birth moment + resolved location. ``time`` is always present (required)."""

    date: str  # ISO date, "YYYY-MM-DD"
    time: str  # "HH:MM"
    city: str
    lat: float
    lon: float
    tz: str


@dataclass
class PointData:
    """One celestial point. ``lon`` (absolute longitude) is the source of truth."""

    name: str
    lon: float  # absolute ecliptic longitude, 0-360
    sign: str
    position: float  # degrees within the sign, 0-30
    decan: int  # 1, 2 or 3
    quality: Optional[str]  # Cardinal / Fixed / Mutable
    element: Optional[str]  # Fire / Earth / Air / Water
    house: Optional[str]
    retrograde: bool
    sephirah_decan: str  # scheme A: (quality x decan)
    sephirah_traditional: str  # scheme B: Golden Dawn fixed planet -> sephirah
    hermetic_title: Optional[str] = None
    angel: Optional[str] = None


@dataclass
class Aspect:
    """An intra-chart angular relationship between two points."""

    a: str
    b: str
    type: str
    orb: float


@dataclass
class Chart:
    birth: Birth
    points: dict  # point name -> PointData
    name: Optional[str] = None
    id: Optional[str] = None
    aspects: list = field(default_factory=list)
    embedding: Optional[list] = None  # harmonic feature vector (populated in Phase 3)

    def longitudes(self) -> list:
        """Absolute longitudes in CANONICAL_POINTS order — the matcher's input."""
        return [self.points[name].lon for name in CANONICAL_POINTS]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "birth": asdict(self.birth),
            "points": {name: asdict(point) for name, point in self.points.items()},
            "aspects": [asdict(aspect) for aspect in self.aspects],
            "embedding": self.embedding,
        }
