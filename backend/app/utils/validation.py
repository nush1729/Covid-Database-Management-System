# backend/app/utils/validation.py

def validate_json(expected_fields):
    def decorator(fn):
        from functools import wraps
        from flask import request, jsonify
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({'msg': 'Missing JSON in request'}), 400
            data = request.get_json()
            for field in expected_fields:
                if field not in data:
                    return jsonify({'msg': f'Missing field: {field}'}), 400
            return fn(*args, **kwargs)
        return wrapper
    return decorator
