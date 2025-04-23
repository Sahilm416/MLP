# Marathi Language Processing (MLP)

## Overview

A comprehensive API system for Marathi text sentiment analysis and Facebook comment scraping. This project combines deep learning-based sentiment analysis for Marathi text with automated Facebook comment scraping capabilities.

## Features

- 🎯 Marathi Text Sentiment Analysis
- 📱 Facebook Comment Scraping
- 🔄 Combined Analysis Pipeline
- 🚀 FastAPI-based REST APIs
- 🤖 Deep Learning Model for Sentiment Classification

## Quick Start

1. Clone the repository

```bash
git clone https://github.com/Saadmomin2903/MLP.git
cd MLP
```

2. Set up environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Configure Facebook credentials
   Create a `.env` file with:

```env
FB_EMAIL=your_facebook_email
FB_PASSWORD=your_facebook_password
```

4. Run the APIs

```bash
python main.py        # Sentiment Analysis API
python scraper.py     # Facebook Scraper API
python combined_api.py # Combined API
```

## API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API usage and examples.

## License

MIT License

## Author

Saad Momin
