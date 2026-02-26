# MapMyIP

MapMyIP is a Flask-based web application that estimates a visitor's geographic location using their public IP address and displays it on an interactive map.

## Tech Stack

- Python
- Flask
- IPInfo (IP Geolocation API)
- Leaflet.js + OpenStreetMap
- Git

## Features

- Detects visitor IP on request
- Retrieves approximate geolocation
- Displays location on interactive map
- Clean modular Flask architecture

## Setup (Local)

1. Create and activate virtual environment
2. Install dependencies:
   pip install -r requirements.txt
3. Add IPINFO_TOKEN to .env
4. Run:
   python run.py