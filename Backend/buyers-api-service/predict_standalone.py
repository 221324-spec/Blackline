import os
from dotenv import load_dotenv
import requests
import json
import sys

load_dotenv()

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

def get_technical_indicators(symbol: str, timeframe: str = "daily"):
    """
    Fetch technical indicators from Alpha Vantage
    """
    indicators = {}
    try:
        # Map timeframe to Alpha Vantage interval (normalize keys to lowercase)
        interval_map = {
            "1m": "1min", "5m": "5min", "15m": "15min", "30m": "30min",
            "1h": "60min", "h1": "60min", "daily": "daily", "weekly": "weekly", "monthly": "monthly"
        }
        interval = interval_map.get(timeframe.lower(), "daily")
        # Debug: report which API key fragment and interval are used
        try:
            keyfrag = (ALPHA_VANTAGE_API_KEY or '')[:4]
        except Exception:
            keyfrag = 'none'
        print(f"[DEBUG] AlphaVantage key fragment: {keyfrag}, symbol: {symbol}, interval: {interval}", file=sys.stderr)

        import time

        # Get RSI (Relative Strength Index)
        try:
            rsi_params = {
                "function": "RSI",
                "symbol": symbol,
                "interval": interval,
                "time_period": "14",
                "series_type": "close",
                "apikey": ALPHA_VANTAGE_API_KEY
            }

            rsi_response = requests.get(ALPHA_VANTAGE_BASE_URL, params=rsi_params, timeout=15.0)
            try:
                rsi_response.raise_for_status()
            except Exception as e:
                print(f"[RSI] HTTP error: {e}", file=sys.stderr)
            rsi_data = rsi_response.json()
            # debug raw response if missing expected key
            if "Technical Analysis: RSI" in rsi_data:
                rsi_values = list(rsi_data["Technical Analysis: RSI"].values())
                if rsi_values:
                    indicators["rsi"] = float(rsi_values[0]["RSI"])
            else:
                print(f"[RSI] Unexpected response: {rsi_data}", file=sys.stderr)

            time.sleep(1)

        except Exception as e:
            pass  # Continue without RSI

        # Get MACD
        try:
            macd_params = {
                "function": "MACD",
                "symbol": symbol,
                "interval": interval,
                "series_type": "close",
                "apikey": ALPHA_VANTAGE_API_KEY
            }

            macd_response = requests.get(ALPHA_VANTAGE_BASE_URL, params=macd_params, timeout=15.0)
            try:
                macd_response.raise_for_status()
            except Exception as e:
                print(f"[MACD] HTTP error: {e}", file=sys.stderr)
            macd_data = macd_response.json()
            if "Technical Analysis: MACD" in macd_data:
                macd_values = list(macd_data["Technical Analysis: MACD"].values())
                if macd_values:
                    indicators["macd"] = float(macd_values[0]["MACD"])
                    indicators["macd_signal"] = float(macd_values[0]["MACD_Signal"])
                    indicators["macd_hist"] = float(macd_values[0]["MACD_Hist"])
            else:
                print(f"[MACD] Unexpected response: {macd_data}", file=sys.stderr)

            time.sleep(1)

        except Exception as e:
            pass  # Continue without MACD

        # Get SMA (Simple Moving Average)
        try:
            sma_params = {
                "function": "SMA",
                "symbol": symbol,
                "interval": interval,
                "time_period": "20",
                "series_type": "close",
                "apikey": ALPHA_VANTAGE_API_KEY
            }

            sma_response = requests.get(ALPHA_VANTAGE_BASE_URL, params=sma_params, timeout=15.0)
            try:
                sma_response.raise_for_status()
            except Exception as e:
                print(f"[SMA] HTTP error: {e}", file=sys.stderr)
            sma_data = sma_response.json()
            if "Technical Analysis: SMA" in sma_data:
                sma_values = list(sma_data["Technical Analysis: SMA"].values())
                if sma_values:
                    indicators["sma_20"] = float(sma_values[0]["SMA"])
            else:
                print(f"[SMA] Unexpected response: {sma_data}", file=sys.stderr)

        except Exception as e:
            pass  # Continue without SMA

    except Exception as e:
        pass

    # If key indicators missing, try to fetch raw time series and compute locally
    try:
        need_rsi = 'rsi' not in indicators
        need_sma = 'sma_20' not in indicators
        if need_rsi or need_sma:
            interval_map = {
                '1m':'1min','5m':'5min','15m':'15min','30m':'30min','1h':'60min','h1':'60min','daily':'daily'
            }
            iv = interval_map.get(timeframe.lower(), '60min')
            closes = fetch_time_series(symbol, iv)
            if closes:
                # closes returned newest-first; ensure newest-first
                if need_sma:
                    sma = compute_sma_from_series(closes, period=20)
                    if sma is not None:
                        indicators['sma_20'] = sma
                if need_rsi:
                    rsi = compute_rsi_from_series(closes, period=14)
                    if rsi is not None:
                        indicators['rsi'] = rsi
    except Exception as e:
        print('[INDICATORS] local compute error', e, file=sys.stderr)

    return indicators


def fetch_time_series(symbol: str, interval: str = '60min'):
    """Fetch time series (intraday or daily) and return list of close prices newest-first"""
    try:
        params = {}
        if interval in ['1min', '5min', '15min', '30min', '60min']:
            params = {
                'function': 'TIME_SERIES_INTRADAY',
                'symbol': symbol,
                'interval': interval,
                'apikey': ALPHA_VANTAGE_API_KEY,
                'outputsize': 'compact'
            }
            resp = requests.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=15.0)
            data = resp.json()
            key = f"Time Series ({interval})"
            if key in data:
                series = list(data[key].values())
                closes = [float(item['4. close']) for item in series]
                return closes
        # fallback to daily
        params = {
            'function': 'TIME_SERIES_DAILY_ADJUSTED',
            'symbol': symbol,
            'apikey': ALPHA_VANTAGE_API_KEY,
            'outputsize': 'compact'
        }
        resp = requests.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=15.0)
        data = resp.json()
        if 'Time Series (Daily)' in data:
            series = list(data['Time Series (Daily)'].values())
            closes = [float(item['4. close']) for item in series]
            return closes
    except Exception as e:
        print('[TS] fetch error', e, file=sys.stderr)
    return []


def compute_sma_from_series(closes, period=20):
    if not closes or len(closes) < period:
        return None
    vals = closes[:period]
    return sum(vals)/len(vals)


def compute_rsi_from_series(closes, period=14):
    if not closes or len(closes) < period + 1:
        return None
    gains = []
    losses = []
    for i in range(1, period+1):
        delta = closes[i-1] - closes[i]
        if delta > 0:
            gains.append(delta)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(delta))
    avg_gain = sum(gains)/period
    avg_loss = sum(losses)/period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain/avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_prediction_from_indicators(indicators: dict, trade: dict) -> dict:
    """
    Calculate trade prediction based on technical indicators
    """
    win_probability = 0.5  # Default neutral
    confidence = 0.3       # Default low confidence
    risk_score = 0.5       # Default medium risk
    recommendation = "neutral"

    bullish_signals = 0
    bearish_signals = 0
    total_signals = 0

    # RSI Analysis (Relative Strength Index)
    if "rsi" in indicators:
        rsi = indicators["rsi"]
        total_signals += 1
        if rsi > 70:
            bearish_signals += 1  # Overbought
        elif rsi < 30:
            bullish_signals += 1  # Oversold
        else:
            bullish_signals += 0.5  # Neutral RSI

    # MACD Analysis
    if "macd" in indicators and "macd_signal" in indicators:
        macd = indicators["macd"]
        signal = indicators["macd_signal"]
        total_signals += 1
        if macd > signal:
            bullish_signals += 1  # MACD above signal line
        else:
            bearish_signals += 1  # MACD below signal line

    # Calculate win probability based on signals
    if total_signals > 0:
        bullish_ratio = bullish_signals / total_signals
        bearish_ratio = bearish_signals / total_signals

        if bullish_ratio > bearish_ratio:
            win_probability = 0.6 + (bullish_ratio * 0.3)  # 60-90%
            recommendation = "buy"
        elif bearish_ratio > bullish_ratio:
            win_probability = 0.4 - (bearish_ratio * 0.3)  # 10-40%
            recommendation = "sell"
        else:
            win_probability = 0.5
            recommendation = "hold"

        # Calculate confidence based on signal strength
        max_ratio = max(bullish_ratio, bearish_ratio)
        confidence = 0.4 + (max_ratio * 0.5)  # 40-90%

    # Calculate risk score based on trade parameters
    risk_score = 0.5  # Default
    stop_loss = trade.get('stopLoss')
    entry_price = trade.get('entryPrice')
    if stop_loss and entry_price:
        stop_distance = abs(entry_price - stop_loss) / entry_price
        if stop_distance < 0.01:  # Tight stop (high risk)
            risk_score = 0.8
        elif stop_distance > 0.05:  # Wide stop (lower risk)
            risk_score = 0.3

    # Ensure values are within bounds
    win_probability = max(0.1, min(0.9, win_probability))
    confidence = max(0.2, min(0.95, confidence))
    risk_score = max(0.1, min(0.9, risk_score))

    return {
        'winProbability': round(win_probability, 2),
        'confidence': round(confidence, 2),
        'riskScore': round(risk_score, 2),
        'recommendation': recommendation
    }

if __name__ == "__main__":
    # Read trade data from stdin (JSON)
    try:
        trade_data = json.loads(sys.stdin.read())
    except:
        trade_data = {
            'symbol': 'AAPL',
            'timeframe': 'daily',
            'entryPrice': 150.0,
            'stopLoss': 145.0
        }

    # If a timeSeries is provided in the payload, use it as canonical input and compute indicators locally
    indicators = {}
    ts = trade_data.get('timeSeries')
    if ts and isinstance(ts, list) and len(ts) > 0:
        try:
            # Accept either floats or dicts with 'close' keys
            closes = []
            if isinstance(ts[0], dict) and 'close' in ts[0]:
                closes = [float(x['close']) for x in ts if 'close' in x]
            else:
                closes = [float(x) for x in ts]

            # assume newest-first, but ensure length and use newest
            if len(closes) >= 20:
                indicators['sma_20'] = compute_sma_from_series(closes, period=20)
            if len(closes) >= 14:
                indicators['rsi'] = compute_rsi_from_series(closes, period=14)
            if len(closes) >= 26:
                # compute simple MACD using EMA
                def compute_ema(arr, period):
                    k = 2 / (period + 1)
                    ema = arr[0]
                    for i in range(1, len(arr)):
                        ema = (arr[i] - ema) * k + ema
                    return ema
                ema12 = compute_ema(closes, 12)
                ema26 = compute_ema(closes, 26)
                indicators['macd'] = ema12 - ema26
                indicators['macd_signal'] = (indicators['macd'] * 0.2) if indicators['macd'] is not None else None
        except Exception as e:
            print('[TS] compute from provided series failed', e, file=sys.stderr)
    else:
        # Get indicators and calculate prediction from external service/fallback
        indicators = get_technical_indicators(trade_data.get('symbol', 'AAPL'), trade_data.get('timeframe', 'daily'))

    prediction = calculate_prediction_from_indicators(indicators, trade_data)

    # Output JSON result
    print(json.dumps(prediction))