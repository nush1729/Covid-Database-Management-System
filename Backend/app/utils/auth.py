# JWT authentication utilities
import datetime as dt
import uuid
from functools import wraps
from flask import request, jsonify
import jwt
from ..config import Config


# Generate JWT token for authenticated user
def generate_jwt(user_id: uuid.UUID, role: str) -> str:
    payload = {
        "sub": str(user_id),  # Subject (user ID)
        "role": role,  # User role for authorization
        "iat": int(dt.datetime.utcnow().timestamp()),  # Issued at time
        "exp": int((dt.datetime.utcnow() + dt.timedelta(hours=8)).timestamp()),  # Expiration (8 hours)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


# Decorator to require authentication and optionally check user role
def require_auth(roles: list[str] | None = None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Extract token from Authorization header
            auth_header = request.headers.get("Authorization", "")
            token = auth_header.split(" ")[-1] if auth_header else None
            if not token:
                return jsonify({"error": "Missing token"}), 401
            try:
                # Decode and verify JWT token
                data = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
                # Check role authorization if roles are specified
                if roles and data.get("role") not in roles:
                    return jsonify({"error": "Forbidden"}), 403
                # Attach user data to request for use in route handlers
                request.user = data
            except Exception as ex:
                return jsonify({"error": "Invalid token", "detail": str(ex)}), 401
            return fn(*args, **kwargs)
        return wrapper
    return decorator
