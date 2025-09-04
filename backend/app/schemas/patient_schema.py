# backend/app/schemas/patient_schema.py

from app import ma
from app.models.patient import Patient

class PatientSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Patient
        load_instance = True

patient_schema = PatientSchema()
patients_schema = PatientSchema(many=True)
