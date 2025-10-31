# Notifications blueprint - handles patient and admin notification endpoints
from flask import Blueprint, request, jsonify
from sqlalchemy import select
from datetime import date, timedelta
import uuid
from ..extensions import SessionLocal
from ..utils.auth import require_auth
from ..models.models import CaseRecord, Vaccination, Patient

# Create blueprint for notification routes
bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


# Get current user's notifications - vaccination due and retest reminders
@bp.get("/me")
@require_auth(["user","admin"])
def my_notifications():
    user_id = uuid.UUID(request.user.get("sub"))
    today = date.today()
    messages: list[dict] = []
    with SessionLocal() as s:
        # Vaccination due: if exactly 1 dose, second due in 6 months. Notify if within 7 days window or overdue.
        first = s.scalars(
            select(Vaccination).where(Vaccination.patient_id == user_id).order_by(Vaccination.date.asc())
        ).all()
        if len(first) == 1:
            first_date = first[0].date
            due_date = first_date + timedelta(days=180)
            if today >= due_date - timedelta(days=7):
                status = "overdue" if today > due_date else "due_soon"
                messages.append({
                    "type": "vaccination_due",
                    "title": "Second dose due",
                    "message": f"Your second COVID-19 dose is {status.replace('_',' ')} on {due_date.isoformat()}.",
                    "due_date": due_date.isoformat(),
                })

        # Active case retest reminder: 15 days after diagnosis
        active = s.scalars(
            select(CaseRecord).where(CaseRecord.patient_id == user_id).order_by(CaseRecord.diag_date.desc())
        ).first()
        if active and active.status == "active":
            retest_date = active.diag_date + timedelta(days=15)
            if today >= retest_date - timedelta(days=7):
                messages.append({
                    "type": "retest_reminder",
                    "title": "Retest recommended",
                    "message": f"Please get tested again on {retest_date.isoformat()} (15 days from diagnosis).",
                    "retest_date": retest_date.isoformat(),
                })

    return jsonify({"notifications": messages})


# Get all patients with due notifications - admin only
@bp.get("/admin/due")
@require_auth(["admin"])
def admin_due_notifications():
    today = date.today()
    results: list[dict] = []
    with SessionLocal() as s:
        patients = s.scalars(select(Patient)).all()
        for p in patients:
            user_id = p.id
            # Vaccination due
            vax = s.scalars(select(Vaccination).where(Vaccination.patient_id == user_id).order_by(Vaccination.date.asc())).all()
            if len(vax) == 1:
                due_date = vax[0].date + timedelta(days=180)
                if today >= due_date - timedelta(days=7):
                    results.append({
                        "patient_id": str(user_id),
                        "type": "vaccination_due",
                        "due_date": due_date.isoformat(),
                    })
            # Retest reminder
            cr = s.scalars(select(CaseRecord).where(CaseRecord.patient_id == user_id).order_by(CaseRecord.diag_date.desc())).first()
            if cr and cr.status == "active":
                retest_date = cr.diag_date + timedelta(days=15)
                if today >= retest_date - timedelta(days=7):
                    results.append({
                        "patient_id": str(user_id),
                        "type": "retest_reminder",
                        "retest_date": retest_date.isoformat(),
                    })
    return jsonify({"items": results})


