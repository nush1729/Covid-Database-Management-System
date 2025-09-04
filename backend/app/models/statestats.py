# backend/app/models/statestats.py

from app import db

class StateStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.String(100), nullable=False)
    confirmed = db.Column(db.Integer, nullable=False)
    active = db.Column(db.Integer, nullable=False)
    recovered = db.Column(db.Integer, nullable=False)
    deaths = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    mortality_rate = db.Column(db.Float)
    
    def as_dict(self):
        return {
            "id": self.id,
            "state": self.state,
            "confirmed": self.confirmed,
            "active": self.active,
            "recovered": self.recovered,
            "deaths": self.deaths,
            "date": str(self.date),
            "mortality_rate": self.mortality_rate
        }
