# backend/app/routes/vaccinations.py

from flask import Blueprint, request, jsonify
from app import db
from app.models.vaccination import Vaccination

vaccination_bp = Blueprint('vaccination', __name__)

@vaccination_bp.route('/', methods=['GET'])
def get_vaccinations():
    vaccinations = Vaccination.query.all()
    return jsonify([vac.as_dict() for vac in vaccinations])

@vaccination_bp.route('/<int:vac_id>', methods=['GET'])
def get_vaccination(vac_id):
    vac = Vaccination.query.get_or_404(vac_id)
    return jsonify(vac.as_dict())

@vaccination_bp.route('/', methods=['POST'])
def create_vaccination():
    data = request.json
    vac = Vaccination(**data)
    db.session.add(vac)
    db.session.commit()
    return jsonify(vac.as_dict()), 201

@vaccination_bp.route('/<int:vac_id>', methods=['PUT'])
def update_vaccination(vac_id):
    vac = Vaccination.query.get_or_404(vac_id)
    data = request.json
    for field in data:
        setattr(vac, field, data[field])
    db.session.commit()
    return jsonify(vac.as_dict())

@vaccination_bp.route('/<int:vac_id>', methods=['DELETE'])
def delete_vaccination(vac_id):
    vac = Vaccination.query.get_or_404(vac_id)
    db.session.delete(vac)
    db.session.commit()
    return jsonify({'msg': 'Deleted'})
