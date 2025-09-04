# backend/app/routes/auth.py

from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from app.models.user import User
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password, data['password']):
        token = create_access_token(identity={'id': user.id, 'role': user.role})
        return jsonify(access_token=token)
    return jsonify({'msg': 'Invalid credentials'}), 401
