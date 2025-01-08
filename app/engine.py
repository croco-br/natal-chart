from kerykeion import AstrologicalSubject

from app.agathadaimon import apply_agathadaimon_method
from app.angels import apply_angels_method
from app.extensions import SerializableAstrologicalSubject
from app.geocoder import get_lat_lon
from app.hermetic import apply_hermetic_method
from app.sephiroth import apply_sephiroth_method


def calculate_natal_chart(name, year, month, day, hour, minute, city, timezone, nation):
    lat, lon = get_lat_lon(city)

    return SerializableAstrologicalSubject(
        name=name,
        year=year,
        month=month,
        day=day,
        hour=hour,
        minute=minute,
        lng=lon,
        lat=lat,
        tz_str=timezone,
        city=city,
        nation=nation,
    )


def apply_method(data: SerializableAstrologicalSubject, option):
    if option == "hermetic":
        apply_hermetic_method(data)
        return data.to_dict(False)

    if option == "angels":
        apply_angels_method(data)
        return data.to_dict(False)

    if option == "sephiroth":
        data_dict = data.to_dict(True)
        apply_sephiroth_method(data_dict)
        return data_dict

    if option == "traditional":
        return data.to_dict(False)

    if option == "agathadaimon":
        return apply_agathadaimon_method(data.to_dict(True))

    return "Invalid Method"
