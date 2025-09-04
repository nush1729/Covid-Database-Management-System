# backend/app/models/patient.py

from app import db

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    contact = db.Column(db.String(20))
    dob = db.Column(db.Date, nullable=False)
    
    def as_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "contact": self.contact,
            "dob": str(self.dob)
        }
