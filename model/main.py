from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModel
import torch.nn as nn
import re
import json
import os
import uvicorn

# Define the FastAPI app
app = FastAPI(
    title="Marathi Sentiment Analysis API",
    description="API for predicting sentiment of Marathi text",
    version="1.0.0"
)

# Define the request model
class SentimentRequest(BaseModel):
    text: str

# Define the response model
class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    probabilities: dict

# Define the MarathiTextPreprocessor class
class MarathiTextPreprocessor:
    """Efficient text preprocessor for Marathi language"""

    def __init__(self, remove_stopwords=True):
        self.remove_stopwords = remove_stopwords
        self.stopwords = self._load_stopwords()

    def _load_stopwords(self):
        """Load common Marathi stopwords"""
        return {
            'आणि', 'आहे', 'तो', 'ती', 'ते', 'होते', 'होता', 'होती', 'आहेत',
            'या', 'च', 'ला', 'तर', 'पण', 'की', 'म्हणून', 'हे', 'त्या', 'तू', 'मी',
            'आम्ही', 'आपण', 'तुम्ही', 'त्यांचा', 'त्यांची', 'त्यांचे', 'वर', 'मध्ये'
        }

    def process(self, text):
        """Process Marathi text for sentiment analysis"""
        if not isinstance(text, str):
            return ""

        # Remove URLs
        text = re.sub(r'https?://\S+|www\.\S+', '', text)

        # Remove HTML tags
        text = re.sub(r'<.*?>', '', text)

        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        # Remove non-Devanagari characters (except whitespace and punctuation)
        devanagari_pattern = r'[^\u0900-\u097F\s\d.,!?;:"""''()+-]'
        text = re.sub(devanagari_pattern, '', text)

        # Remove stopwords if enabled
        if self.remove_stopwords:
            words = text.split()
            words = [word for word in words if word.lower() not in self.stopwords]
            text = ' '.join(words)

        return text

# Define the MarathiSentimentClassifier model
class MarathiSentimentClassifier(nn.Module):
    """Efficient sentiment classifier for Marathi text"""

    def __init__(self, model_name, num_labels=3, dropout_rate=0.2):
        super(MarathiSentimentClassifier, self).__init__()

        # Load pre-trained model
        self.transformer = AutoModel.from_pretrained(model_name)
        self.num_labels = num_labels

        # Get hidden size from config
        self.hidden_size = self.transformer.config.hidden_size

        # Classification head
        self.classifier = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(self.hidden_size, self.hidden_size // 2),
            nn.GELU(),
            nn.LayerNorm(self.hidden_size // 2),
            nn.Dropout(dropout_rate),
            nn.Linear(self.hidden_size // 2, num_labels)
        )

    def forward(self, input_ids, attention_mask, labels=None):
        # Ensure input tensors have correct data type
        input_ids = input_ids.long()
        attention_mask = attention_mask.long()

        # Get transformer outputs
        outputs = self.transformer(
            input_ids=input_ids,
            attention_mask=attention_mask,
            return_dict=True
        )

        # Get pooled output
        if hasattr(outputs, 'pooler_output'):
            pooled_output = outputs.pooler_output
        else:
            # If pooler_output is not available, use the [CLS] token output
            pooled_output = outputs.last_hidden_state[:, 0, :]

        # Apply classifier
        logits = self.classifier(pooled_output)

        # Calculate loss if labels are provided
        loss = None
        if labels is not None:
            loss_fn = nn.CrossEntropyLoss(label_smoothing=0.1)
            loss = loss_fn(logits, labels)

        return {
            'loss': loss,
            'logits': logits
        }

# Global variables for model, tokenizer, and preprocessor
model = None
tokenizer = None
preprocessor = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_info = None

# Load model info
def load_model_info():
    global model_info
    try:
        # Assuming model_info.json is in the same directory as the script
        model_info_path = os.path.join(os.path.dirname(__file__), "model_info.json")
        with open(model_info_path, 'r') as f:
            model_info = json.load(f)
        return True
    except Exception as e:
        print(f"Error loading model info: {e}")
        return False

# Load model
def load_model():
    global model, tokenizer, preprocessor, model_info
    
    try:
        # Load model info if not already loaded
        if model_info is None:
            if not load_model_info():
                return False
        
        # Get model name and num_labels from model_info
        model_name = model_info.get("model_name", "google/muril-base-cased")
        num_labels = model_info.get("num_labels", 3)
        
        # Initialize tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Initialize model
        model = MarathiSentimentClassifier(model_name, num_labels=num_labels)
        
        # Load model weights
        model_path = os.path.join(os.path.dirname(__file__), "marathi_sentiment_model.pt")
        state_dict = torch.load(model_path, map_location=device)
        
        # Handle both full checkpoint and state_dict only formats
        if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
            model.load_state_dict(state_dict['model_state_dict'])
        else:
            model.load_state_dict(state_dict)
        
        # Move model to device
        model.to(device)
        model.eval()
        
        # Initialize preprocessor
        preprocessor = MarathiTextPreprocessor(remove_stopwords=True)
        
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

# Predict sentiment
def predict_sentiment(text):
    global model, tokenizer, preprocessor, model_info
    
    # Ensure model is loaded
    if model is None:
        if not load_model():
            raise HTTPException(status_code=500, detail="Failed to load model")
    
    # Preprocess text
    if preprocessor:
        text = preprocessor.process(text)
    
    # Tokenize text
    encoding = tokenizer(
        text,
        max_length=128,
        padding='max_length',
        truncation=True,
        return_tensors='pt'
    )
    
    # Move to device
    input_ids = encoding['input_ids'].to(device)
    attention_mask = encoding['attention_mask'].to(device)
    
    # Get prediction
    with torch.no_grad():
        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        logits = outputs['logits']
        probs = torch.softmax(logits, dim=1)
        pred = torch.argmax(logits, dim=1).item()
    
    # Map prediction to sentiment
    # Use class mapping from model_info if available
    class_mapping = model_info.get("class_mapping", None)
    if class_mapping:
        # Convert string keys to integers
        class_mapping = {int(k): v for k, v in class_mapping.items()}
        original_pred = class_mapping.get(pred, pred)
        sentiment_map = {-1: "Negative", 0: "Neutral", 1: "Positive"}
        sentiment = sentiment_map.get(original_pred, str(original_pred))
    else:
        sentiment_map = {0: "Negative", 1: "Neutral", 2: "Positive"}
        sentiment = sentiment_map.get(pred, str(pred))
    
    # Get confidence and probabilities
    confidence = probs[0][pred].item()
    probabilities = {sentiment_map.get(i, str(i)): probs[0][i].item() for i in range(len(probs[0]))}
    
    return {
        'sentiment': sentiment,
        'confidence': confidence,
        'probabilities': probabilities
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    # Load model info
    load_model_info()

# Error handler
@app.exception_handler(Exception)
async def exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": f"An error occurred: {str(exc)}"}
    )

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Marathi Sentiment Analysis API", "status": "active"}

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy"}

# Predict endpoint
@app.post("/predict", response_model=SentimentResponse)
async def predict(request: SentimentRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    result = predict_sentiment(request.text)
    return result

# Main function to run the app
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
