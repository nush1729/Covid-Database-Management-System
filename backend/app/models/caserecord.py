# backend/app/models/caserecord.py

from app import db

class CaseRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=False)
    diag_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(30), nullable=False)  # e.g. confirmed, recovered, deceased
    notes = db.Column(db.String(250))
    
    def as_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "location_id": self.location_id,
            "diag_date": str(self.diag_date),
            "status": self.status,
            "notes": self.notes
        }
