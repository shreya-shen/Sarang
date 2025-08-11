const fetch = require('node-fetch');
const NodeCache = require('node-cache');

// Cache for mood analysis results (1 hour TTL)
const moodCache = new NodeCache({ stdTTL: 3600 });

// Python service configuration
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
const SERVICE_TIMEOUT = 10000; // 10 seconds

// Check if Python service is available
const checkServiceHealth = async () => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      timeout: 3000
    });
    const health = await response.json();
    return health.models_loaded;
  } catch (error) {
    console.log('⚠️ Python service not available, falling back to process spawning');
    return false;
  }
};

// Fast HTTP-based sentiment analysis
const analyzeSentimentFast = async (text) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text }),
      timeout: SERVICE_TIMEOUT
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.sentiment_score;
  } catch (error) {
    throw new Error(`Fast sentiment analysis failed: ${error.message}`);
  }
};

// Fallback to original process spawning method
const analyzeSentimentFallback = (text) => {
  const { spawn } = require('child_process');
  const path = require('path');
  
  return new Promise((resolve, reject) => {
    const pythonDir = path.join(__dirname, '../python');
    const python = spawn('python', ['sentiment_analysis.py'], {
      cwd: pythonDir
    });

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python sentiment analysis failed: ${error}`));
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result.sentiment_score);
        } catch (err) {
          reject(new Error('Invalid JSON from Python sentiment analysis')); 
        }
      }
    });

    python.stdin.write(JSON.stringify({ text: text }));
    python.stdin.end();
  });
};

const analyzeSentiment = async (text) => {
  // Check cache first
  const cacheKey = `mood:${text.toLowerCase().trim()}`;
  const cachedResult = moodCache.get(cacheKey);
  if (cachedResult) {
    console.log('📋 Using cached sentiment result');
    return cachedResult;
  }

  let sentimentScore;
  
  // Try fast HTTP service first
  const serviceAvailable = await checkServiceHealth();
  
  if (serviceAvailable) {
    console.log('🚀 Using fast Python service');
    try {
      sentimentScore = await analyzeSentimentFast(text);
    } catch (error) {
      console.log('⚠️ Fast service failed, falling back to process spawning');
      sentimentScore = await analyzeSentimentFallback(text);
    }
  } else {
    console.log('🐌 Using fallback process spawning');
    sentimentScore = await analyzeSentimentFallback(text);
  }

  // Cache the result
  moodCache.set(cacheKey, sentimentScore);
  
  return sentimentScore;
};

module.exports = { analyzeSentiment };