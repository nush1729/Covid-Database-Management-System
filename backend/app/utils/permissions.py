# backend/app/utils/permissions.py

from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from functools import wraps
from flask import jsonify

def role_required(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            if not identity or 'role' not in identity or identity['role'] != required_role:
                return jsonify({'msg': 'Unauthorized'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
