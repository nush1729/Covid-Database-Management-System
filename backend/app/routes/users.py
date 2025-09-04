# backend/app/routes/users.py

from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User

user_bp = Blueprint('user', __name__)

@user_bp.route('/', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.as_dict() for user in users])

@user_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.as_dict())

@user_bp.route('/', methods=['POST'])
def create_user():
    data = request.json
    user = User(**data)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.as_dict()), 201

@user_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    for field in data:
        setattr(user, field, data[field])
    db.session.commit()
    return jsonify(user.as_dict())

@user_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'msg': 'Deleted'})
