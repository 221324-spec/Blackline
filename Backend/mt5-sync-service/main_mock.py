from flask import Flask, request, jsonify
import random
from datetime import datetime, timedelta
import time

app = Flask(__name__)

def generate_mock_trades(login: int):
    """Generate mock trades for testing - includes both closed and active trades"""
    symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD']
    trades = []

    # Generate 3-8 closed trades
    num_closed_trades = random.randint(3, 8)
    for i in range(num_closed_trades):
        symbol = random.choice(symbols)
        volume = round(random.uniform(0.01, 1.0), 2)
        open_price = round(random.uniform(1.0, 150.0), 5)
        close_price = round(open_price * random.uniform(0.995, 1.005), 5)
        profit = round((close_price - open_price) * volume * 100000, 2)
        trade_type = random.choice(['BUY', 'SELL'])

        # Generate timestamps within last 30 days
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        open_time = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
        close_time = open_time + timedelta(hours=random.randint(1, 24))

        trades.append({
            'position_id': 100000 + i + (login % 1000),
            'symbol': symbol,
            'volume': volume,
            'open_price': open_price,
            'close_price': close_price,
            'trade_type': trade_type,
            'profit': profit,
            'open_time': open_time.timestamp(),
            'close_time': close_time.timestamp(),
            'status': 'closed'
        })

    # Generate 1-3 active/open trades
    num_active_trades = random.randint(1, 3)
    for i in range(num_active_trades):
        symbol = random.choice(symbols)
        volume = round(random.uniform(0.01, 1.0), 2)
        open_price = round(random.uniform(1.0, 150.0), 5)
        trade_type = random.choice(['BUY', 'SELL'])

        # Active trades have no close price/profit yet
        # Generate open time within last 7 days
        days_ago = random.randint(0, 7)
        hours_ago = random.randint(0, 23)
        open_time = datetime.now() - timedelta(days=days_ago, hours=hours_ago)

        trades.append({
            'position_id': 200000 + i + (login % 1000),
            'symbol': symbol,
            'volume': volume,
            'open_price': open_price,
            'close_price': None,  # Active trade
            'trade_type': trade_type,
            'profit': 0,  # No profit yet
            'open_time': open_time.timestamp(),
            'close_time': None,  # Not closed
            'status': 'active'
        })

    return trades

@app.route('/sync_trades', methods=['POST'])
def sync_trades():
    """
    Mock MT5 sync - simulates connecting to MT5 and fetching trades
    In real implementation, this would connect to actual MT5 terminal
    """
    try:
        login_req = request.get_json()
        print(f"🔗 Mock MT5 Connection: login={login_req.get('login')}, server={login_req.get('server')}")

        # Simulate connection delay
        time.sleep(1)

        # Simulate authentication check
        if not isinstance(login_req.get('login'), int) or login_req.get('login') < 10000:
            return jsonify({'error': 'Invalid login format'}), 400

        if not login_req.get('password') or len(login_req.get('password')) < 3:
            return jsonify({'error': 'Invalid password'}), 400

        # Generate mock trades
        trades = generate_mock_trades(login_req.get('login'))

        # Create mock account info
        account_info = {
            'login': login_req.get('login'),
            'balance': 10000.00,
            'equity': 9950.00,
            'margin': 50.00,
            'free_margin': 9900.00,
            'profit': -50.00
        }

        print(f"✅ Mock MT5 Sync: Generated {len(trades)} trades for user {login_req.get('login')}")
        return jsonify({
            'trades': trades,
            'account': account_info
        })

    except Exception as e:
        print(f"❌ Mock MT5 Error: {str(e)}")
        return jsonify({'error': f"MT5 connection failed: {str(e)}"}), 400

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'mt5-sync-service-mock',
        'note': 'This is a mock service for testing. Real MT5 terminal not required.'
    })

@app.route('/demo-trades')
def get_demo_trades():
    """Get sample demo trades for testing"""
    return jsonify(generate_mock_trades(12345678))

@app.route('/bars', methods=['POST'])
def get_bars():
    """Return a mock list of recent close prices for a symbol.
    Expects JSON: { "symbol": "EURUSD", "timeframe": "H1", "count": 100 }
    Returns: { "bars": [<float>, ...] } where newest-first
    """
    try:
        req = request.get_json() or {}
        symbol = req.get('symbol', 'EURUSD')
        timeframe = req.get('timeframe', 'H1')
        count = int(req.get('count', 120))

        # Simple deterministic pseudo-random start based on symbol hash
        base = float(sum([ord(c) for c in symbol]) % 100) + 1.0
        bars = []
        price = base
        import random
        random.seed(sum([ord(c) for c in symbol]))
        for i in range(count):
            # small random walk
            price = round(price * (1 + random.uniform(-0.002, 0.002)), 5)
            bars.append(price)

        # Return newest-first
        return jsonify({'bars': bars[::-1]})
    except Exception as e:
        print(f"❌ /bars error: {str(e)}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print("🚀 Starting MOCK MT5 Sync Service...")
    print("📝 Note: This service simulates MT5 connections for testing")
    print("🔧 Real MT5 terminal not required for testing")
    app.run(host='0.0.0.0', port=8006, debug=False)