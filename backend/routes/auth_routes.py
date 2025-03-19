from flask import Blueprint, request, jsonify
from auth import signup_user, login_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    response = signup_user(data["username"], data["password"], data["email"])
    return jsonify(response)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    token = login_user(data["username"], data["password"])
    return jsonify({"token": token})
