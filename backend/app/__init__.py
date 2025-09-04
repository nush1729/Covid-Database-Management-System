from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS

db = SQLAlchemy()
ma = Marshmallow()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')

    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    CORS(app)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.patients import patient_bp
    from app.routes.cases import case_bp
    from app.routes.vaccinations import vaccination_bp
    from app.routes.locations import location_bp
    from app.routes.statestats import statestats_bp
    from app.routes.csv_import import csv_import_bp
    from app.routes.analytics import analytics_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patient_bp, url_prefix='/api/patients')
    app.register_blueprint(case_bp, url_prefix='/api/cases')
    app.register_blueprint(vaccination_bp, url_prefix='/api/vaccinations')
    app.register_blueprint(location_bp, url_prefix='/api/locations')
    app.register_blueprint(statestats_bp, url_prefix='/api/statestats')
    app.register_blueprint(csv_import_bp, url_prefix='/api/csv')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

    from app.utils.error_handlers import register_error_handlers
    register_error_handlers(app)

    return app
