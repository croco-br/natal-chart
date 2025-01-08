def apply_sephiroth_method(data_dict):
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
