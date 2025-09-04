# backend/app/routes/locations.py

from flask import Blueprint, request, jsonify
from app import db
from app.models.location import Location

location_bp = Blueprint('location', __name__)

@location_bp.route('/', methods=['GET'])
def get_locations():
    locations = Location.query.all()
    return jsonify([location.as_dict() for location in locations])

@location_bp.route('/<int:location_id>', methods=['GET'])
def get_location(location_id):
    location = Location.query.get_or_404(location_id)
    return jsonify(location.as_dict())

@location_bp.route('/', methods=['POST'])
def create_location():
    data = request.json
    location = Location(**data)
    db.session.add(location)
    db.session.commit()
    return jsonify(location.as_dict()), 201

@location_bp.route('/<int:location_id>', methods=['PUT'])
def update_location(location_id):
    location = Location.query.get_or_404(location_id)
    data = request.json
    for field in data:
        setattr(location, field, data[field])
    db.session.commit()
    return jsonify(location.as_dict())

@location_bp.route('/<int:location_id>', methods=['DELETE'])
def delete_location(location_id):
    location = Location.query.get_or_404(location_id)
    db.session.delete(location)
    db.session.commit()
    return jsonify({'msg': 'Deleted'})
