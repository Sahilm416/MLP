from modal import App, Image, Mount, web_endpoint
from typing import Dict
import pickle
import re

# Define the Docker image to be used
image = Image.debian_slim().pip_install("scikit-learn", "pandas")

# Create a Modal Stub
app = App(name="sentiment-analysis", image=image)

@app.function(
    mounts=[
        Mount.from_local_file(
            "C:/Users/HPW/Documents/Megaproject/tweet_sentiment_pipeline.pkl", 
            remote_path='/root/model.pkl'
        )
    ]
)
@web_endpoint(label="sentiment-analysis", method="POST")
def predict_sentiment(info: Dict):
    # Load the trained model
    with open("/root/model.pkl", "rb") as f:
        model = pickle.load(f)

    # Extract and validate the input text
    text = info.get("tweet")
    if not text:
        return {"error": "No tweet provided."}

    # Preprocess the input text
    def clean_text(text):
        text = re.sub(r'http\S+|www\S+|pic\.twitter\.com\S*', '', text)  # Remove URLs
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\n+', ' ', text)  # Remove newlines
        text = text.lower()  # Convert to lowercase
        return text

    cleaned_text = [clean_text(text)]  # Wrap in a list for compatibility with the pipeline

    # Predict probabilities
    try:
        predicted_probs = model.predict_proba(cleaned_text).tolist()[0]  # Extract the first element
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

    # Check the number of classes and format the output
    probabilities = {}
    class_labels = ["Negative", "Neutral", "Positive"]  # Adjust based on your model's class labels
    for i, prob in enumerate(predicted_probs):
        probabilities[class_labels[i]] = prob

    # Return results
    return {
        "original_tweet": text,
        "cleaned_tweet": cleaned_text[0],
        "predicted_probabilities": probabilities
    }
