from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

_tf = TimezoneFinder()


def resolve_location(city):
    """City name -> (lat, lon, tz_str).

    Auto-derives the IANA timezone from the coordinates so callers only need to
    supply a city. Raises LookupError if the city or its timezone can't be found.
    """
    geolocator = Nominatim(user_agent="astrolens")
    location = geolocator.geocode(city)
    if location is None:
        raise LookupError(f"Could not geocode city: {city!r}")

    lat, lon = location.latitude, location.longitude
    tz = _tf.timezone_at(lng=lon, lat=lat)
    if tz is None:
        raise LookupError(f"Could not resolve timezone for city: {city!r}")

    return lat, lon, tz
