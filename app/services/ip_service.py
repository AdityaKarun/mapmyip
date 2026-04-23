import os

import ipinfo
from dotenv import load_dotenv

from ..queries import ip_queries

# Load environment variables
load_dotenv()

ACCESS_TOKEN = os.getenv("IPINFO_TOKEN")

# Fail fast if token is missing
if not ACCESS_TOKEN:
    raise ValueError("IPINFO_TOKEN not set in environment variables")

# Initialised handler once at module load so the same HTTP session is reused across requests
handler = ipinfo.getHandler(ACCESS_TOKEN)

def serialize_ip(record):
    """
    Convert a database record into a frontend-friendly dictionary.

    Ensures missing values are replaced with user-friendly defaults.
    """
    return {
        "ip": record.ip,
        "hostname": record.hostname or "Unknown",
        "latitude": record.latitude,
        "longitude": record.longitude,
        "city": record.city or "Unknown",
        "region": record.region or "Unknown",
        "country": record.country or "Unknown",
        "org": record.org or "Unknown",
        "timezone": record.timezone or "Unknown",
        "country_name": record.country_name or "Unknown",
        "country_flag_url": record.country_flag_url or ""
    }

def fetch_from_ipinfo_api(ip=None):
    """
    Fetch IP details from IPInfo API and normalize the response.

    Handles invalid or empty responses and returns structured data.
    """

    try:
        ip_details = handler.getDetails(ip)
        ip_data = ip_details.all

        # Guard: ensure response contains valid IP data
        if not ip_data or not ip_data.get("ip"):
            print(f"[API ERROR][fetch_from_ipinfo_api] Empty response for IP {ip}")
            return None

        # Normalize API response into consistent structure
        return {
            "ip": ip_data.get("ip"),
            "hostname": ip_data.get("hostname") or "Unknown",
            "latitude": ip_data.get("latitude"),
            "longitude": ip_data.get("longitude"),
            "city": ip_data.get("city") or "Unknown",
            "region": ip_data.get("region") or "Unknown",
            "country": ip_data.get("country") or "Unknown",
            "org": ip_data.get("org") or "Unknown",
            "timezone": ip_data.get("timezone") or "Unknown",
            "country_name": ip_data.get("country_name") or "Unknown",
            "country_flag_url": ip_data.get("country_flag_url") or ""
        }
    
    except Exception as e:
        # Handle API/network failures gracefully
        print(f"[API ERROR][fetch_from_ipinfo_api] Failed for IP {ip}: {e}")
        return None

def get_ip_data(ip=None):
    """
    Retrieve IP data using a read-through cache.

    Checks DB first for a given IP, otherwise fetches from API,
    stores the result, and returns a normalized response.
    """

    # If IP is provided, try cache first
    if ip:
        # Attempt to retrieve cached record from DB
        db_data = ip_queries.find_ip_record(ip)

        if db_data:
            # Return normalized DB record
            return serialize_ip(db_data)
        
        # Cache miss, fetch from API
        api_data = fetch_from_ipinfo_api(ip)

        if not api_data or not api_data.get("ip"):
            return {
                "error": True,
                "message": "Failed to fetch IP information"
            }

    # If no IP, resolve public IP via API (localhost case)    
    else:
        api_data = fetch_from_ipinfo_api()

        if not api_data or not api_data.get("ip"):
            return {
                "error": True,
                "message": "Failed to fetch IP information"
            }
        
        # Capture resolved IP from API response
        ip = api_data.get("ip")
    
    # Insert API data into DB
    db_record = ip_queries.insert_ip_record(api_data)

    if db_record:
        # Return normalized DB record
        return serialize_ip(db_record)
    
    # Rare fallback: insert failed and no record found
    print(f"[WARN][get_ip_data] Insert failed for IP {ip}, returning API data")
    return api_data
