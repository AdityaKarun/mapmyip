from flask import Blueprint, render_template, request, jsonify
from .services.ip_service import get_data_from_ip

main = Blueprint("main", __name__)

@main.route("/")
def home():
    """Render the main single-page interface."""
    return render_template("index.html")

@main.route("/ip-details")
def get_ip_details():
    """
    Resolve the real client IP and return geolocation data as JSON.

    Checks X-Forwarded-For first since the app may sit behind a proxy
    or load balancer. That header can be a comma-separated chain
    (client, proxy1, proxy2...), so only the first entry is used.
    Falls back to remote_addr for direct connections (e.g. local dev).
    """
    x_forwarded = request.headers.get("X-Forwarded-For")

    if x_forwarded:
        ip = x_forwarded.split(',')[0].strip()
    else:
        ip = request.remote_addr

    data = get_data_from_ip(ip)
    return jsonify(data)
