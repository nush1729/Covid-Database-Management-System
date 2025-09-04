# backend/app/routes/analytics.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.dashboard.analytics import (
    get_state_totals,
    get_national_total,
    get_cases_time_series
)

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard/state-totals', methods=['GET'])
@jwt_required()
def state_totals():
    return jsonify(get_state_totals())

@analytics_bp.route('/dashboard/national-total', methods=['GET'])
@jwt_required()
def national_total():
    return jsonify(get_national_total())

@analytics_bp.route('/dashboard/cases-time-series', methods=['GET'])
@jwt_required()
def cases_time_series():
    state = request.args.get('state')
    return jsonify(get_cases_time_series(state=state))
