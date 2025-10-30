from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .extensions import bcrypt
from .blueprints.auth import bp as auth_bp
from .blueprints.crud import bp as crud_bp
from .services.predict import bp as predict_bp
from .blueprints.notifications import bp as notif_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}})
    bcrypt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(crud_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(notif_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True})

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
