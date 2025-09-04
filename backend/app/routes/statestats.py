# backend/app/routes/statestata.py  # or rename: statestats.py

from flask import Blueprint, request, jsonify
from app import db
from app.models.statestats import StateStats

statestats_bp = Blueprint('statestats', __name__)

@statestats_bp.route('/', methods=['GET'])
def get_stats():
    stats = StateStats.query.all()
    return jsonify([stat.as_dict() for stat in stats])

@statestats_bp.route('/<int:stat_id>', methods=['GET'])
def get_stat(stat_id):
    stat = StateStats.query.get_or_404(stat_id)
    return jsonify(stat.as_dict())

@statestats_bp.route('/', methods=['POST'])
def create_stat():
    data = request.json
    stat = StateStats(**data)
    db.session.add(stat)
    db.session.commit()
    return jsonify(stat.as_dict()), 201

@statestats_bp.route('/<int:stat_id>', methods=['PUT'])
def update_stat(stat_id):
    stat = StateStats.query.get_or_404(stat_id)
    data = request.json
    for field in data:
        setattr(stat, field, data[field])
    db.session.commit()
    return jsonify(stat.as_dict())

@statestats_bp.route('/<int:stat_id>', methods=['DELETE'])
def delete_stat(stat_id):
    stat = StateStats.query.get_or_404(stat_id)
    db.session.delete(stat)
    db.session.commit()
    return jsonify({'msg': 'Deleted'})
