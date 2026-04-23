from .extensions import db

class IPDetails(db.Model):
    """
    Stores cached IP geolocation and network information.

    Used as a read-through cache to reduce external API calls and improve
    response performance. Each record represents a unique IP with associated
    location, network, and timezone details used by the application.
    """
    __tablename__ = "ip_details"

    id = db.Column(db.Integer, primary_key=True)

    # Core
    ip = db.Column(db.String(45), unique=True, nullable=False, index=True)
    hostname = db.Column(db.String(255))

    # Location
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    city = db.Column(db.String(100))
    region = db.Column(db.String(100))
    country = db.Column(db.String(10))
    country_name = db.Column(db.String(100))

    # Network
    org = db.Column(db.String(255))
    timezone = db.Column(db.String(50))

    # Flag URL
    country_flag_url = db.Column(db.Text)

    # Metadata
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
