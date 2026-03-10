from flask import Flask
from .routes import main

def create_app():
    """
    Application factory — creates and configures the Flask app.
    Using a factory function (rather than a module-level app instance)
    makes it easier to run multiple configs e.g. testing vs production.
    """
    app = Flask(__name__)

    app.register_blueprint(main)

    return app
