# Facebook Comment Sentiment Analysis API Documentation

## Overview

This API combines Facebook comment scraping with Marathi sentiment analysis. It can scrape comments from Facebook posts and analyze the sentiment of each comment.

## Setup Requirements

1. Create a `.env` file with Facebook credentials:

```env
FB_EMAIL=your_facebook_email
FB_PASSWORD=your_facebook_password
```

2. Install required packages:

```bash
pip install fastapi uvicorn python-dotenv playwright pydantic torch transformers
playwright install
```

## Available APIs

### 1. Sentiment Analysis API (Port 8000)

Analyzes sentiment of Marathi text.

```bash
# Analyze sentiment of text
curl -X POST "http://localhost:8000/predict" \
-H "Content-Type: application/json" \
-d '{"text": "मला हा चित्रपट खूप आवडला!"}'
```

Example Response:

```json
{
  "sentiment": "Positive",
  "confidence": 0.946,
  "probabilities": {
    "Negative": 0.027,
    "Neutral": 0.027,
    "Positive": 0.946
  }
}
```

### 2. Facebook Scraper API (Port 8001)

Scrapes comments from Facebook posts.

```bash
# Scrape comments from a Facebook post
curl -X POST "http://localhost:8001/scrape-facebook-post" \
-H "Content-Type: application/json" \
-d '{"post_url": "https://www.facebook.com/photo/?fbid=XXXXX"}'
```

Example Response:

```json
{
  "post": {
    "content": "Post content...",
    "url": "https://www.facebook.com/..."
  },
  "comments": [
    {
      "comment": "Comment text",
      "author": "Author name",
      "index": 0
    }
  ],
  "metadata": {
    "total_comments": 10,
    "scraped_at": "2024-03-19T12:00:00",
    "clicks_to_expand": 5
  }
}
```

### 3. Combined Sentiment Analysis API (Port 8002)

Scrapes Facebook comments and analyzes their sentiment.

```bash
# Analyze sentiments of Facebook post comments
curl -X POST "http://localhost:8002/analyze-facebook-comments" \
-H "Content-Type: application/json" \
-d '{"post_url": "https://www.facebook.com/photo/?fbid=XXXXX"}'
```

Example Response:

```json
[
  {
    "comment": "Comment text",
    "author": "Author name",
    "sentiment": "Positive",
    "confidence": 0.819
  }
]
```

## Running the APIs

1. Start Sentiment Analysis API:

```bash
python main.py
```

2. Start Facebook Scraper:

```bash
python scraper.py
```

3. Start Combined API:

```bash
python combined_api.py
```

## Example Usage

### 1. Analyzing a Single Marathi Text

```bash
curl -X POST "http://localhost:8000/predict" \
-H "Content-Type: application/json" \
-d '{"text": "हा खूप वाईट अनुभव होता"}'
```

### 2. Scraping Facebook Comments

```bash
curl -X POST "http://localhost:8001/scrape-facebook-post" \
-H "Content-Type: application/json" \
-d '{"post_url": "https://www.facebook.com/share/p/16QyiEfvMW/"}'
```

### 3. Combined Analysis of Facebook Comments

```bash
curl -X POST "http://localhost:8002/analyze-facebook-comments" \
-H "Content-Type: application/json" \
-d '{"post_url": "https://www.facebook.com/share/p/16QyiEfvMW/"}'
```

## Notes

- Ensure you have proper Facebook credentials in the `.env` file
- The sentiment model supports Marathi text
- All APIs return JSON responses
- Error responses include appropriate HTTP status codes and error messages
