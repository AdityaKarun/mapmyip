import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

from .routes import main

db = SQLAlchemy()

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

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    app.register_blueprint(main)

    return app
