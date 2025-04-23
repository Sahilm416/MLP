from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
from scraper import get_facebook_comments
from main import predict_sentiment
import uvicorn

app = FastAPI(
    title="Facebook Comment Sentiment Analysis API",
    description="API for scraping Facebook comments and analyzing their sentiment",
    version="1.0.0"
)

class FacebookPostRequest(BaseModel):
    post_url: str

class CommentSentiment(BaseModel):
    comment: str
    author: str
    sentiment: str
    confidence: float

@app.post("/analyze-facebook-comments", 
         description="Scrape Facebook comments and analyze their sentiment",
         response_model=list[CommentSentiment])
async def analyze_facebook_comments(request: FacebookPostRequest):
    try:
        # First scrape the comments
        scrape_result = await get_facebook_comments(request)
        
        # Extract comments from the result
        comments = scrape_result.get('comments', [])
        
        # Analyze sentiment for each comment
        analyzed_comments = []
        for comment_data in comments:
            comment_text = comment_data['comment']
            if comment_text:
                # Get sentiment analysis
                sentiment_result = predict_sentiment(comment_text)
                
                # Create response object
                analyzed_comment = CommentSentiment(
                    comment=comment_text,
                    author=comment_data['author'],
                    sentiment=sentiment_result['sentiment'],
                    confidence=sentiment_result['confidence']
                )
                analyzed_comments.append(analyzed_comment)
        
        return analyzed_comments
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("combined_api:app", host="0.0.0.0", port=8002, reload=True) 