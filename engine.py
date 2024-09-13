from kerykeion import AstrologicalSubject
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
        nation=nation,
    )

def apply_method(data, option):     
    if option == 'hermetic':
        data.sun.sign = get_hermetic_sign(data.sun.sign, data.sun.position)
        data.moon.sign = get_hermetic_sign(data.moon.sign, data.moon.position)
        data.mercury.sign = get_hermetic_sign(data.mercury.sign, data.mercury.position)
        data.venus.sign = get_hermetic_sign(data.venus.sign, data.venus.position)
        data.mars.sign = get_hermetic_sign(data.mars.sign, data.mars.position)
        data.jupiter.sign = get_hermetic_sign(data.jupiter.sign, data.jupiter.position)
        data.saturn.sign = get_hermetic_sign(data.saturn.sign, data.saturn.position)
        data.uranus.sign = get_hermetic_sign(data.uranus.sign, data.uranus.position)
        data.neptune.sign = get_hermetic_sign(data.neptune.sign, data.neptune.position)
        data.pluto.sign = get_hermetic_sign(data.pluto.sign, data.pluto.position)
        data.chiron.sign = get_hermetic_sign(data.chiron.sign, data.chiron.position)
        data.first_house.sign = get_hermetic_sign(data.first_house.sign, data.first_house.position)
    
      
    if option == 'angels':
        data.sun.sign = get_angel(data.sun.sign, data.sun.position)
        data.moon.sign = get_angel(data.moon.sign, data.moon.position)
        data.mercury.sign = get_angel(data.mercury.sign, data.mercury.position)
        data.venus.sign = get_angel(data.venus.sign, data.venus.position)
        data.mars.sign = get_angel(data.mars.sign, data.mars.position)
        data.jupiter.sign = get_angel(data.jupiter.sign, data.jupiter.position)
        data.saturn.sign = get_angel(data.saturn.sign, data.saturn.position)
        data.uranus.sign = get_angel(data.uranus.sign, data.uranus.position)
        data.neptune.sign = get_angel(data.neptune.sign, data.neptune.position)
        data.pluto.sign = get_angel(data.pluto.sign, data.pluto.position)
        data.chiron.sign = get_angel(data.chiron.sign, data.chiron.position)
        data.first_house.sign = get_angel(data.first_house.sign, data.first_house.position)     
    return data

def get_hermetic_sign(sign, pos):
    if sign == "Ari":
        if 0 < pos <= 5:
            return "Rainha de Bastões" 
        if 25 <= pos <= 30:
                return "Principe de Moedas"
    if sign == "Tau":  
        if 0 < pos <= 5: 
             return "Principe de Moedas"
        if  25 <= pos <= 30:
                return "Rei de Espadas"
    if sign == "Gem": 
        if 0 < pos <= 5: 
             return "Rei de Espadas"
        if  25 <= pos <= 30:
                return "Rainha de Taças"
    if sign == "Can": 
        if 0 < pos <= 5:
            return "Rainha de Taças"
        if  25 <= pos <= 30:
              return "Príncipe de Bastões"
    if sign == "Leo": 
        if 0 < pos <= 5:
             return "Príncipe de Bastões"
        if  25 <= pos <= 30:
              return "Rei de Moedas"
    if sign == "Vir": 
        if 0 < pos <= 5:
            return "Rei de Moedas"
        if  25 <= pos <= 30:
              return "Rainha de Espadas"
    if sign == "Lib":  
        if 0 < pos <= 5:
             return "Rainha de Espadas"
        if  25 <= pos <= 30:
              return "Príncipe de Taças"
    if sign == "Sco":  
        if 0 < pos <= 5:
            return "Príncipe de Taças"
        if  25 <= pos <= 30:
              return "Rei de Bastões"
    if sign == "Sag": 
        if 0 < pos <= 5:
            return "Rei de Bastões"
        if  25 <= pos <= 30:
              return "Rainha de Moedas"
    if sign == "Cap": 
        if 0 < pos <= 5:
            return "Rainha de Moedas"
        if  25 <= pos <= 30:
              return "Príncipe de Espadas"
    if sign == "Aqu":  
        if 0 < pos <= 5:
            return "Príncipe de Espadas"
        if  25 <= pos <= 30:
              return "Rei de Taças"
    if sign == "Pis": 
        if 0 < pos <= 5:
            return "Rei de Taças"
        if  25 <= pos <= 30:
              return "Rainha de Bastões"         
    return sign

def get_angel(sign, pos):
    if sign == "Ari":  
        if 0 < pos <= 5:
            return "Vehuiah"
        elif 5 <= pos <= 10:
            return "Jeliel"
        elif 10 <= pos <= 15:
            return "Sitael"
        elif 15 <= pos <= 20:
            return "Elemiah"
        elif 20 <= pos <= 25:
            return "Mahasiah"
        elif 25 <= pos <= 30:
            return "Lelahel"

    elif sign == "Tau":  # Taurus
        if 0 < pos <= 5:
            return "Achaiah"
        elif 5 <= pos <= 10:
            return "Cahethel"
        elif 10 <= pos <= 15:
            return "Haziel"
        elif 15 <= pos <= 20:
            return "Aladiah"
        elif 20 <= pos <= 25:
            return "Laoviah"
        elif 25 <= pos <= 30:
            return "Hahahiah"

    elif sign == "Gem":  # Gemini
        if 0 < pos <= 5:
            return "Yesalel"
        elif 5 <= pos <= 10:
            return "Mebahel"
        elif 10 <= pos <= 15:
            return "Hariel"
        elif 15 <= pos <= 20:
            return "Hekamiah"
        elif 20 <= pos <= 25:
            return "Lauviah"
        elif 25 <= pos <= 30:
            return "Caliel"

    elif sign == "Can":  # Cancer
        if 0 < pos <= 5:
            return "Leuviah"
        elif 5 <= pos <= 10:
            return "Pahaliah"
        elif 10 <= pos <= 15:
            return "Nelchael"
        elif 15 <= pos <= 20:
            return "Ieiaiel"
        elif 20 <= pos <= 25:
            return "Melahel"
        elif 25 <= pos <= 30:
            return "Haheuiah"

    elif sign == "Leo":  # Leo
        if 0 < pos <= 5:
            return "Nith-Haiah"
        elif 5 <= pos <= 10:
            return "Haaiah"
        elif 10 <= pos <= 15:
            return "Ierathel"
        elif 15 <= pos <= 20:
            return "Seheiah"
        elif 20 <= pos <= 25:
            return "Reyel"
        elif 25 <= pos <= 30:
            return "Omael"

    elif sign == "Vir":  # Virgo
        if 0 < pos <= 5:
            return "Lecabel"
        elif 5 <= pos <= 10:
            return "Vasahiah"
        elif 10 <= pos <= 15:
            return "Iehuiah"
        elif 15 <= pos <= 20:
            return "Lehaiah"
        elif 20 <= pos <= 25:
            return "Chavakiah"
        elif 25 <= pos <= 30:
            return "Menadel"

    elif sign == "Lib":  # Libra
        if 0 < pos <= 5:
            return "Aniel"
        elif 5 <= pos <= 10:
            return "Haamiah"
        elif 10 <= pos <= 15:
            return "Rehael"
        elif 15 <= pos <= 20:
            return "Ieiazel"
        elif 20 <= pos <= 25:
            return "Hahahel"
        elif 25 <= pos <= 30:
            return "Mikael"

    elif sign == "Sco":  # Scorpio
        if 0 < pos <= 5:
            return "Veuliah"
        elif 5 <= pos <= 10:
            return "Yelaiah"
        elif 10 <= pos <= 15:
            return "Sealiah"
        elif 15 <= pos <= 20:
            return "Ariel"
        elif 20 <= pos <= 25:
            return "Asaliah"
        elif 25 <= pos <= 30:
            return "Mihael"

    elif sign == "Sag":  # Sagittarius
        if 0 < pos <= 5:
            return "Vehuel"
        elif 5 <= pos <= 10:
            return "Daniel"
        elif 10 <= pos <= 15:
            return "Hahasiah"
        elif 15 <= pos <= 20:
            return "Imamiah"
        elif 20 <= pos <= 25:
            return "Nanael"
        elif 25 <= pos <= 30:
            return "Nithael"

    elif sign == "Cap":  # Capricorn
        if 0 < pos <= 5:
            return "Mebaiah"
        elif 5 <= pos <= 10:
            return "Poiel"
        elif 10 <= pos <= 15:
            return "Nemamiah"
        elif 15 <= pos <= 20:
            return "Ieialel"
        elif 20 <= pos <= 25:
            return "Harahel"
        elif 25 <= pos <= 30:
            return "Mitzrael"

    elif sign == "Aqu":  # Aquarius
        if 0 < pos <= 5:
            return "Umabel"
        elif 5 <= pos <= 10:
            return "Iah-Hel"
        elif 10 <= pos <= 15:
            return "Anauel"
        elif 15 <= pos <= 20:
            return "Mehiel"
        elif 20 <= pos <= 25:
            return "Damabiah"
        elif 25 <= pos <= 30:
            return "Manakel"

    elif sign == "Pis":  # Pisces
        if 0 < pos <= 5:
            return "Ayel"
        elif 5 <= pos <= 10:
            return "Habuhiah"
        elif 10 <= pos <= 15:
            return "Rochel"
        elif 15 <= pos <= 20:
            return "Yabamiah"
        elif 20 <= pos <= 25:
            return "Haiaiel"
        elif 25 <= pos <= 30:
            return "Mumiah"

    return "Unknown"
