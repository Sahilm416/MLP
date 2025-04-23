# Marathi Sentiment Analysis API

This API provides sentiment analysis for Marathi text, classifying input as Negative, Neutral, or Positive.

## Setup Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Place your trained model file in the same directory:
```
marathi_sentiment_api/
├── main.py
├── requirements.txt
├── model.pt           # Your trained model file
├── model_info.json    # Model configuration
└── README.md
```

3. Start the API server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Usage

### Predict Sentiment

**Endpoint:** `/predict`

**Method:** POST

**Request Body:**
```json
{
  "text": "मला हा चित्रपट खूप आवडला!"
}
```

**Response:**
```json
{
  "sentiment": "Positive",
  "confidence": 0.92,
  "probabilities": {
    "Negative": 0.05,
    "Neutral": 0.03,
    "Positive": 0.92
  }
}
```

### Health Check

**Endpoint:** `/health`

**Method:** GET

**Response:**
```json
{
  "status": "healthy"
}
```

## Model Information

The API uses a fine-tuned MuRIL (Multilingual Representations for Indian Languages) model specifically trained for Marathi sentiment analysis. The model classifies text into three sentiment categories:

- Negative (-1)
- Neutral (0)
- Positive (1)

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- 400 Bad Request: When input text is empty
- 500 Internal Server Error: When model loading or prediction fails

## Interactive Documentation

When the server is running, you can access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
