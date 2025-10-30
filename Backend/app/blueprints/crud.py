from flask import Blueprint, request, jsonify
from sqlalchemy import select, func
from ..extensions import SessionLocal
from ..models.models import User, Patient, Location, CaseRecord, Vaccination, StateStat, UserRole
from ..utils.auth import require_auth
import uuid

bp = Blueprint("crud", __name__, url_prefix="/api")

# Generic helpers

def to_dict(obj):
    d = {c.key: getattr(obj, c.key) for c in obj.__table__.columns}
    for k,v in d.items():
        if isinstance(v, uuid.UUID):
            d[k] = str(v)
    return d

# Users (admin only)
@bp.get("/users")
@require_auth(["admin"])
def list_users():
    with SessionLocal() as s:
        rows = s.scalars(select(User)).all()
        return jsonify([to_dict(r) for r in rows])

@bp.post("/users")
@require_auth(["admin"])
def create_user():
    from ..extensions import bcrypt
    data = request.get_json() or {}
    
    # Add validation for required fields
    required_fields = ["first_name", "last_name", "name", "email", "password", "role"]
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

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

@bp.put("/users/<uuid:uid>")
@require_auth(["admin"])
def update_user(uid):
    from ..extensions import bcrypt
    data = request.get_json() or {}
    with SessionLocal() as s:
        row = s.get(User, uid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        if "password" in data:
            data["password"] = bcrypt.generate_password_hash(data["password"]).decode()
        for k,v in data.items():
            setattr(row, k, v)
        s.commit()
        return jsonify(to_dict(row))

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

# Patients
@bp.get("/patients")
@require_auth(["admin"])  # admins list all; patients can fetch self via /me

def list_patients():
    with SessionLocal() as s:
        rows = s.scalars(select(Patient)).all()
        return jsonify([to_dict(r) for r in rows])

@bp.get("/patients/<uuid:pid>")
@require_auth(["admin"])
def get_patient(pid):
    with SessionLocal() as s:
        row = s.get(Patient, pid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        return jsonify(to_dict(row))

@bp.get("/patients/me")
@require_auth(["user","admin"])
def get_my_patient():
    user_id = request.user.get("sub")
    with SessionLocal() as s:
        row = s.get(Patient, uuid.UUID(user_id))
        if not row:
            return jsonify({"error":"Not found"}), 404
        return jsonify(to_dict(row))

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

# Locations
@bp.get("/locations")
@require_auth(["admin","user"])
def list_locations():
    with SessionLocal() as s:
        rows = s.scalars(select(Location)).all()
        return jsonify([to_dict(r) for r in rows])

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

# Case Records
@bp.get("/case-records")
@require_auth(["admin"])
def list_cases():
    with SessionLocal() as s:
        rows = s.scalars(select(CaseRecord)).all()
        return jsonify([to_dict(r) for r in rows])

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

# Vaccinations
@bp.get("/vaccinations")
@require_auth(["admin"])
def list_vax():
    with SessionLocal() as s:
        rows = s.scalars(select(Vaccination)).all()
        return jsonify([to_dict(r) for r in rows])

@bp.post("/vaccinations")
@require_auth(["admin"])
def create_vax():
    data = request.get_json() or {}
    with SessionLocal() as s:
        row = Vaccination(**data)
        s.add(row)
        s.commit()
        s.refresh(row)
        return jsonify(to_dict(row)), 201

@bp.put("/vaccinations/<uuid:rid>")
@require_auth(["admin"])
def update_vax(rid):
    data = request.get_json() or {}
    with SessionLocal() as s:
        row = s.get(Vaccination, rid)
        if not row:
            return jsonify({"error":"Not found"}), 404
        for k,v in data.items():
            setattr(row, k, v)
        s.commit()
        return jsonify(to_dict(row))

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

# Admin metrics
@bp.get("/admin/metrics")
@require_auth(["admin"])
def admin_metrics():
    with SessionLocal() as s:
        total_patients = s.scalar(select(func.count(Patient.id))) or 0
        total_vax = s.scalar(select(func.count(Vaccination.id))) or 0
        active = s.scalar(select(func.count()).select_from(CaseRecord).where(CaseRecord.status=="active")) or 0
        recovered = s.scalar(select(func.count()).select_from(CaseRecord).where(CaseRecord.status=="recovered")) or 0
        deaths = s.scalar(select(func.count()).select_from(CaseRecord).where(CaseRecord.status=="death")) or 0
        return jsonify({
            "patients": int(total_patients),
            "vaccinations": int(total_vax),
            "active": int(active),
            "recovered": int(recovered),
            "deaths": int(deaths)
        })
