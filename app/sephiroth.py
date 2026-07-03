"""Sephirotic correspondences — two schemes.

Scheme A (decan-based): ``(quality x decan) -> sephirah``. Dynamic; depends on
where a point sits within its sign.

Scheme B (traditional / Golden Dawn): a fixed ``planet -> sephirah`` mapping.
"""

# Scheme A: quality -> (decan 0, decan 1, decan 2)
_DECAN_SEPHIROTH = {
    "Cardinal": ("Chockmah", "Binah", "Chesed"),
    "Fixed": ("Geburah", "Tiferet", "Netzach"),
    "Mutable": ("Hod", "Yesod", "Malkuth"),
}

# Scheme B: canonical point name -> sephirah (Golden Dawn, with modern outers)
_TRADITIONAL_SEPHIROTH = {
    "sun": "Tiferet",
    "moon": "Yesod",
    "mercury": "Hod",
    "venus": "Netzach",
    "mars": "Geburah",
    "jupiter": "Chesed",
    "saturn": "Binah",
    "uranus": "Chockmah",
    "neptune": "Kether",
    "pluto": "Daath",
    "asc": "Malkuth",
}


def decan_index(position):
    """Half-open decan bins: [0,10) -> 0, [10,20) -> 1, [20,30] -> 2.

    Fixes the original overlapping/gap bounds (``0 < pos <= 10`` vs
    ``10 <= pos <= 20``), which double-classified 10/20 and dropped 0.
    """
    return min(int(position // 10), 2)


def sephirah_by_decan(quality, position):
    """Scheme A lookup."""
    table = _DECAN_SEPHIROTH.get(quality)
    if table is None:
        return "Unknown"
    return table[decan_index(position)]


def sephirah_traditional(point_name):
    """Scheme B lookup."""
    return _TRADITIONAL_SEPHIROTH.get(point_name, "Unknown")
