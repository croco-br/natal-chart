from kerykeion import AstrologicalSubject

from app.extensions import SerializableAstrologicalSubject
from app.geocoder import get_lat_lon


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
        data.first_house.sign = get_hermetic_sign(
            data.first_house.sign, data.first_house.position
        )

        return data.to_dict(False)

    if option == "angels":
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
        data.first_house.sign = get_angel(
            data.first_house.sign, data.first_house.position
        )

        return data.to_dict(False)

    if option == "sephiroth":
        data_dict = data.to_dict(True)
        data_dict["sun"]["sephiroth"] = get_sephiroth(
            data_dict["sun"]["quality"], data_dict["sun"]["position"]
        )
        data_dict["moon"]["sephiroth"] = get_sephiroth(
            data_dict["moon"]["quality"], data_dict["moon"]["position"]
        )
        data_dict["mercury"]["sephiroth"] = get_sephiroth(
            data_dict["mercury"]["quality"], data_dict["mercury"]["position"]
        )
        data_dict["venus"]["sephiroth"] = get_sephiroth(
            data_dict["venus"]["quality"], data_dict["venus"]["position"]
        )
        data_dict["mars"]["sephiroth"] = get_sephiroth(
            data_dict["mars"]["quality"], data_dict["mars"]["position"]
        )
        data_dict["jupiter"]["sephiroth"] = get_sephiroth(
            data_dict["jupiter"]["quality"], data_dict["jupiter"]["position"]
        )
        data_dict["saturn"]["sephiroth"] = get_sephiroth(
            data_dict["saturn"]["quality"], data_dict["saturn"]["position"]
        )
        data_dict["uranus"]["sephiroth"] = get_sephiroth(
            data_dict["uranus"]["quality"], data_dict["uranus"]["position"]
        )
        data_dict["neptune"]["sephiroth"] = get_sephiroth(
            data_dict["neptune"]["quality"], data_dict["neptune"]["position"]
        )
        data_dict["pluto"]["sephiroth"] = get_sephiroth(
            data_dict["pluto"]["quality"], data_dict["pluto"]["position"]
        )
        data_dict["chiron"]["sephiroth"] = get_sephiroth(
            data_dict["chiron"]["quality"], data_dict["chiron"]["position"]
        )
        data_dict["first_house"]["sephiroth"] = get_sephiroth(
            data_dict["first_house"]["quality"], data_dict["first_house"]["position"]
        )
        return data_dict

    if option == "traditional":
        return data.to_dict(False)

    return "Invalid Method"


def get_hermetic_sign(sign, pos):
    if sign == "Ari":
        if 0 < pos <= 5:
            return "Rainha de Bastões"
        if 25 <= pos <= 30:
            return "Principe de Moedas"
    if sign == "Tau":
        if 0 < pos <= 5:
            return "Principe de Moedas"
        if 25 <= pos <= 30:
            return "Rei de Espadas"
    if sign == "Gem":
        if 0 < pos <= 5:
            return "Rei de Espadas"
        if 25 <= pos <= 30:
            return "Rainha de Taças"
    if sign == "Can":
        if 0 < pos <= 5:
            return "Rainha de Taças"
        if 25 <= pos <= 30:
            return "Príncipe de Bastões"
    if sign == "Leo":
        if 0 < pos <= 5:
            return "Príncipe de Bastões"
        if 25 <= pos <= 30:
            return "Rei de Moedas"
    if sign == "Vir":
        if 0 < pos <= 5:
            return "Rei de Moedas"
        if 25 <= pos <= 30:
            return "Rainha de Espadas"
    if sign == "Lib":
        if 0 < pos <= 5:
            return "Rainha de Espadas"
        if 25 <= pos <= 30:
            return "Príncipe de Taças"
    if sign == "Sco":
        if 0 < pos <= 5:
            return "Príncipe de Taças"
        if 25 <= pos <= 30:
            return "Rei de Bastões"
    if sign == "Sag":
        if 0 < pos <= 5:
            return "Rei de Bastões"
        if 25 <= pos <= 30:
            return "Rainha de Moedas"
    if sign == "Cap":
        if 0 < pos <= 5:
            return "Rainha de Moedas"
        if 25 <= pos <= 30:
            return "Príncipe de Espadas"
    if sign == "Aqu":
        if 0 < pos <= 5:
            return "Príncipe de Espadas"
        if 25 <= pos <= 30:
            return "Rei de Taças"
    if sign == "Pis":
        if 0 < pos <= 5:
            return "Rei de Taças"
        if 25 <= pos <= 30:
            return "Rainha de Bastões"
    return sign


def get_angel(sign, pos):
    if sign == "Ari":
        if 0 < pos <= 5:
            return "Ari (Vehuiah)"
        elif 5 <= pos <= 10:
            return "Ari (Jeliel)"
        elif 10 <= pos <= 15:
            return "Ari (Sitael)"
        elif 15 <= pos <= 20:
            return "Ari (Elemiah)"
        elif 20 <= pos <= 25:
            return "Ari (Mahasiah)"
        elif 25 <= pos <= 30:
            return "Ari (Lelahel)"

    elif sign == "Tau":  # Taurus
        if 0 < pos <= 5:
            return "Tau (Achaiah)"
        elif 5 <= pos <= 10:
            return "Tau (Cahethel)"
        elif 10 <= pos <= 15:
            return "Tau (Haziel)"
        elif 15 <= pos <= 20:
            return "Tau (Aladiah)"
        elif 20 <= pos <= 25:
            return "Tau (Laoviah)"
        elif 25 <= pos <= 30:
            return "Tau (Hahahiah)"

    elif sign == "Gem":  # Gemini
        if 0 < pos <= 5:
            return "Gem (Yesalel)"
        elif 5 <= pos <= 10:
            return "Gem (Mebahel)"
        elif 10 <= pos <= 15:
            return "Gem (Hariel)"
        elif 15 <= pos <= 20:
            return "Gem (Hekamiah)"
        elif 20 <= pos <= 25:
            return "Gem (Lauviah)"
        elif 25 <= pos <= 30:
            return "Gem (Caliel)"

    elif sign == "Can":  # Cancer
        if 0 < pos <= 5:
            return "Can (Leuviah)"
        elif 5 <= pos <= 10:
            return "Can (Pahaliah)"
        elif 10 <= pos <= 15:
            return "Can (Nelchael)"
        elif 15 <= pos <= 20:
            return "Can (Ieiaiel)"
        elif 20 <= pos <= 25:
            return "Can (Melahel)"
        elif 25 <= pos <= 30:
            return "Can (Haheuiah)"

    elif sign == "Leo":  # Leo
        if 0 < pos <= 5:
            return "Leo (Nith-Haiah)"
        elif 5 <= pos <= 10:
            return "Leo (Haaiah)"
        elif 10 <= pos <= 15:
            return "Leo (Ierathel)"
        elif 15 <= pos <= 20:
            return "Leo (Seheiah)"
        elif 20 <= pos <= 25:
            return "Leo (Reyel)"
        elif 25 <= pos <= 30:
            return "Leo (Omael)"

    elif sign == "Vir":  # Virgo
        if 0 < pos <= 5:
            return "Vir (Lecabel)"
        elif 5 <= pos <= 10:
            return "Vir (Vasahiah)"
        elif 10 <= pos <= 15:
            return "Vir (Iehuiah)"
        elif 15 <= pos <= 20:
            return "Vir (Lehaiah)"
        elif 20 <= pos <= 25:
            return "Vir (Chavakiah)"
        elif 25 <= pos <= 30:
            return "Vir (Menadel)"

    elif sign == "Lib":  # Libra
        if 0 < pos <= 5:
            return "Lib (Aniel)"
        elif 5 <= pos <= 10:
            return "Lib (Haamiah)"
        elif 10 <= pos <= 15:
            return "Lib (Rehael)"
        elif 15 <= pos <= 20:
            return "Lib (Ieiazel)"
        elif 20 <= pos <= 25:
            return "Lib (Hahahel)"
        elif 25 <= pos <= 30:
            return "Lib (Mikael)"

    elif sign == "Sco":  # Scorpio
        if 0 < pos <= 5:
            return "Sco (Veuliah)"
        elif 5 <= pos <= 10:
            return "Sco (Yelaiah)"
        elif 10 <= pos <= 15:
            return "Sco (Sealiah)"
        elif 15 <= pos <= 20:
            return "Sco (Ariel)"
        elif 20 <= pos <= 25:
            return "Sco (Asaliah)"
        elif 25 <= pos <= 30:
            return "Sco (Mihael)"

    elif sign == "Sag":  # Sagittarius
        if 0 < pos <= 5:
            return "Sag (Vehuel)"
        elif 5 <= pos <= 10:
            return "Sag (Daniel)"
        elif 10 <= pos <= 15:
            return "Sag (Hahasiah)"
        elif 15 <= pos <= 20:
            return "Sag (Imamiah)"
        elif 20 <= pos <= 25:
            return "Sag (Nanael)"
        elif 25 <= pos <= 30:
            return "Sag (Nithael)"

    elif sign == "Cap":  # Capricorn
        if 0 < pos <= 5:
            return "Cap (Mebaiah)"
        elif 5 <= pos <= 10:
            return "Cap (Poiel)"
        elif 10 <= pos <= 15:
            return "Cap (Nemamiah)"
        elif 15 <= pos <= 20:
            return "Cap (Ieialel)"
        elif 20 <= pos <= 25:
            return "Cap (Harahel)"
        elif 25 <= pos <= 30:
            return "Cap (Mitzrael)"

    elif sign == "Aqu":  # Aquarius
        if 0 < pos <= 5:
            return "Aqu (Umabel)"
        elif 5 <= pos <= 10:
            return "Aqu (Iah-Hel)"
        elif 10 <= pos <= 15:
            return "Aqu (Anauel)"
        elif 15 <= pos <= 20:
            return "Aqu (Mehiel)"
        elif 20 <= pos <= 25:
            return "Aqu (Damabiah)"
        elif 25 <= pos <= 30:
            return "Aqu (Manakel)"

    elif sign == "Pis":  # Pisces
        if 0 < pos <= 5:
            return "Pis (Ayel)"
        elif 5 <= pos <= 10:
            return "Pis (Habuhiah)"
        elif 10 <= pos <= 15:
            return "Pis (Rochel)"
        elif 15 <= pos <= 20:
            return "Pis (Yabamiah)"
        elif 20 <= pos <= 25:
            return "Pis (Haiaiel)"
        elif 25 <= pos <= 30:
            return "Pis (Mumiah)"

    return "Unknown"


def get_sephiroth(quality, pos):
    if quality == "Cardinal":
        if 0 < pos <= 10:
            return "Chockmah"
        elif 10 <= pos <= 20:
            return "Binah"
        elif 20 <= pos <= 30:
            return "Chesed"

    if quality == "Fixed":
        if 0 < pos <= 10:
            return "Geburah"
        elif 10 <= pos <= 20:
            return "Tiferet"
        elif 20 <= pos <= 30:
            return "Netzach"

    if quality == "Mutable":
        if 0 < pos <= 10:
            return "Hod"
        elif 10 <= pos <= 20:
            return "Yesod"
        elif 20 <= pos <= 30:
            return "Malkuth"

    return "Unknown"
