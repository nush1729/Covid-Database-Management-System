import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/postgres")
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
    BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    PREDICT_CSV_PATH = os.getenv(
        "PREDICT_CSV_PATH",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "statestats.csv")),
    )
