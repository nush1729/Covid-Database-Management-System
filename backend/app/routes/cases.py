# backend/app/routes/cases.py

from flask import Blueprint, request, jsonify
from app import db
from app.models.caserecord import CaseRecord

case_bp = Blueprint('case', __name__)

@case_bp.route('/', methods=['GET'])
def get_cases():
    cases = CaseRecord.query.all()
    return jsonify([case.as_dict() for case in cases])

@case_bp.route('/<int:case_id>', methods=['GET'])
def get_case(case_id):
    case = CaseRecord.query.get_or_404(case_id)
    return jsonify(case.as_dict())

@case_bp.route('/', methods=['POST'])
def create_case():
    data = request.json
    case = CaseRecord(**data)
    db.session.add(case)
    db.session.commit()
    return jsonify(case.as_dict()), 201

@case_bp.route('/<int:case_id>', methods=['PUT'])
def update_case(case_id):
    case = CaseRecord.query.get_or_404(case_id)
    data = request.json
    for field in data:
        setattr(case, field, data[field])
    db.session.commit()
    return jsonify(case.as_dict())

@case_bp.route('/<int:case_id>', methods=['DELETE'])
def delete_case(case_id):
    case = CaseRecord.query.get_or_404(case_id)
    db.session.delete(case)
    db.session.commit()
    return jsonify({'msg': 'Deleted'})
