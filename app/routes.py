from flask import Blueprint, render_template, request, jsonify
from .services.ip_service import get_data_from_ip

main = Blueprint("main", __name__)

@main.route("/")
def home():
    return render_template("index.html")

@main.route("/ip-details")
def get_ip_details():
    x_forwarded = request.headers.get("X-Forwarded-For")

    if x_forwarded:
        ip = x_forwarded.split(',')[0].strip()
    else:
        ip = request.remote_addr

    data = get_data_from_ip(ip)
    return jsonify(data)
