# backend/app/schemas/vaccination_schema.py

from app import ma
from app.models.vaccination import Vaccination

class VaccinationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Vaccination
        load_instance = True

vaccination_schema = VaccinationSchema()
vaccinations_schema = VaccinationSchema(many=True)
