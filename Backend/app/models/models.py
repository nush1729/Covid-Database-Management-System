# SQLAlchemy database models for COVID-19 DBMS
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Date, Integer, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from ..extensions import Base
import enum

# User roles enum - defines access levels
class UserRole(str, enum.Enum):
    admin = "admin"  # Full access
    user = "user"  # Patient role
    manager = "manager"  # Partial admin access

# User table - stores authentication and user information
class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)  # Hashed with bcrypt
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), default=UserRole.user, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

# Patient table - stores patient-specific information
class Patient(Base):
    __tablename__ = "patients"
    # Patient ID should equal user ID for role 'user' - links to users table
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    contact: Mapped[str] = mapped_column(String, nullable=False)
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

# Location table - stores hospital/clinic locations across India
class Location(Base):
    __tablename__ = "locations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    street: Mapped[str] = mapped_column(String, nullable=False)
    zip: Mapped[str] = mapped_column(String, nullable=False)
    state: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

# Case record table - tracks COVID-19 case records for patients
class CaseRecord(Base):
    __tablename__ = "case_records"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    location_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    diag_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    # Database constraint - status must be one of these values
    __table_args__ = (
        CheckConstraint("status IN ('active','recovered','death')", name="status_check"),
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

# Vaccination table - tracks patient vaccination records
class Vaccination(Base):
    __tablename__ = "vaccinations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    # Vaccine type enum - defines available vaccine types
    class VaccineType(str, enum.Enum):
        covaxin = "covaxin"
        covishield = "covishield"
        sputnik = "sputnik"

    # Store as text with DB-level check constraint; keep Python enum for clarity
    vaccine_type: Mapped[str] = mapped_column(String, nullable=False)
    # Database constraint - vaccine type must be one of the allowed values
    __table_args__ = (
        CheckConstraint("vaccine_type IN ('covaxin','covishield','sputnik')", name="vaccine_type_check"),
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

# State statistics table - stores aggregated COVID-19 statistics per state
class StateStat(Base):
    __tablename__ = "state_stats"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    state: Mapped[str] = mapped_column(String, nullable=False)
    confirmed: Mapped[int] = mapped_column(Integer, default=0)
    recovered: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[int] = mapped_column(Integer, default=0)
    deaths: Mapped[int] = mapped_column(Integer, default=0)
    managed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))  # Optional admin/manager assignment
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
