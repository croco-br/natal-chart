def apply_hermetic_method(data):
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
