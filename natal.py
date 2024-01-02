from kerykeion import AstrologicalSubject, RelationshipScore

from geocoder import get_lat_lon


def calculate_natal_chart(name, year, month, day, hour, minute, city, timezone, nation):
    lat, lon = get_lat_lon(city)
    return AstrologicalSubject(
        name,
        year,
        month,
        day,
        hour,
        minute,
        lng=lon,
        lat=lat,
        tz_str=timezone,
        city=city,
        nation=nation
    )

def relationship(a, b):
   return RelationshipScore(a, b)

