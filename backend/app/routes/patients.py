# backend/app/routes/patients.py

from flask import Blueprint, request, jsonify
from app import db
from app.models.patient import Patient

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/', methods=['GET'])
def get_patients():
    patients = Patient.query.all()
    return jsonify([patient.as_dict() for patient in patients])

@patient_bp.route('/<int:patient_id>', methods=['GET'])
def get_patient(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    return jsonify(patient.as_dict())

@patient_bp.route('/', methods=['POST'])
def create_patient():
    data = request.json
    patient = Patient(**data)
    db.session.add(patient)
    db.session.commit()
    return jsonify(patient.as_dict()), 201

@patient_bp.route('/<int:patient_id>', methods=['PUT'])
def update_patient(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    data = request.json
    for field in data:
        setattr(patient, field, data[field])
    db.session.commit()
    return jsonify(patient.as_dict())

@patient_bp.route('/<int:patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    db.session.delete(patient)
    db.session.commit()
    return jsonify({'msg': 'Deleted'})
