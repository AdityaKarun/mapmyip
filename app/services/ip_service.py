import os
import ipinfo
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ACCESS_TOKEN = os.getenv("IPINFO_TOKEN")

if not ACCESS_TOKEN:
    raise ValueError("IPINFO_TOKEN not set in environment variables")

# Initialised handler once at module load so the same HTTP session is reused across requests
handler = ipinfo.getHandler(ACCESS_TOKEN)

def get_data_from_ip(ip):
    """
    Fetch geolocation, network and timezone details
    from IPInfo and return a normalized dictionary.
    """
    try:
        details = handler.getDetails(ip)
        data = details.all

        return {
            "ip": data.get("ip") or ip,
            "hostname": data.get("hostname") or "N/A",
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "city": data.get("city") or "Unknown",
            "region": data.get("region") or "Unknown",
            "country": data.get("country") or "Unknown",
            "org": data.get("org") or "Unknown",
            "timezone": data.get("timezone") or "Unknown",
            "country_name": data.get("country_name") or "Unknown",
            "country_flag_url": data.get("country_flag_url") or ""
        }
    except Exception:
        # Catches network errors, timeouts, invalid IP responses, etc
        return {
            "error": True,
            "message": "Failed to fetch IP information"
        }
