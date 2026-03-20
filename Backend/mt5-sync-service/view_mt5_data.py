import MetaTrader5 as mt5
import os
from dotenv import load_dotenv
import time

load_dotenv()

# Prompt for MT5 credentials
MT5_LOGIN = int(input("Enter MT5 Login ID: "))
MT5_PASSWORD = input("Enter MT5 Password: ")
MT5_SERVER = input("Enter MT5 Server (default: MetaQuotes-Demo): ") or "MetaQuotes-Demo"

def main():
    print("Initializing MT5...")
    # Try to initialize MT5 without path first
    init_result = mt5.initialize()
    if not init_result:
        # If failed, try with path
        init_result = mt5.initialize(mt5_path)
    if not init_result:
        print("MT5 initialization failed")
        print(f"Last error: {mt5.last_error()}")
        return

    print("MT5 initialized successfully")

    print(f"Logging in with login: {MT5_LOGIN}, server: {MT5_SERVER}")
    # Login to account
    if not mt5.login(MT5_LOGIN, MT5_PASSWORD, MT5_SERVER):
        print(f"Login failed: {mt5.last_error()}")
        mt5.shutdown()
        return

    print("Successfully logged in to MT5")

    print("Fetching account info...")

    # Get account information
    account = mt5.account_info()
    if account:
        print("\n=== ACCOUNT DETAILS ===")
        print(f"Login: {account.login}")
        print(f"Balance: {account.balance}")
        print(f"Equity: {account.equity}")
        print(f"Margin: {account.margin}")
        print(f"Free Margin: {account.margin_free}")
        print(f"Profit: {account.profit}")
        print(f"Currency: {account.currency}")
        print(f"Leverage: {account.leverage}")
        print(f"Server: {account.server}")
    else:
        print("Failed to get account info")

    # Get all historical deals (closed trades)
    from_date = time.time() - 30 * 24 * 3600  # last 30 days
    to_date = time.time()  # current time

    deals = mt5.history_deals_get(from_date, to_date)
    print(f"\n=== CLOSED TRADES ({len(deals) if deals else 0}) ===")
    if deals:
        for deal in deals:
            print(f"\nDeal Ticket: {deal.ticket}")
            print(f"Position ID: {deal.position_id}")
            print(f"Symbol: {deal.symbol}")
            print(f"Volume: {deal.volume}")
            print(f"Price: {deal.price}")
            print(f"Entry: {'BUY' if deal.entry == mt5.DEAL_ENTRY_IN else 'SELL' if deal.entry == mt5.DEAL_ENTRY_OUT else 'Other'}")
            print(f"Time: {deal.time}")
            print(f"Commission: {deal.commission}")
            print(f"Swap: {deal.swap}")
            print(f"Profit: {deal.profit}")
            print(f"Fee: {deal.fee}")
            print(f"Comment: {deal.comment}")
            print(f"Magic: {deal.magic}")
            print(f"Reason: {deal.reason}")
    else:
        print("No closed trades currently.")

    # Get open positions
    positions = mt5.positions_get()
    print(f"\n=== OPEN TRADES ({len(positions) if positions else 0}) ===")
    if positions:
        for pos in positions:
            print(f"\nPosition Ticket: {pos.ticket}")
            print(f"Symbol: {pos.symbol}")
            print(f"Volume: {pos.volume}")
            print(f"Price Open: {pos.price_open}")
            print(f"Price Current: {pos.price_current}")
            print(f"Type: {'BUY' if pos.type == mt5.POSITION_TYPE_BUY else 'SELL'}")
            print(f"Time: {pos.time}")
            print(f"Profit: {pos.profit}")
            print(f"SL: {pos.sl}")
            print(f"TP: {pos.tp}")
            print(f"Swap: {pos.swap}")
            print(f"Magic: {pos.magic}")
            print(f"Comment: {pos.comment}")
    else:
        print("No open trades currently.")

    # Shutdown MT5
    mt5.shutdown()
    print("\nMT5 connection closed")

if __name__ == "__main__":
    main()