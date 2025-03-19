from flask import Blueprint, jsonify

events_bp = Blueprint("events", __name__)

@events_bp.route("/", methods=["GET"])
def get_events():
    return jsonify({"message": "All test events"})
