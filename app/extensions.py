from dataclasses import asdict
from fastapi.encoders import jsonable_encoder
from kerykeion import AstrologicalSubject


class SerializableAstrologicalSubject(AstrologicalSubject):
    def to_dict(self, add_fields):
        data = jsonable_encoder(self)
        if add_fields is True:
            data = self.add_fiels(data)
           
        return self.filter(data)

    def add_fiels(self, data):
        data["sun"]["sephiroth"] = ""
        data["moon"]["sephiroth"] = ""
        data["mercury"]["sephiroth"] = ""
        data["venus"]["sephiroth"] = ""
        data["mars"]["sephiroth"] = ""
        data["jupiter"]["sephiroth"] = ""
        data["saturn"]["sephiroth"] = ""
        data["uranus"]["sephiroth"] = ""
        data["pluto"]["sephiroth"] = ""
        data["chiron"]["sephiroth"] = ""
        data["first_house"]["sephiroth"] = ""
        return data

    def filter(self, data):
        exclude_keys = {
            "json_dir",
            "geonames_username",
            "_iflag",
            "planets_degrees_ut",
            "houses_degree_ut",
        }
        filtered_data = {k: v for k, v in data.items() if k not in exclude_keys}
        return filtered_data
