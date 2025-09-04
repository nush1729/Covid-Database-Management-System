# backend/app/models/vaccination.py

from app import db

class Vaccination(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    vaccine_type = db.Column(db.String(50), nullable=False)
    
    def as_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "date": str(self.date),
            "vaccine_type": self.vaccine_type
        }
