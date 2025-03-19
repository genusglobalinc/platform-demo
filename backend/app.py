from flask import Flask
from routes.users import users_bp
from routes.posts import posts_bp
from routes.events import events_bp
from routes.auth_routes import auth_bp

app = Flask(__name__)

# Register Blueprints (Modular Routes)
app.register_blueprint(users_bp, url_prefix="/users")
app.register_blueprint(posts_bp, url_prefix="/posts")
app.register_blueprint(events_bp, url_prefix="/events")
app.register_blueprint(auth_bp, url_prefix="/auth")

if __name__ == "__main__":
    app.run(debug=True)
