# backend/app/models/location.py

from app import db

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200))
    street = db.Column(db.String(100))
    zip = db.Column(db.String(20))
    state = db.Column(db.String(50))
    
    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "street": self.street,
            "zip": self.zip,
            "state": self.state
        }
