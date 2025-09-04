# backend/app/schemas/statestats_schema.py

from app import ma
from app.models.statestats import StateStats

class StateStatsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = StateStats
        load_instance = True

statestats_schema = StateStatsSchema()
statestats_list_schema = StateStatsSchema(many=True)
