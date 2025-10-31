# Flask application factory and main entry point
from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .extensions import bcrypt
from .blueprints.auth import bp as auth_bp
from .blueprints.crud import bp as crud_bp
from .services.predict import bp as predict_bp
from .blueprints.notifications import bp as notif_bp


# Application factory pattern - creates and configures Flask app
def create_app():
    app = Flask(__name__)
    # Load configuration from Config class
    app.config.from_object(Config)
    # Enable CORS for API routes
    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}})
    # Initialize bcrypt for password hashing
    bcrypt.init_app(app)

    # Register all blueprints (route modules)
    app.register_blueprint(auth_bp)  # Authentication endpoints
    app.register_blueprint(crud_bp)  # CRUD operations
    app.register_blueprint(predict_bp)  # Prediction endpoints
    app.register_blueprint(notif_bp)  # Notification endpoints

    # Health check endpoint
    @app.get("/api/health")
    def health():
        return jsonify({"ok": True})

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
