from sqlalchemy.exc import IntegrityError

from app import db
from app.models import IPDetails

def get_ip_details(ip):
    return IPDetails.query.filter_by(ip=ip).first()

def insert_ip_details(ip_data):
    try:
        ip_record = IPDetails(
            ip = ip_data.get("ip"),
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

        db.session.add(ip_record)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
    