# Optimization Recommendations for Sarang Mood Analysis

## Current Performance Issues

### 1. Python Process Overhead
- Each mood analysis spawns a new Python process
- Models are loaded from scratch every time
- Heavy imports happen on each request

### 2. Model Loading Bottlenecks
- DistilBERT model loading: ~2-3 seconds
- spaCy model loading: ~1-2 seconds  
- Dataset loading: ~1-2 seconds
- K-means clustering: ~0.5-1 seconds

## Immediate Optimizations

### 1. Implement Python Service with Model Caching
Instead of spawning processes, run a persistent Python service:

```python
# sentiment_service.py - Persistent service
import asyncio
import json
from transformers import pipeline
import spacy
import pandas as pd
from sklearn.cluster import KMeans
import uvicorn
from fastapi import FastAPI

# Load models once at startup
app = FastAPI()
sentiment_model = None
nlp = None
df = None
kmeans = None

@app.on_event("startup")
async def startup_event():
    global sentiment_model, nlp, df, kmeans
    print("Loading models...")
    sentiment_model = pipeline("sentiment-analysis", 
                             model="distilbert/distilbert-base-uncased-finetuned-sst-2-english")
    nlp = spacy.load("en_core_web_sm")
    df = pd.read_csv("./cleaned_spotify.csv")
    # Pre-compute clustering
    kmeans = KMeans(n_clusters=7, random_state=42, n_init=10)
    # ... clustering setup
    print("Models loaded successfully!")

@app.post("/analyze")
async def analyze_mood(data: dict):
    # Fast analysis using pre-loaded models
    sentiment_score = get_sentiment(data["text"])
    return {"sentiment_score": sentiment_score}

@app.post("/recommend")
async def get_recommendations(data: dict):
    # Fast recommendations using pre-loaded models
    recommendations = recommend_songs(df, data["sentiment_score"], kmeans)
    return {"recommendations": recommendations}
```

### 2. Update Node.js to Use HTTP Endpoints
Replace process spawning with HTTP requests:

```javascript
// sentimentService.js - Updated
const fetch = require('node-fetch');

const PYTHON_SERVICE_URL = 'http://localhost:8001';

const analyzeSentiment = async (text) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text }),
      timeout: 5000 // 5 second timeout
    });
    
    const result = await response.json();
    return result.sentiment_score;
  } catch (error) {
    throw new Error(`Sentiment analysis failed: ${error.message}`);
  }
};
```

### 3. Add Response Caching
Cache similar mood inputs to avoid recomputation:

```javascript
// Add to moodController.js
const NodeCache = require('node-cache');
const moodCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

const analyzeMoodSentiment = async (req, res) => {
  const { text } = req.body;
  
  // Check cache first
  const cacheKey = `mood:${text.toLowerCase().trim()}`;
  const cachedResult = moodCache.get(cacheKey);
  if (cachedResult) {
    return res.json(cachedResult);
  }
  
  // ... existing analysis code ...
  
  // Cache the result
  moodCache.set(cacheKey, result);
  res.json(result);
};
```

### 4. Optimize Model Loading
Use smaller, faster models for real-time analysis:

```python
# Use smaller models for speed
# Instead of DistilBERT, use a lighter model:
sentiment_model = pipeline("sentiment-analysis", 
                          model="cardiffnlp/twitter-roberta-base-sentiment-latest")

# Or use VADER sentiment (much faster):
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
analyzer = SentimentIntensityAnalyzer()

def get_sentiment_fast(text):
    scores = analyzer.polarity_scores(text)
    return scores['compound']  # Returns -1 to 1 scale
```

## Advanced Optimizations

### 1. Database Connection Pooling
```javascript
// Implement connection pooling for faster DB access
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.SUPABASE_HOST,
  database: process.env.SUPABASE_DB,
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  port: process.env.SUPABASE_PORT,
  max: 10, // max clients in pool
  idleTimeoutMillis: 30000,
});
```

### 2. Pre-compute User Preferences
Cache user preference data instead of querying on each request:

```python
# Add to startup process
@app.on_event("startup")
async def cache_user_preferences():
    global user_preferences_cache
    # Pre-load frequently accessed user preferences
    user_preferences_cache = {}
```

### 3. Async Processing
Make mood analysis non-blocking:

```javascript
// In the frontend, show immediate feedback
const analyzeMood = async () => {
  setIsAnalyzing(true);
  toast.info("Analyzing your mood...");
  
  try {
    // Start analysis
    const response = await fetch('/api/mood/analyze-async', {
      method: 'POST',
      body: JSON.stringify({ text: moodText })
    });
    
    const { taskId } = await response.json();
    
    // Poll for results
    const result = await pollForResult(taskId);
    setSentiment(result);
    
  } catch (error) {
    toast.error("Analysis failed");
  } finally {
    setIsAnalyzing(false);
  }
};
```

## Expected Performance Improvements

### Before Optimization:
- **Cold start**: 8-12 seconds
- **Subsequent requests**: 5-8 seconds
- **Models loaded**: Every request

### After Optimization:
- **Service startup**: 10-15 seconds (one time)
- **First request**: 1-2 seconds
- **Subsequent requests**: 0.5-1 seconds
- **Models loaded**: Once at startup

## Implementation Priority

1. **High Priority**: Persistent Python service with model caching
2. **Medium Priority**: Response caching for similar inputs
3. **Low Priority**: Database connection pooling and async processing

These optimizations should reduce mood analysis time from 5-8 seconds to under 2 seconds, with most requests completing in under 1 second.
