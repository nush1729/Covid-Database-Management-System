# Database and security extensions - initialized once and reused
from flask_bcrypt import Bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, scoped_session
from .config import Config

# Bcrypt instance for password hashing
bcrypt = Bcrypt()
# SQLAlchemy database engine with connection pooling
engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
# Thread-safe database session factory
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False))

# Base class for all SQLAlchemy models
class Base(DeclarativeBase):
    pass
