from geopy.geocoders import Nominatim

def get_lat_lon(city):
    geolocator = Nominatim(user_agent="astrotinder")
    location = geolocator.geocode(city)
    return (location.latitude, location.longitude)

