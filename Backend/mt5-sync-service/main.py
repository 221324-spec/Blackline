import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
import MetaTrader5 as mt5
from datetime import datetime, timedelta
from collections import defaultdict

load_dotenv()

app = FastAPI(title="MT5 Sync Service", version="1.0.0")

MT5_PATH = os.getenv("MT5_PATH", r"C:\\Program Files\\MetaTrader 5\\terminal64.exe")
MT5_SERVER = os.getenv("MT5_SERVER", "MetaQuotes-Demo")
MT5_LOGIN = os.getenv("MT5_LOGIN")
MT5_PASSWORD = os.getenv("MT5_PASSWORD")

# Check if MT5 is available
try:
    mt5.initialize()
    mt5_available = True
    mt5.shutdown()
except:
    mt5_available = False

from typing import Optional

class MT5LoginRequest(BaseModel):
    login: Optional[int] = None
    password: Optional[str] = None
    server: Optional[str] = None

class TradeDeal(BaseModel):
    position_id: int
    symbol: str
    volume: float
    open_price: float = None
    close_price: float = None
    trade_type: str = None
    profit: float
    open_time: float = None
    close_time: float = None
    sl: float = None      # <-- add this
    tp: float = None      # <-- and this

class AccountInfo(BaseModel):
    login: int
    balance: float
    equity: float
    margin: float
    free_margin: float
    profit: float

class SyncResponse(BaseModel):
    trades: List[TradeDeal]
    account: AccountInfo

@app.post("/sync_trades", response_model=SyncResponse)
def sync_trades(login_req: MT5LoginRequest):
    login = login_req.login or MT5_LOGIN
    password = login_req.password or MT5_PASSWORD
    server = login_req.server or MT5_SERVER
    # Try to initialize MT5 without path first
    init_result = mt5.initialize()
    if not init_result:
        # If failed, try with path
        init_result = mt5.initialize(path=MT5_PATH)
    if not init_result:
        error_code, error_desc = mt5.last_error()
        # Log all relevant info for debugging
        print(f"[MT5 INIT FAIL] Tried without path and with path={MT5_PATH}")
        print(f"[MT5 INIT FAIL] Error code: {error_code}, Description: {error_desc}")
        raise HTTPException(status_code=400, detail=f"MT5 initialize() failed: code={error_code}, desc={error_desc}")

    print(f"Logging in with login: {login}, server: {server}")
    # Login to account
    if not mt5.login(login, password, server):
        error_code, error_desc = mt5.last_error()
        print(f"[MT5 LOGIN FAIL] login={login}, server={server}, Error code: {error_code}, Description: {error_desc}")
        mt5.shutdown()
        raise HTTPException(status_code=400, detail=f"MT5 login failed: code={error_code}, desc={error_desc}, login={login}, server={server}")

    from_date = datetime.now() - timedelta(days=30)  # last 30 days
    to_date = datetime.now()
    deals = mt5.history_deals_get(from_date, to_date)
    if deals is None:
        deals = []  # If no deals, continue to get positions

    # Get open positions
    open_positions = mt5.positions_get()
    if open_positions is None:
        open_positions = []

    positions = defaultdict(list)
    for d in deals:
        positions[d.position_id].append(d)

    trade_deals = []
    # Process closed positions from deals
    for pos_id, pos_deals in positions.items():
        if pos_id == 0:
            continue  # Skip balance operations for now
        symbol = pos_deals[0].symbol
        volume = pos_deals[0].volume
        open_price = None
        close_price = None
        trade_type = None
        profit = 0
        open_time = None
        close_time = None
        sl = None
        tp = None
        for d in pos_deals:
            profit += d.profit
            if d.entry == mt5.DEAL_ENTRY_IN:
                open_price = d.price
                trade_type = "BUY" if d.type == mt5.DEAL_TYPE_BUY else "SELL"
                open_time = d.time
            if d.entry == mt5.DEAL_ENTRY_OUT:
                close_price = d.price
                close_time = d.time
        trade_deals.append(TradeDeal(
            position_id=pos_id,
            symbol=symbol,
            volume=volume,
            open_price=open_price,
            close_price=close_price,
            trade_type=trade_type,
            profit=profit,
            open_time=open_time,
            close_time=close_time
        ))

    # Process open positions
    for pos in open_positions:
        trade_deals.append(TradeDeal(
            position_id=pos.ticket,
            symbol=pos.symbol,
            volume=pos.volume,
            open_price=pos.price_open,
            close_price=None,  # Open position
            trade_type="BUY" if pos.type == mt5.POSITION_TYPE_BUY else "SELL",
            profit=pos.profit,
            open_time=pos.time,
            close_time=None,
            sl=pos.sl,
            tp=pos.tp
        ))

    # Get account info
    account = mt5.account_info()
    if account:
        account_info = AccountInfo(
            login=account.login,
            balance=account.balance,
            equity=account.equity,
            margin=account.margin,
            free_margin=account.margin_free,
            profit=account.profit
        )
    else:
        account_info = AccountInfo(login=login_req.login, balance=0, equity=0, margin=0, free_margin=0, profit=0)

    mt5.shutdown()
    return SyncResponse(trades=trade_deals, account=account_info)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "mt5-sync-service", "mt5_available": mt5_available}

@app.get("/demo-trades")
def get_demo_trades():
    """Return mock trade data for testing purposes"""
    return [
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
        {
            "position_id": 12346,
            "symbol": "GBPUSD",
            "volume": 0.05,
            "open_price": 1.34567,
            "close_price": 1.34450,
            "trade_type": "SELL",
            "profit": -5.85,
            "open_time": 1700010000,
            "close_time": 1700017200
        }
    ]

def convert_mt5_trade(mt5_trade):
    return {
        "symbol": mt5_trade['symbol'],
        "entryPrice": float(mt5_trade['price_open']),
        "stopLoss": float(mt5_trade['sl']),
        "takeProfit": float(mt5_trade['tp']) if mt5_trade.get('tp') else None,
        "timeframe": "H1"  # or use actual timeframe if available
    }
# Use convert_mt5_trade for each trade before sending to backend/Buyers API

if __name__ == "__main__":
    import uvicorn
    print(f"MT5 Available: {mt5_available}")
    if not mt5_available:
        print("⚠️  MetaTrader 5 not detected. Service will run in demo mode only.")
        print("📋 Demo endpoints available:")
        print("   GET  /health - Service health check")
        print("   GET  /demo-trades - Mock trade data for testing")
        print("   POST /sync_trades - Will return error (MT5 not available)")
    uvicorn.run(app, host="0.0.0.0", port=8006)
