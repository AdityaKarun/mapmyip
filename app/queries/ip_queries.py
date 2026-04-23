from sqlalchemy.exc import IntegrityError

from ..extensions import db
from ..models import IPDetails

def find_ip_record(ip):
    """
    Retrieve a cached IP record from the database.

    Performs a simple lookup using the IP as a unique key.
    Used as the "read" part of the caching mechanism.
    """
    
    # Query DB for existing record with given IP
    return IPDetails.query.filter_by(ip=ip).first()

def insert_ip_record(ip_data):
    """
    Insert a new IP record into the database.

    Acts as the "write" part of the caching layer. Attempts to insert
    data fetched from the external API. If a duplicate insert occurs
    (e.g., concurrent requests), it handles the error and fetches the
    existing record instead.
    """

    # Extract IP from incoming data
    ip = ip_data.get("ip")

    # Guard: skip insert if IP is missing
    if not ip:
        print("[DB ERROR][insert_ip_record] Missing IP, skipping insert")
        return None
    
    try:
        # Create ORM object from API data
        ip_record = IPDetails(
            ip=ip,
            hostname=ip_data.get("hostname"),
            latitude=ip_data.get("latitude"),
            longitude=ip_data.get("longitude"),
            city=ip_data.get("city"),
            region=ip_data.get("region"),
            country=ip_data.get("country"),
            country_name=ip_data.get("country_name"),
            org=ip_data.get("org"),
            timezone=ip_data.get("timezone"),
            country_flag_url=ip_data.get("country_flag_url")
        )

        # Add record to session
        db.session.add(ip_record)

        # Commit transaction to persist data
        db.session.commit()

        # Return inserted record
        return ip_record

    except IntegrityError as e:
        # Rollback to reset session after failure
        db.session.rollback()

        print(f"[DB ERROR][insert_ip_record] IntegrityError for IP {ip}: {e}")

        # Fetch existing record (handles race condition)
        return find_ip_record(ip)
    