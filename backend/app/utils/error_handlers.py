# backend/app/utils/error_handlers.py

from flask import jsonify
from marshmallow import ValidationError

def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({"error": error.messages}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500
