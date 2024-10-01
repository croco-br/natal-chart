from dataclasses import asdict
from fastapi.encoders import jsonable_encoder
from kerykeion import AstrologicalSubject

class SerializableAstrologicalSubject(AstrologicalSubject):
  def to_dict(self):
        data = jsonable_encoder(self)
        exclude_keys = {'json_dir', 'geonames_username','_iflag','planets_degrees_ut','houses_degree_ut'}  # Add properties to exclude here
        return {k: v for k, v in data.items() if k not in exclude_keys}