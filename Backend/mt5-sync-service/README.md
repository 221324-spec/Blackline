# MT5 Sync Service

A FastAPI microservice to connect to MetaTrader 5, fetch trade history, and provide it to the main backend for automated trade entry.

## Features
- Connects to user-supplied MT5 account (login, password, server)
- Fetches all trade history (deals grouped by position)
- Returns clean trade data (symbol, volume, open/close price, profit, times)
- Exposes `/sync_trades` API for backend to call
- Supports multiple users/accounts (each call is independent)

## Setup

### Prerequisites
- Python 3.8+
- MetaTrader5 Python package
- MetaTrader 5 terminal installed (Windows)

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure `.env` (optional):
```
MT5_PATH=C:\Program Files\MetaTrader 5\terminal64.exe
MT5_SERVER=MetaQuotes-Demo
```

### Running the Service
```bash
python main.py
```

## API Usage

### POST /sync_trades
Fetches all trades for a given MT5 account.

**Request Body:**
```json
{
  "login": 12345678,
  "password": "your_password",
  "server": "MetaQuotes-Demo"
}
```

**Response:**
```json
[
  {
    "position_id": 12345,
    "symbol": "EURUSD",
    "volume": 0.1,
    "open_price": 1.12345,
    "close_price": 1.12400,
    "trade_type": "BUY",
    "profit": 5.50,
    "open_time": 1700000000,
    "close_time": 1700003600
  },
  ...
]
```

### GET /health
Check service health.

## Integration Plan
- Main backend will POST user credentials to `/sync_trades`
- Service returns all trades for that user
- Backend stores/syncs trades in DB, links to user
- Frontend allows user to choose manual or automated (MT5) entry
- Multiple users can sync in parallel (stateless API)

## Security Note
- Credentials are never stored, only used for session
- Use HTTPS in production

## Multi-User Support
- Each sync is independent; no blocking or waiting
- Multiple users can sync at the same time

---

This service keeps all MT5 logic in Python, and only exposes a simple API for the backend to use. React/Frontend never talks to Python directly.