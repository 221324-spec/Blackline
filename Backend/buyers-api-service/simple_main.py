from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict_trade_outcome():
    """
    Simple prediction endpoint
    """
    try:
        trade = request.get_json()
        if not trade:
            return jsonify({'error': 'No trade data provided'}), 400

        # Return a simple prediction
        return jsonify({
            'winProbability': 0.65,
            'confidence': 0.7,
            'riskScore': 0.4,
            'recommendation': 'buy'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    print("Starting simple Flask app...")
    app.run(host='127.0.0.1', port=8001, debug=False, use_reloader=False, threaded=False)