import click
from flask import Flask
from .app import create_app
from .extensions import SessionLocal
from .models.models import User, Patient, Location, CaseRecord, Vaccination, UserRole
from datetime import date, timedelta
import uuid
from sqlalchemy import select

app = create_app()

@app.cli.command("count")
def count():
    """Show quick counts of tables."""
    from sqlalchemy import select, func
    with SessionLocal() as s:
        from .models.models import User, Patient, Location, CaseRecord, Vaccination
        print("Users:", s.scalar(select(func.count(User.id))))
        print("Patients:", s.scalar(select(func.count(Patient.id))))
        print("Locations:", s.scalar(select(func.count(Location.id))))
        print("CaseRecords:", s.scalar(select(func.count(CaseRecord.id))))
        print("Vaccinations:", s.scalar(select(func.count(Vaccination.id))))


@app.cli.command("seed")
def seed():
    """Insert demo Indian data: 10 users, locations, cases, vaccinations.

    Note: Admin user is seeded via SQL in schema.sql; not created here.
    """
    from sqlalchemy import select
    from .extensions import bcrypt
    with SessionLocal() as s:
        # Admin is seeded in SQL migration; skip creating here
        # Users and linked patients
        indian_names = [
            ("Aarav","Sharma"),("Vihaan","Verma"),("Isha","Iyer"),("Ananya","Nair"),
            ("Kabir","Singh"),("Riya","Gupta"),("Advait","Kulkarni"),("Diya","Patel"),
            ("Arjun","Reddy"),("Meera","Chopra")
        ]
        base_date = date(1995,1,1)
        for idx,(fn,ln) in enumerate(indian_names, start=1):
            email = f"{fn.lower()}.{ln.lower()}@mail.in"
            user = s.scalar(select(User).where(User.email == email))
            if not user:
                user = User(
                    first_name=fn,
                    last_name=ln,
                    name=f"{fn} {ln}",
                    email=email,
                    password=bcrypt.generate_password_hash("User@123").decode(),
                    role=UserRole.user,
                )
                s.add(user)
                s.flush()
                patient = Patient(
                    id=user.id,
                    first_name=fn,
                    last_name=ln,
                    name=f"{fn} {ln}",
                    contact=f"98{idx:08d}",
                    dob=base_date + timedelta(days=idx*250),
                )
                s.add(patient)
        # Locations across India
        locs = [
            ("AIIMS Delhi","Ansari Nagar, New Delhi","Aurobindo Marg","110029","Delhi"),
            ("Apollo Mumbai","Navi Mumbai","Belapur Road","400614","Maharashtra"),
            ("Fortis Bengaluru","Bengaluru","Bannerghatta Road","560076","Karnataka"),
            ("CMC Vellore","Vellore","IDA Scudder Rd","632004","Tamil Nadu"),
            ("PGIMER Chandigarh","Chandigarh","Sector 12","160012","Chandigarh"),
            ("Apollo Ahmedabad","Ahmedabad","Bhat GIDC","382428","Gujarat"),
            ("KIMS Hyderabad","Hyderabad","Secunderabad","500003","Telangana"),
            ("IMS Bhubaneswar","Bhubaneswar","Dumduma","751019","Odisha"),
            ("NRS Kolkata","Kolkata","AJC Bose Rd","700014","West Bengal"),
            ("SCTIMST Trivandrum","Thiruvananthapuram","Poojappura","695012","Kerala"),
        ]
        for name,addr,street,zipc,state in locs:
            if not s.scalar(select(Location).where(Location.name==name)):
                s.add(Location(name=name, address=addr, street=street, zip=zipc, state=state))
        s.commit()

        # Simple case and vaccination entries for each patient
        from random import choice
        statuses = ["active","recovered","death"]
        vaccines = [Vaccination.VaccineType.covaxin, Vaccination.VaccineType.covishield, Vaccination.VaccineType.sputnik]
        all_locs = s.scalars(select(Location)).all()
        patients = s.scalars(select(Patient)).all()
        today = date.today()
        for p in patients:
            # one case
            if not s.scalar(select(CaseRecord).where(CaseRecord.patient_id==p.id)):
                s.add(CaseRecord(patient_id=p.id, location_id=choice(all_locs).id, diag_date=today - timedelta(days=30), status=choice(statuses)))
            # one or two vaccinations
            if not s.scalar(select(Vaccination).where(Vaccination.patient_id==p.id)):
                first_date = today - timedelta(days=200)
                first_vax_type = choice(vaccines)
                s.add(Vaccination(patient_id=p.id, date=first_date, vaccine_type=first_vax_type))
                # randomly add second dose - MUST use same vaccine type as first dose
                if idx % 2 == 0:
                    s.add(Vaccination(patient_id=p.id, date=first_date + timedelta(days=30), vaccine_type=first_vax_type))
        s.commit()
        print("Seed complete. Admin user is managed via schema.sql migration.")
