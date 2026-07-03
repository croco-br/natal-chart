"""72 angels of the Shem HaMephorash, mapped by sign and 5-degree bins.

Key format: ``(("Ari", 0), "Ari (Vehuiah)")`` — tuple key ``(sign, bin_index)``
where bin_index 0-5 corresponds to the half-open intervals [0,5), [5,10),
[10,15), [15,20), [20,25), [25,30].

Uses half-open bins so pos=5 lands in bin 1, not bin 0.
"""

from __future__ import annotations

import copy
from typing import Optional

from app.schema import Chart

_ANGELS = {
    ("Ari", 0): "Ari (Vehuiah)",
    ("Ari", 1): "Ari (Jeliel)",
    ("Ari", 2): "Ari (Sitael)",
    ("Ari", 3): "Ari (Elemiah)",
    ("Ari", 4): "Ari (Mahasiah)",
    ("Ari", 5): "Ari (Lelahel)",
    ("Tau", 0): "Tau (Achaiah)",
    ("Tau", 1): "Tau (Cahethel)",
    ("Tau", 2): "Tau (Haziel)",
    ("Tau", 3): "Tau (Aladiah)",
    ("Tau", 4): "Tau (Laoviah)",
    ("Tau", 5): "Tau (Hahahiah)",
    ("Gem", 0): "Gem (Yesalel)",
    ("Gem", 1): "Gem (Mebahel)",
    ("Gem", 2): "Gem (Hariel)",
    ("Gem", 3): "Gem (Hekamiah)",
    ("Gem", 4): "Gem (Lauviah)",
    ("Gem", 5): "Gem (Caliel)",
    ("Can", 0): "Can (Leuviah)",
    ("Can", 1): "Can (Pahaliah)",
    ("Can", 2): "Can (Nelchael)",
    ("Can", 3): "Can (Ieiaiel)",
    ("Can", 4): "Can (Melahel)",
    ("Can", 5): "Can (Haheuiah)",
    ("Leo", 0): "Leo (Nith-Haiah)",
    ("Leo", 1): "Leo (Haaiah)",
    ("Leo", 2): "Leo (Ierathel)",
    ("Leo", 3): "Leo (Seheiah)",
    ("Leo", 4): "Leo (Reyel)",
    ("Leo", 5): "Leo (Omael)",
    ("Vir", 0): "Vir (Lecabel)",
    ("Vir", 1): "Vir (Vasahiah)",
    ("Vir", 2): "Vir (Iehuiah)",
    ("Vir", 3): "Vir (Lehaiah)",
    ("Vir", 4): "Vir (Chavakiah)",
    ("Vir", 5): "Vir (Menadel)",
    ("Lib", 0): "Lib (Aniel)",
    ("Lib", 1): "Lib (Haamiah)",
    ("Lib", 2): "Lib (Rehael)",
    ("Lib", 3): "Lib (Ieiazel)",
    ("Lib", 4): "Lib (Hahahel)",
    ("Lib", 5): "Lib (Mikael)",
    ("Sco", 0): "Sco (Veuliah)",
    ("Sco", 1): "Sco (Yelaiah)",
    ("Sco", 2): "Sco (Sealiah)",
    ("Sco", 3): "Sco (Ariel)",
    ("Sco", 4): "Sco (Asaliah)",
    ("Sco", 5): "Sco (Mihael)",
    ("Sag", 0): "Sag (Vehuel)",
    ("Sag", 1): "Sag (Daniel)",
    ("Sag", 2): "Sag (Hahasiah)",
    ("Sag", 3): "Sag (Imamiah)",
    ("Sag", 4): "Sag (Nanael)",
    ("Sag", 5): "Sag (Nithael)",
    ("Cap", 0): "Cap (Mebaiah)",
    ("Cap", 1): "Cap (Poiel)",
    ("Cap", 2): "Cap (Nemamiah)",
    ("Cap", 3): "Cap (Ieialel)",
    ("Cap", 4): "Cap (Harahel)",
    ("Cap", 5): "Cap (Mitzrael)",
    ("Aqu", 0): "Aqu (Umabel)",
    ("Aqu", 1): "Aqu (Iah-Hel)",
    ("Aqu", 2): "Aqu (Anauel)",
    ("Aqu", 3): "Aqu (Mehiel)",
    ("Aqu", 4): "Aqu (Damabiah)",
    ("Aqu", 5): "Aqu (Manakel)",
    ("Pis", 0): "Pis (Ayel)",
    ("Pis", 1): "Pis (Habuhiah)",
    ("Pis", 2): "Pis (Rochel)",
    ("Pis", 3): "Pis (Yabamiah)",
    ("Pis", 4): "Pis (Haiaiel)",
    ("Pis", 5): "Pis (Mumiah)",
}


def _angel_bin(position: float) -> int:
    """Return the angel bin index 0-5 based on 5-degree half-open bins.

    [0,5) -> 0
    [5,10) -> 1
    [10,15) -> 2
    [15,20) -> 3
    [20,25) -> 4
    [25,30] -> 5
    """
    return min(int(position // 5), 5)


def enrich_angels(chart: Chart) -> Chart:
    """Return a *new* Chart with ``angel`` populated on every point."""
    new_chart = copy.deepcopy(chart)
    for point in new_chart.points.values():
        bin_idx = _angel_bin(point.position)
        point.angel = _ANGELS.get((point.sign, bin_idx))
    return new_chart
