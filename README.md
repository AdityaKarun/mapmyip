# MapMyIP

MapMyIP is a modern, full-stack web application that detects your public IP address and visualizes your approximate geographic location on an interactive map. Built with Flask and Leaflet.js, it combines a powerful backend with a beautifully designed responsive frontend that works seamlessly on desktop and mobile devices.

## 📖 Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

- **IP Detection**: Automatically detects visitor's IP, handling proxies and load balancers
- **Interactive Mapping**: Real-time geolocation visualization using Leaflet.js and OpenStreetMap
- **Detailed Information**: City, region, country, timezone, ISP/ASN, and coordinates
- **Responsive Design**: Desktop sidebar layout and mobile bottom sheet interface
- **Dark/Light Theme**: Automatic OS detection with manual toggle support
- **Performance**: Skeleton loading states, optimized API session reuse, smooth animations
- **Transparency**: Includes disclaimers about IP geolocation accuracy and VPN/proxy usage

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│         User's Browser (Client)             │
│  ┌───────────────────────────────────────┐  │
│  │ index.html + style.css + script.js    │  │
│  └──────────────┬────────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │ fetch('/ip-details')
                  ▼
┌─────────────────────────────────────────────┐
│       Flask Application (Backend)           │
│  ┌───────────────────────────────────────┐  │
│  │ routes.py - GET /ip-details           │  │
│  │  • Detects client IP                  │  │
│  │  • Calls ip_service.get_data_from_ip()│  │
│  │  • Returns JSON response              │  │
│  └──────────────┬────────────────────────┘  │
│  ┌──────────────┴────────────────────────┐  │
│  │ services/ip_service.py                │  │
│  │  • IPInfo API integration             │  │
│  │  • Data normalization                 │  │
│  │  • Error handling                     │  │
│  └───────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │ IPInfo API response
                  ▼
┌─────────────────────────────────────────────┐
│         IPInfo API (External Service)       │
|  ┌───────────────────────────────────────┐  |
│  │  • IP geolocation database lookups    │  │
│  │  • Returns IP, location, ISP, timezone│  │
|  └───────────────────────────────────────┘  |
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript |
| **Backend** | Python 3, Flask |
| **API** | IPInfo |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- IPInfo API token (free tier: [ipinfo.io](https://ipinfo.io))

### Setup

```bash
# Clone the repository
git clone https://github.com/AdityaKarun/mapmyip.git
cd mapmyip

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your IPInfo token

# Run the application
python run.py

# Open http://localhost:5000 in your browser
```

---

## ⚙️ Configuration

### Getting an IPInfo API Token

1. Visit [ipinfo.io](https://ipinfo.io)
2. Sign up for a free account (10,000 API calls/month)
3. Copy your API token from the dashboard
4. Add it to your `.env` file:

```bash
IPINFO_TOKEN=your_token_here
```

---

## 📂 Project Structure

```
mapmyip/
│
├── app/
│   ├── __init__.py              # App factory
│   ├── routes.py                # API endpoints
│   ├── services/
│   │   └── ip_service.py        # IPInfo integration
│   ├── static/
|   |   |── favicon.svg          # Favicon image
│   │   ├── css/
│   │   │   └── style.css        # Responsive styles & themes
│   │   └── js/
│   │       └── script.js        # Interactive features
│   └── templates/
│       └── index.html           # Main template
│
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── LICENSE                      # Project license
├── Procfile                     # Deployment configuration
├── README.md                    # Project documentation
├── requirements.txt             # Python dependencies
└── run.py                       # Entry point
```

---

## 🤝 Contributing

Contributions are welcome! Fork the repository, create a feature branch, make your changes, and submit a pull request.

---

## 📄 License

This project is open source and available under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">Made with ❤️ by Aditya Karun</div>