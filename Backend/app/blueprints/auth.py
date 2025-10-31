# Authentication blueprint - handles user registration and login
from flask import Blueprint, request, jsonify
from sqlalchemy import select
from ..extensions import SessionLocal, bcrypt
from ..models.models import User, UserRole, Patient
from ..utils.auth import generate_jwt
import uuid
import re

# Create blueprint for authentication routes
bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Validation functions for user input
def validate_password(password: str) -> tuple[bool, str]:
    """Validate password: at least one special character and length > 5"""
    if len(password) <= 5:
        return False, "Password must be longer than 5 characters"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    return True, ""

def validate_email(email: str) -> tuple[bool, str]:
    """Validate email: must contain @ and end with .in or .com"""
    if not re.match(r"^[^@\s]+@[^@\s]+\.(in|com)$", email):
        return False, "Email must contain @ and end with .in or .com"
    return True, ""

# User registration endpoint - creates new user account
@bp.post("/register")
def register():
    data = request.get_json() or {}
    required = ["first_name","last_name","name","email","password","role"]
    if not all(k in data for k in required):
        return jsonify({"error":"Missing fields"}), 400
    
    # Validate email
    email = data.get("email", "")
    email_valid, email_error = validate_email(email)
    if not email_valid:
        return jsonify({"error": email_error}), 400
    
    # Validate password
    password = data.get("password", "")
    password_valid, password_error = validate_password(password)
    if not password_valid:
        return jsonify({"error": password_error}), 400
    
    with SessionLocal() as session:
        if session.scalar(select(User).where(User.email == data["email"])):
            return jsonify({"error":"Email exists"}), 400
        hashed = bcrypt.generate_password_hash(data["password"]).decode()
        user = User(first_name=data["first_name"], last_name=data["last_name"], name=data["name"], email=data["email"], password=hashed, role=UserRole(data["role"]))
        session.add(user)
        # If role is user, create a Patient row with same UUID
        session.flush()
        if user.role == UserRole.user:
            patient = Patient(id=user.id, first_name=user.first_name, last_name=user.last_name, name=user.name, contact=data.get("contact",""), dob=data.get("dob","2000-01-01"))
            session.add(patient)
        session.commit()
        token = generate_jwt(user.id, user.role.value)
        return jsonify({"token": token, "user": {"id": str(user.id), "email": user.email, "role": user.role.value}})

# User login endpoint - authenticates user and returns JWT token
@bp.post("/login")
def login():
    data = request.get_json() or {}
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.email == data.get("email")))
        if not user:
            return jsonify({"error":"Invalid credentials"}), 401
        if not bcrypt.check_password_hash(user.password, data.get("password","")):
            return jsonify({"error":"Invalid credentials"}), 401
        token = generate_jwt(user.id, user.role.value)
        return jsonify({"token": token, "user": {"id": str(user.id), "email": user.email, "role": user.role.value}})
