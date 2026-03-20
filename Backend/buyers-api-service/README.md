# Trading Prediction Service - Alpha Vantage Integration

A FastAPI microservice that provides trade outcome predictions using Alpha Vantage technical indicators for the Blackline Matrix trading platform.

## Features

- **Technical Analysis**: Uses RSI, MACD, and SMA indicators from Alpha Vantage
- **Trade Prediction**: Analyzes market conditions to predict trade outcomes
- **Risk Assessment**: Evaluates trade risk based on stop loss parameters
- **Confidence Scoring**: Provides prediction reliability metrics
- **Fallback Handling**: Works even without API key (returns neutral predictions)

## Setup

### Prerequisites
- Python 3.8+
- Alpha Vantage API key (free at https://www.alphavantage.co/support/#api-key)

### Installation

1. Navigate to the service directory:
```bash
cd Backend/buyers-api-service
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Get Alpha Vantage API key:
   - Visit https://www.alphavantage.co/support/#api-key
   - Sign up for a free API key
   - Copy the key

4. Configure environment variables in `.env`:
```env
ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
PORT=5001
```

### Running the Service

Start the service:
```bash
python main.py
```

The service will run on `http://localhost:5001`

### Health Check

Check service status:
```bash
curl http://localhost:5001/health
```

## API Endpoints

### POST /predict
Get trade outcome prediction.

**Request Body:**
```json
{
  "symbol": "EURUSD",
  "entryPrice": 1.0850,
  "stopLoss": 1.0800,
  "takeProfit": 1.0950,
  "timeframe": "H1",
  "marketCondition": "normal"
}
```

**Response:**
```json
{
  "winProbability": 0.72,
  "confidence": 0.85,
  "riskScore": 0.3,
  "recommendation": "buy"
}
```

### GET /health
Service health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "buyers-api-service"
}
```

## Integration with Main Backend

The service integrates with the main Node.js backend through the `buyersApiService.js` module. Predictions are automatically requested when:

- Creating new trades
- Updating trade entry prices or symbols
- Manual prediction requests

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BUYERS_API_URL` | Buyer's API endpoint URL | `https://api.buyers.com/predict` |
| `BUYERS_API_KEY` | Buyer's API authentication key | Required |
| `PORT` | Service port | `5001` |

### Fallback Behavior

If Buyer's API is unavailable or misconfigured, the service returns default predictions:
- Win Probability: 50%
- Confidence: 30%
- Risk Score: 50%
- Recommendation: "neutral"

This ensures the trading platform continues to function even during API outages.

## Development

### Project Structure
```
buyers-api-service/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── .env                # Environment configuration
└── README.md           # This file
```

### Testing

Test the prediction endpoint:
```bash
curl -X POST "http://localhost:5001/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "EURUSD",
    "entryPrice": 1.0850,
    "stopLoss": 1.0800,
    "takeProfit": 1.0950
  }'
```

## Troubleshooting

### Service Won't Start
- Check Python version (3.8+ required)
- Verify all dependencies are installed
- Check port 5001 is available

### API Key Issues
- Verify `BUYERS_API_KEY` is set in `.env`
- Check API key format and validity
- Review Buyer's API documentation

### Connection Refused
- Ensure main backend `.env` has `BUYERS_API_SERVICE_URL=http://localhost:5001`
- Check service is running on correct port
- Verify firewall settings

## Production Deployment

For production deployment:

1. Use a production WSGI server (e.g., Gunicorn)
2. Set up proper logging
3. Configure HTTPS
4. Use environment-specific configuration
5. Set up monitoring and health checks

Example production start:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5001
```