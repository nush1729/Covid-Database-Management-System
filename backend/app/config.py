import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a9f8c2d17b3fb9c0e48f3a2d74b5c9e6') # Flask secret key
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://covid_user:Molu1212@localhost:5432/covid_db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f890abcdef1234567890fedcba0987654321') 