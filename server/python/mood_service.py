"""
FastAPI service for persistent mood analysis with pre-loaded models
This eliminates the overhead of loading models on each request
"""
import asyncio
import json
import os
import sys
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Add the current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Global variables for models
app = FastAPI(title="Sarang Mood Analysis Service", version="1.0.0")
sentiment_model = None
nlp = None
df = None
kmeans = None
scaler = None

class MoodRequest(BaseModel):
    text: str
    user_id: str = None

class RecommendationRequest(BaseModel):
    sentiment_score: float
    user_id: str = None

# Store initialization status
models_loaded = False

@app.on_event("startup")
async def startup_event():
    """Load all models once at startup"""
    global sentiment_model, nlp, df, kmeans, scaler, models_loaded
    
    try:
        print("🚀 Starting Sarang Mood Analysis Service...")
        print("📦 Loading models (this may take 10-15 seconds)...")
        
        # Import heavy libraries after startup message
        from transformers import pipeline
        import spacy
        import pandas as pd
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import StandardScaler
        import numpy as np
        
        # Load sentiment analysis model
        print("📊 Loading sentiment analysis model...")
        sentiment_model = pipeline(
            "sentiment-analysis", 
            model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
            return_all_scores=True
        )
        
        # Load spaCy model
        print("🧠 Loading spaCy NLP model...")
        nlp = spacy.load("en_core_web_sm")
        
        # Load dataset
        print("📈 Loading Spotify dataset...")
        df = pd.read_csv("./cleaned_spotify.csv")
        print(f"✅ Loaded {len(df)} tracks")
        
        # Pre-compute clustering
        print("🎯 Setting up music clustering...")
        feature_columns = [
            'valence', 'energy', 'danceability', 'acousticness', 'instrumentalness',
            'liveness', 'speechiness', 'tempo', 'loudness', 'mode', 'key',
            'time_signature', 'duration_ms', 'popularity', 'explicit'
        ]
        
        # Prepare features for clustering
        features = df[feature_columns].fillna(df[feature_columns].mean())
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        # Fit K-means model
        kmeans = KMeans(n_clusters=7, random_state=42, n_init=10)
        kmeans.fit(features_scaled)
        
        # Add cluster labels to dataframe
        df['cluster'] = kmeans.labels_
        
        models_loaded = True
        print("✅ All models loaded successfully!")
        print("🎵 Sarang Mood Analysis Service is ready!")
        
    except Exception as e:
        print(f"❌ Error loading models: {str(e)}")
        models_loaded = False
        raise e

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if models_loaded else "loading",
        "models_loaded": models_loaded,
        "service": "Sarang Mood Analysis Service"
    }

@app.post("/analyze")
async def analyze_mood(request: MoodRequest):
    """Fast mood analysis using pre-loaded models"""
    global sentiment_model, nlp
    
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models are still loading")
    
    try:
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Get sentiment using pre-loaded model
        sentiment_results = sentiment_model(text) # type: ignore
        
        # Extract confidence scores
        positive_score = next((item['score'] for item in sentiment_results[0] if item['label'] == 'POSITIVE'), 0) # type: ignore
        negative_score = next((item['score'] for item in sentiment_results[0] if item['label'] == 'NEGATIVE'), 0) # type: ignore
        
        # Calculate sentiment score (-1 to 1)
        sentiment_score = positive_score - negative_score
        
        # Process with spaCy for additional insights
        doc = nlp(text)
        entities = [(ent.text, ent.label_) for ent in doc.ents]
        
        return {
            "sentiment_score": sentiment_score,
            "confidence": max(positive_score, negative_score),
            "label": "positive" if sentiment_score > 0 else "negative",
            "entities": entities,
            "processing_time": "< 1 second"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/recommend")
async def get_recommendations(request: RecommendationRequest):
    """Fast music recommendations using pre-loaded models"""
    global df, kmeans, scaler
    
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models are still loading")
    
    try:
        sentiment_score = request.sentiment_score
        
        # Map sentiment to music features
        target_valence = (sentiment_score + 1) / 2  # Convert -1,1 to 0,1
        target_energy = max(0.3, target_valence)    # Ensure minimum energy
        
        # Create target feature vector
        target_features = [
            target_valence, target_energy, target_valence * 0.8, 0.5, 0.3,
            0.2, 0.1, 120, -10, 1, 5, 4, 200000, 50, 0
        ]
        
        # Scale target features
        target_scaled = scaler.transform([target_features])
        
        # Get cluster prediction
        target_cluster = kmeans.predict(target_scaled)[0]
        
        # Get songs from the same cluster
        cluster_songs = df[df['cluster'] == target_cluster].copy()
        
        # Calculate similarity scores
        feature_columns = [
            'valence', 'energy', 'danceability', 'acousticness', 'instrumentalness',
            'liveness', 'speechiness', 'tempo', 'loudness', 'mode', 'key',
            'time_signature', 'duration_ms', 'popularity', 'explicit'
        ]
        
        # Simple similarity calculation
        cluster_songs['similarity'] = (
            abs(cluster_songs['valence'] - target_valence) * -1 +
            abs(cluster_songs['energy'] - target_energy) * -1 + 1
        )
        
        # Get top recommendations
        recommendations = cluster_songs.nlargest(20, 'similarity')[
            ['track_name', 'artist_name', 'valence', 'energy', 'similarity']
        ].to_dict('records')
        
        return {
            "recommendations": recommendations,
            "target_cluster": int(target_cluster),
            "sentiment_mapping": {
                "sentiment_score": sentiment_score,
                "target_valence": target_valence,
                "target_energy": target_energy
            },
            "processing_time": "< 1 second"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")

@app.post("/analyze-and-recommend")
async def analyze_and_recommend(request: MoodRequest):
    """Combined endpoint for mood analysis and recommendations"""
    # Analyze mood
    mood_result = await analyze_mood(request)
    
    # Get recommendations
    rec_request = RecommendationRequest(
        sentiment_score=mood_result["sentiment_score"],
        user_id=request.user_id
    )
    rec_result = await get_recommendations(rec_request)
    
    return {
        "analysis": mood_result,
        "recommendations": rec_result["recommendations"],
        "processing_time": "< 2 seconds total"
    }

if __name__ == "__main__":
    print("🎵 Starting Sarang Mood Analysis Service...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
