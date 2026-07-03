"""Hermetic tarot titles for points near the boundaries of each sign.

_EARLY: titles for positions in the first degrees [0, 5].
_LATE:  titles for positions in the last degrees  [25, 30].
"""

from __future__ import annotations

import copy
from typing import Optional

from app.schema import Chart

# sign -> Portuguese tarot title, for the early degrees (pos <= 5).
_EARLY = {
    "Ari": "Rainha de Bastões",
    "Tau": "Principe de Moedas",
    "Gem": "Rei de Espadas",
    "Can": "Rainha de Taças",
    "Leo": "Príncipe de Bastões",
    "Vir": "Rei de Moedas",
    "Lib": "Rainha de Espadas",
    "Sco": "Príncipe de Taças",
    "Sag": "Rei de Bastões",
    "Cap": "Rainha de Moedas",
    "Aqu": "Príncipe de Espadas",
    "Pis": "Rei de Taças",
}

# sign -> Portuguese tarot title, for the late degrees (pos >= 25).
_LATE = {
    "Ari": "Principe de Moedas",
    "Tau": "Rei de Espadas",
    "Gem": "Rainha de Taças",
    "Can": "Príncipe de Bastões",
    "Leo": "Rei de Moedas",
    "Vir": "Rainha de Espadas",
    "Lib": "Príncipe de Taças",
    "Sco": "Rei de Bastões",
    "Sag": "Rainha de Moedas",
    "Cap": "Príncipe de Espadas",
    "Aqu": "Rei de Taças",
    "Pis": "Rainha de Bastões",
}


def _hermetic_title(sign: str, pos: float) -> Optional[str]:
    """Return the hermetic tarot title for a given sign/position, or None."""
    if pos <= 5:
        return _EARLY.get(sign)
    if pos >= 25:
        return _LATE.get(sign)
    return None


def enrich_hermetic(chart: Chart) -> Chart:
    """Return a *new* Chart with ``hermetic_title`` populated on every point."""
    new_chart = copy.deepcopy(chart)
    for point in new_chart.points.values():
        point.hermetic_title = _hermetic_title(point.sign, point.position)
    return new_chart
