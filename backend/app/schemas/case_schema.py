# backend/app/schemas/case_schema.py

from app import ma
from app.models.caserecord import CaseRecord

class CaseRecordSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = CaseRecord
        load_instance = True

case_schema = CaseRecordSchema()
cases_schema = CaseRecordSchema(many=True)
