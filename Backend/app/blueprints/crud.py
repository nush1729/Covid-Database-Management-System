# Flask and SQLAlchemy imports
from flask import Blueprint, request, jsonify
from sqlalchemy import select, func
from ..extensions import SessionLocal
from ..models.models import User, Patient, Location, CaseRecord, Vaccination, StateStat, UserRole
from ..utils.auth import require_auth
import uuid
import re

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

# Flask blueprint for CRUD operations with /api prefix
bp = Blueprint("crud", __name__, url_prefix="/api")

# Generic helpers

# Convert SQLAlchemy model to dictionary, removing sensitive fields
def to_dict(obj):
    d = {c.key: getattr(obj, c.key) for c in obj.__table__.columns}
    # Convert UUID to string for JSON serialization
    for k, v in d.items():
        if isinstance(v, uuid.UUID):
            d[k] = str(v)
    # Remove password field for security
    if 'password' in d:
        d.pop('password')
    return d

# User Management Endpoints

# Get all users - accessible by admin and manager
@bp.get("/users")
@require_auth(["admin", "manager"])
def list_users():
    with SessionLocal() as s:
        rows = s.scalars(select(User)).all()
        return jsonify([to_dict(r) for r in rows])

# Create new user - admin only
@bp.post("/users")
@require_auth(["admin"])
def create_user():
    from ..extensions import bcrypt
    data = request.get_json() or {}
    
    # Add validation for required fields
    required_fields = ["first_name", "last_name", "name", "email", "password", "role"]
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Email validation: must contain @ and end with .in or .com
    email = data.get("email", "")
    email_valid, email_error = validate_email(email)
    if not email_valid:
        return jsonify({"error": email_error}), 400

    # Password validation
    password = data.get("password", "")
    password_valid, password_error = validate_password(password)
    if not password_valid:
        return jsonify({"error": password_error}), 400

    with SessionLocal() as s:
        # Check if email already exists
        if s.scalar(select(User).where(User.email == data["email"])):
            return jsonify({"error": "Email already exists"}), 400
            
        if "password" in data:
            data["password"] = bcrypt.generate_password_hash(data["password"]).decode()

        # Create user
        # Manually create the user object to avoid passing extra fields from the request
        user_data = {
            "first_name": data["first_name"],
            "last_name": data["last_name"],
            "name": data["name"],
            "email": data["email"],
            "password": data["password"],
            "role": data["role"],
        }
        row = User(**user_data)
        s.add(row)
        s.flush()
        
        # Auto-create patient for role 'user' if not exists
        if row.role == UserRole.user and not s.get(Patient, row.id):
            patient_data = {
                "id": row.id,
                "first_name": row.first_name,
                "last_name": row.last_name,
                "name": row.name,
                "contact": data.get("contact", ""),
                "dob": data.get("dob", "2000-01-01")
            }
            s.add(Patient(**patient_data))
            
        s.commit()
        s.refresh(row)
        return jsonify(to_dict(row)), 201

# Update user - admin can update all fields, manager can only update role
@bp.put("/users/<uuid:uid>")
@require_auth(["admin", "manager"])
def update_user(uid):
    from ..extensions import bcrypt
    data = request.get_json() or {}
    current_role = request.user.get("role")
    
    with SessionLocal() as s:
        row = s.get(User, uid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        
        # Managers can only update role field, admins can update everything
        if current_role == "manager":
            if "role" not in data:
                return jsonify({"error": "Managers can only update user roles"}), 403
            # Only allow role updates for managers
            if "role" in data:
                try:
                    row.role = UserRole(data["role"])
                except ValueError:
                    return jsonify({"error": "Invalid role"}), 400
        else:
            # Admin can update everything including password
            if "password" in data:
                # Validate password before hashing
                password_valid, password_error = validate_password(data["password"])
                if not password_valid:
                    return jsonify({"error": password_error}), 400
                data["password"] = bcrypt.generate_password_hash(data["password"]).decode()
            
            # Validate email if being updated
            if "email" in data:
                email_valid, email_error = validate_email(data["email"])
                if not email_valid:
                    return jsonify({"error": email_error}), 400
            for k,v in data.items():
                if k == "role":
                    try:
                        setattr(row, k, UserRole(v))
                    except ValueError:
                        return jsonify({"error": "Invalid role"}), 400
                else:
                    setattr(row, k, v)
        
        s.commit()
        s.refresh(row)
        return jsonify(to_dict(row))

# Delete user - admin only
@bp.delete("/users/<uuid:uid>")
@require_auth(["admin"])
def delete_user(uid):
    with SessionLocal() as s:
        row = s.get(User, uid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        s.delete(row)
        s.commit()
        return jsonify({"ok": True})

# Promote/demote users - change user roles (admin and manager only)
@bp.post("/users/<uuid:uid>/promote")
@require_auth(["admin", "manager"])
def promote_user(uid):
    data = request.get_json() or {}
    target_role = data.get("role", "admin")
    
    if target_role not in ["admin", "user", "manager"]:
        return jsonify({"error": "Invalid role"}), 400
    
    with SessionLocal() as s:
        row = s.get(User, uid)
        if not row:
            return jsonify({"error": "Not found"}), 404
        
        old_role = row.role.value
        row.role = UserRole(target_role)
        
        # Create patient record when demoting admin/manager to user
        if old_role in ["admin", "manager"] and target_role == "user":
            existing_patient = s.get(Patient, row.id)
            if not existing_patient:
                patient = Patient(
                    id=row.id,
                    first_name=row.first_name,
                    last_name=row.last_name,
                    name=row.name,
                    contact="",
                    dob="2000-01-01"
                )
                s.add(patient)
        
        # Remove patient record when promoting user to admin/manager
        if old_role == "user" and target_role in ["admin", "manager"]:
            existing_patient = s.get(Patient, row.id)
            if existing_patient:
                s.delete(existing_patient)
        
        # If demoting admin to manager or manager to admin, no patient record changes needed
        
        s.commit()
        s.refresh(row)
        return jsonify({
            "ok": True,
            "user": to_dict(row),
            "message": f"User role changed from {old_role} to {target_role}"
        })

# Patient Management Endpoints

# List all patients - admin only (patients access their own via /me)
@bp.get("/patients")
@require_auth(["admin"])  # admins list all; patients can fetch self via /me

def list_patients():
    with SessionLocal() as s:
        rows = s.scalars(select(Patient)).all()
        return jsonify([to_dict(r) for r in rows])

# Get specific patient by ID - admin only
@bp.get("/patients/<uuid:pid>")
@require_auth(["admin"])
def get_patient(pid):
    with SessionLocal() as s:
        row = s.get(Patient, pid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        return jsonify(to_dict(row))

# Get current user's patient record - users and admins
@bp.get("/patients/me")
@require_auth(["user","admin"])
def get_my_patient():
    user_id = request.user.get("sub")
    with SessionLocal() as s:
        row = s.get(Patient, uuid.UUID(user_id))
        if not row:
            return jsonify({"error":"Not found"}), 404
        return jsonify(to_dict(row))

# Update current user's patient record - users and admins
@bp.put("/patients/me")
@require_auth(["user","admin"])  # allow patient to update own info
def update_my_patient():
    user_id = request.user.get("sub")
    data = request.get_json() or {}
    with SessionLocal() as s:
        row = s.get(Patient, uuid.UUID(user_id))
        if not row:
            return jsonify({"error":"Not found"}), 404
        for k,v in data.items():
            setattr(row, k, v)
        s.commit()
        return jsonify(to_dict(row))

# Create new patient - admin only
@bp.post("/patients")
@require_auth(["admin"])
def create_patient():
    data = request.get_json() or {}
    with SessionLocal() as s:
        p = Patient(**data)
        s.add(p)
        s.commit()
        s.refresh(p)
        return jsonify(to_dict(p)), 201

# Update patient by ID - admin only
@bp.put("/patients/<uuid:pid>")
@require_auth(["admin"])
def update_patient(pid):
    data = request.get_json() or {}
    with SessionLocal() as s:
        p = s.get(Patient, pid)
        if not p:
            return jsonify({"error":"Not found"}), 404
        for k,v in data.items():
            setattr(p, k, v)
        s.commit()
        return jsonify(to_dict(p))

# Delete patient by ID - admin only
@bp.delete("/patients/<uuid:pid>")
@require_auth(["admin"])
def delete_patient(pid):
    with SessionLocal() as s:
        p = s.get(Patient, pid)
        if not p:
            return jsonify({"error":"Not found"}), 404
        s.delete(p)
        s.commit()
        return jsonify({"ok": True})

# Location Management Endpoints

# List all locations - admin and users can view
@bp.get("/locations")
@require_auth(["admin","user"])
def list_locations():
    with SessionLocal() as s:
        rows = s.scalars(select(Location)).all()
        return jsonify([to_dict(r) for r in rows])

# Create new location - admin only
@bp.post("/locations")
@require_auth(["admin"])
def create_location():
    data = request.get_json() or {}
    with SessionLocal() as s:
        row = Location(**data)
        s.add(row)
        s.commit()
        s.refresh(row)
        return jsonify(to_dict(row)), 201

# Update location by ID - admin only
@bp.put("/locations/<uuid:rid>")
@require_auth(["admin"])
def update_location(rid):
    data = request.get_json() or {}
    with SessionLocal() as s:
        row = s.get(Location, rid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        for k,v in data.items():
            setattr(row, k, v)
        s.commit()
        return jsonify(to_dict(row))

# Delete location by ID - admin only
@bp.delete("/locations/<uuid:rid>")
@require_auth(["admin"])
def delete_location(rid):
    with SessionLocal() as s:
        row = s.get(Location, rid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        s.delete(row)
        s.commit()
        return jsonify({"ok": True})

# Case Record Management Endpoints

# List all case records - admin only
@bp.get("/case-records")
@require_auth(["admin"])
def list_cases():
    with SessionLocal() as s:
        rows = s.scalars(select(CaseRecord)).all()
        return jsonify([to_dict(r) for r in rows])

# Create new case record - admin only
@bp.post("/case-records")
@require_auth(["admin"])
def create_case():
    data = request.get_json() or {}
    with SessionLocal() as s:
        row = CaseRecord(**data)
        s.add(row)
        s.commit()
        s.refresh(row)
        return jsonify(to_dict(row)), 201

# Update case record by ID - admin only
@bp.put("/case-records/<uuid:rid>")
@require_auth(["admin"])
def update_case(rid):
    data = request.get_json() or {}
    with SessionLocal() as s:
        row = s.get(CaseRecord, rid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        for k,v in data.items():
            setattr(row, k, v)
        s.commit()
        return jsonify(to_dict(row))

# Delete case record by ID - admin only
@bp.delete("/case-records/<uuid:rid>")
@require_auth(["admin"])
def delete_case(rid):
    with SessionLocal() as s:
        row = s.get(CaseRecord, rid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        s.delete(row)
        s.commit()
        return jsonify({"ok": True})

# Vaccination Management Endpoints

# List all vaccinations - admin only
@bp.get("/vaccinations")
@require_auth(["admin"])
def list_vax():
    with SessionLocal() as s:
        rows = s.scalars(select(Vaccination)).all()
        return jsonify([to_dict(r) for r in rows])

# Create new vaccination - admin only, enforces same vaccine type for second dose
@bp.post("/vaccinations")
@require_auth(["admin"])
def create_vax():
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    vaccine_type = data.get("vaccine_type")
    
    # Validate required fields
    if not patient_id or not vaccine_type:
        return jsonify({"error": "patient_id and vaccine_type are required"}), 400
    
    with SessionLocal() as s:
        # Check for existing vaccinations to enforce vaccine type consistency
        existing_vax = s.scalars(
            select(Vaccination).where(Vaccination.patient_id == patient_id)
            .order_by(Vaccination.date.asc())
        ).all()
        
        # If this is a second dose, ensure it matches the first dose vaccine type
        if len(existing_vax) >= 1:
            first_vax_type = existing_vax[0].vaccine_type
            if vaccine_type != first_vax_type:
                return jsonify({
                    "error": f"Second dose must be the same vaccine type as first dose ({first_vax_type})"
                }), 400
        
        row = Vaccination(**data)
        s.add(row)
        s.commit()
        s.refresh(row)
        return jsonify(to_dict(row)), 201

# Update vaccination by ID - admin only, enforces vaccine type consistency
@bp.put("/vaccinations/<uuid:rid>")
@require_auth(["admin"])
def update_vax(rid):
    data = request.get_json() or {}
    with SessionLocal() as s:
        row = s.get(Vaccination, rid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        
        # Validate vaccine type consistency when updating
        if "vaccine_type" in data:
            existing_vax = s.scalars(
                select(Vaccination).where(Vaccination.patient_id == row.patient_id)
                .where(Vaccination.id != rid)
                .order_by(Vaccination.date.asc())
            ).all()
            
            if len(existing_vax) > 0:
                first_vax_type = existing_vax[0].vaccine_type
                if data["vaccine_type"] != first_vax_type:
                    return jsonify({
                        "error": f"Vaccine type must match first dose ({first_vax_type})"
                    }), 400
        
        for k,v in data.items():
            setattr(row, k, v)
        s.commit()
        return jsonify(to_dict(row))

# Delete vaccination by ID - admin only
@bp.delete("/vaccinations/<uuid:rid>")
@require_auth(["admin"])
def delete_vax(rid):
    with SessionLocal() as s:
        row = s.get(Vaccination, rid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        s.delete(row)
        s.commit()
        return jsonify({"ok": True})

# Admin Statistics Endpoint

# Get dashboard metrics - admin only
@bp.get("/admin/metrics")
@require_auth(["admin"])
def admin_metrics():
    with SessionLocal() as s:
        # Count total patients
        total_patients = s.scalar(select(func.count(Patient.id))) or 0
        # Count total vaccinations
        total_vax = s.scalar(select(func.count(Vaccination.id))) or 0
        # Count active cases
        active = s.scalar(select(func.count()).select_from(CaseRecord).where(CaseRecord.status=="active")) or 0
        # Count recovered cases
        recovered = s.scalar(select(func.count()).select_from(CaseRecord).where(CaseRecord.status=="recovered")) or 0
        # Count deaths
        deaths = s.scalar(select(func.count()).select_from(CaseRecord).where(CaseRecord.status=="death")) or 0
        return jsonify({
            "patients": int(total_patients),
            "vaccinations": int(total_vax),
            "active": int(active),
            "recovered": int(recovered),
            "deaths": int(deaths)
        })
