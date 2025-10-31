# Application configuration - loads settings from environment variables
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # PostgreSQL database connection string
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/postgres")
    # Connection pool settings - pre-ping to check connection health
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    # Secret key for JWT token signing - should be changed in production
    JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
    # Number of bcrypt rounds for password hashing (higher = more secure but slower)
    BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))
    # Allowed CORS origins for API requests
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    # Path to CSV file containing state statistics for predictions
    PREDICT_CSV_PATH = os.getenv(
        "PREDICT_CSV_PATH",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "statestats.csv")),
    )
