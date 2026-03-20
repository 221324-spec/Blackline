from flask import Flask, request, jsonify
import requests
import os
import logging
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Alpha Vantage API configuration
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

# Debug logging for API key
logger.info(f"ALPHA_VANTAGE_API_KEY loaded: {'Yes' if ALPHA_VANTAGE_API_KEY else 'No'}")
if ALPHA_VANTAGE_API_KEY:
    logger.info(f"API Key length: {len(ALPHA_VANTAGE_API_KEY)}")
    logger.info(f"API Key starts with: {ALPHA_VANTAGE_API_KEY[:4] if ALPHA_VANTAGE_API_KEY else 'None'}")
else:
    logger.warning("ALPHA_VANTAGE_API_KEY is not set!")

@app.route('/predict', methods=['POST'])
def predict_trade_outcome():
    """
    Get trade outcome prediction using Alpha Vantage technical indicators
    """
    try:
        print("DEBUG: /predict endpoint called")
        trade = request.get_json()
        print(f"DEBUG: Received trade data: {trade}")
        if not trade:
            print("DEBUG: No trade data provided")
            return jsonify({'error': 'No trade data provided'}), 400

        # Check if trade is closed (has close_price)
        if 'close_price' in trade and trade['close_price'] is not None:
            # Return trade summary for closed trade
            profit = trade.get('profit', 0)
            result = 'win' if profit > 0 else 'loss' if profit < 0 else 'breakeven'
            summary = {
                'status': 'closed',
                'result': result,
                'profit_loss': profit,
                'symbol': trade.get('symbol', 'N/A'),
                'open_price': trade.get('open_price'),
                'close_price': trade.get('close_price'),
                'volume': trade.get('volume', 0),
                'open_time': trade.get('open_time'),
                'close_time': trade.get('close_time'),
                'execution_details': {
                    'entry_type': trade.get('trade_type', 'N/A'),
                    'position_id': trade.get('position_id', 'N/A')
                }
            }
            return jsonify(summary)

        # For open trades, proceed with prediction

        if not ALPHA_VANTAGE_API_KEY or ALPHA_VANTAGE_API_KEY.strip() == "":
            print("DEBUG: Alpha Vantage API key not configured, returning default prediction")
            print(f"DEBUG: ALPHA_VANTAGE_API_KEY value: '{ALPHA_VANTAGE_API_KEY}'")
            print(f"DEBUG: ALPHA_VANTAGE_API_KEY type: {type(ALPHA_VANTAGE_API_KEY)}")
            print(f"DEBUG: ALPHA_VANTAGE_API_KEY stripped: '{ALPHA_VANTAGE_API_KEY.strip() if ALPHA_VANTAGE_API_KEY else 'None'}'")
            logger.warning("Alpha Vantage API key not configured, returning default prediction")
            logger.warning(f"ALPHA_VANTAGE_API_KEY value: '{ALPHA_VANTAGE_API_KEY}'")
            logger.warning(f"ALPHA_VANTAGE_API_KEY type: {type(ALPHA_VANTAGE_API_KEY)}")
            logger.warning(f"ALPHA_VANTAGE_API_KEY stripped: '{ALPHA_VANTAGE_API_KEY.strip() if ALPHA_VANTAGE_API_KEY else 'None'}'")
            return jsonify({
                'winProbability': 0.5,
                'confidence': 0.3,
                'riskScore': 0.5,
                'recommendation': 'neutral'
            })

        symbol = trade.get('symbol', 'EURUSD')
        timeframe = trade.get('timeframe', 'H1')
        print(f"DEBUG: Symbol: {symbol}, Timeframe: {timeframe}")

        # Get technical indicators from Alpha Vantage
        print("DEBUG: Calling get_technical_indicators")
        indicators = get_technical_indicators(symbol, timeframe)
        print(f"DEBUG: Indicators returned: {indicators}")

        # If no indicators were fetched, return neutral with low confidence
        if not indicators:
            print("DEBUG: No indicators fetched, returning neutral")
            logger.warning(f"No indicators fetched for {symbol}, returning neutral")
            return jsonify({
                'winProbability': 0.5,
                'confidence': 0.3,
                'riskScore': 0.5,
                'recommendation': 'neutral'
            })

        # Calculate prediction based on indicators
        print("DEBUG: Calling calculate_prediction_from_indicators")
        prediction = calculate_prediction_from_indicators(indicators, trade)
        print(f"DEBUG: Prediction calculated: {prediction}")

        logger.info(f"Prediction for {symbol}: {prediction['recommendation']} (confidence: {prediction['confidence']})")

        return jsonify(prediction)

    except Exception as e:
        print(f"DEBUG: Exception in predict_trade_outcome: {str(e)}")
        print(f"DEBUG: Exception type: {type(e).__name__}")
        import traceback
        print("DEBUG: Full traceback:")
        traceback.print_exc()
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_technical_indicators(symbol: str, timeframe: str = "daily"):
    """
    Fetch technical indicators from Alpha Vantage
    """
    print(f"DEBUG: get_technical_indicators called with symbol={symbol}, timeframe={timeframe}")
    indicators = {}
    logger.info(f"Fetching indicators for {symbol} with timeframe {timeframe}")
    logger.info(f"Using API key: {'Yes' if ALPHA_VANTAGE_API_KEY else 'No'}")
    try:
        # Map timeframe to Alpha Vantage interval
        interval_map = {
            "1m": "1min", "5m": "5min", "15m": "15min", "30m": "30min", "1h": "60min",
            "H1": "60min", "daily": "daily", "weekly": "weekly", "monthly": "monthly"
        }
        interval = interval_map.get(timeframe.lower(), "daily")
        print(f"DEBUG: Mapped timeframe '{timeframe}' to interval '{interval}'")

        # Add delay between API calls to avoid rate limits
        import time

        # Get RSI (Relative Strength Index)
        print("DEBUG: Fetching RSI")
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
            print(f"DEBUG: RSI response status: {rsi_response.status_code}")
            rsi_response.raise_for_status()
            rsi_data = rsi_response.json()
            print(f"DEBUG: RSI data keys: {list(rsi_data.keys())}")

            if "Technical Analysis: RSI" in rsi_data:
                rsi_values = list(rsi_data["Technical Analysis: RSI"].values())
                if rsi_values:
                    indicators["rsi"] = float(rsi_values[0]["RSI"])
                    print(f"DEBUG: RSI fetched: {indicators['rsi']}")

            time.sleep(1)  # Rate limit delay

        except Exception as e:
            print(f"DEBUG: Failed to fetch RSI: {e}")
            print(f"DEBUG: Exception type: {type(e).__name__}")
            import traceback
            print("DEBUG: RSI traceback:")
            traceback.print_exc()

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
            macd_response.raise_for_status()
            macd_data = macd_response.json()

            if "Technical Analysis: MACD" in macd_data:
                macd_values = list(macd_data["Technical Analysis: MACD"].values())
                if macd_values:
                    indicators["macd"] = float(macd_values[0]["MACD"])
                    indicators["macd_signal"] = float(macd_values[0]["MACD_Signal"])
                    indicators["macd_hist"] = float(macd_values[0]["MACD_Hist"])
                    logger.info(f"MACD fetched: {indicators['macd']}")

            time.sleep(1)  # Rate limit delay

        except Exception as e:
            logger.warning(f"Failed to fetch MACD for {symbol}: {e}")

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
            sma_response.raise_for_status()
            sma_data = sma_response.json()

            if "Technical Analysis: SMA" in sma_data:
                sma_values = list(sma_data["Technical Analysis: SMA"].values())
                if sma_values:
                    indicators["sma_20"] = float(sma_values[0]["SMA"])
                    logger.info(f"SMA fetched: {indicators['sma_20']}")

        except Exception as e:
            logger.warning(f"Failed to fetch SMA for {symbol}: {e}")

    except Exception as e:
        logger.warning(f"Failed to fetch indicators for {symbol}: {e}")
        logger.warning(f"Exception type: {type(e).__name__}")

    logger.info(f"Returning indicators: {indicators}")
    return indicators

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

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "trading-prediction-service",
        "provider": "alpha-vantage"
    })

if __name__ == "__main__":
    print("Starting Flask app...")
    app.run(host='127.0.0.1', port=8001, debug=False, use_reloader=False, threaded=False)