from flask import Blueprint, jsonify

posts_bp = Blueprint("posts", __name__)

@posts_bp.route("/", methods=["GET"])
def get_posts():
    return jsonify({"message": "All posts"})
