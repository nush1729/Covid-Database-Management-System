import datetime as dt
import uuid
from functools import wraps
from flask import request, jsonify
import jwt
from ..config import Config


def generate_jwt(user_id: uuid.UUID, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": int(dt.datetime.utcnow().timestamp()),
        "exp": int((dt.datetime.utcnow() + dt.timedelta(hours=8)).timestamp()),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def require_auth(roles: list[str] | None = None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            token = auth_header.split(" ")[-1] if auth_header else None
            if not token:
                return jsonify({"error": "Missing token"}), 401
            try:
                data = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
                if roles and data.get("role") not in roles:
                    return jsonify({"error": "Forbidden"}), 403
                request.user = data
            except Exception as ex:
                return jsonify({"error": "Invalid token", "detail": str(ex)}), 401
            return fn(*args, **kwargs)
        return wrapper
    return decorator
