# backend/app/schemas/location_schema.py

from app import ma
from app.models.location import Location

class LocationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Location
        load_instance = True

location_schema = LocationSchema()
locations_schema = LocationSchema(many=True)

