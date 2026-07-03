from datetime import date as date_cls

from kerykeion import AstrologicalSubject

from app.agathadaimon import enrich_agathadaimon
from app.angels import enrich_angels
from app.geocoder import resolve_location
from app.hermetic import enrich_hermetic
from app.schema import Birth, Chart, PointData, CANONICAL_POINTS
from app.sephiroth import decan_index, sephirah_by_decan, sephirah_traditional

# Canonical point name -> kerykeion AstrologicalSubject attribute.
_KERYKEION_ATTR = {
    "sun": "sun",
    "moon": "moon",
    "mercury": "mercury",
    "venus": "venus",
    "mars": "mars",
    "jupiter": "jupiter",
    "saturn": "saturn",
    "uranus": "uranus",
    "neptune": "neptune",
    "pluto": "pluto",
    "asc": "first_house",  # Ascendant = 1st-house cusp
}


def _require_time(birth_time):
    if birth_time is None or str(birth_time).strip() == "":
        raise ValueError(
            "Birth time is required (the Ascendant and houses depend on it)."
        )


def _parse_date(value):
    return date_cls.fromisoformat(str(value).strip())


def _parse_time(value):
    parts = str(value).strip().split(":")
    try:
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
    except (ValueError, IndexError):
        raise ValueError(f"Invalid birth time: {value!r}")
    if not (0 <= hour < 24 and 0 <= minute < 60):
        raise ValueError(f"Invalid birth time: {value!r}")
    return hour, minute


def _point_from_kerykeion(name, kobj):
    lon = float(kobj.abs_pos) % 360.0
    position = float(kobj.position)
    return PointData(
        name=name,
        lon=lon,
        sign=kobj.sign,
        position=position,
        decan=decan_index(position) + 1,  # expose 1..3
        quality=getattr(kobj, "quality", None),
        element=getattr(kobj, "element", None),
        house=getattr(kobj, "house", None),
        retrograde=bool(getattr(kobj, "retrograde", False)),
        sephirah_decan=sephirah_by_decan(getattr(kobj, "quality", None), position),
        sephirah_traditional=sephirah_traditional(name),
    )


def build_chart_from_subject(subject, birth, name=None):
    """Extract the canonical Chart from a kerykeion subject. Network-free."""
    points = {
        point: _point_from_kerykeion(point, getattr(subject, _KERYKEION_ATTR[point]))
        for point in CANONICAL_POINTS
    }
    return Chart(birth=birth, points=points, name=name)


def calculate_chart(birth_date, birth_time, city, name=None, method="traditional"):
    """Birth data -> method-specific response dict.

    Returns:
        {"chart": <dict>}                             — traditional, sephiroth
        {"chart": <dict with hermetic_title>}         — hermetic
        {"chart": <dict with angel>}                  — angels
        {"chart": <dict>, "daimon": <dict>}           — agathadaimon
    """
    _require_time(birth_time)
    day = _parse_date(birth_date)
    hour, minute = _parse_time(birth_time)

    lat, lon, tz = resolve_location(city)

    subject = AstrologicalSubject(
        name or "Anon",
        day.year,
        day.month,
        day.day,
        hour,
        minute,
        lng=lon,
        lat=lat,
        tz_str=tz,
        city=city,
        online=False,
    )

    birth = Birth(
        date=day.isoformat(),
        time=f"{hour:02d}:{minute:02d}",
        city=city,
        lat=lat,
        lon=lon,
        tz=tz,
    )
    chart = build_chart_from_subject(subject, birth, name=name)

    if method == "traditional":
        return {"chart": chart.to_dict()}
    if method == "hermetic":
        return {"chart": enrich_hermetic(chart).to_dict()}
    if method == "angels":
        return {"chart": enrich_angels(chart).to_dict()}
    if method == "sephiroth":
        return {"chart": chart.to_dict()}  # sephirah fields already in PointData
    if method == "agathadaimon":
        daimon = enrich_agathadaimon(chart)
        return {"chart": chart.to_dict(), "daimon": daimon}
    raise ValueError(f"Unknown method: {method!r}")
