import os

from flask import Flask
from dotenv import load_dotenv

from .routes import main
from .extensions import db

def create_app():
    """
    Application factory — builds and configures the Flask app instance.

    - Loads environment variables from `.env`
    - Sets up database configuration and binds SQLAlchemy to the app
    - Registers blueprints (routes)

    Using a factory function avoids global app state and allows
    flexible configurations (e.g., development, testing, production).
    """
    load_dotenv()

    app = Flask(__name__)

    # Configure database connection from environment
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"pool_pre_ping": True}

    # Bind SQLAlchemy instance to this app
    db.init_app(app)

    # Register routes/blueprints
    app.register_blueprint(main)

    # Ensure tables are created (if they don't exist already) before handling any requests
    with app.app_context():
        db.create_all()

    return app
