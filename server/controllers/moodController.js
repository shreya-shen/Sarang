const supabase = require('../utils/supabase');
const { analyzeSentiment, clearCache } = require('../services/sentimentService');
const { getOrCreateUserUUID } = require('../utils/userMapping');

const logMood = async (req, res) => {
  const { userId } = req.auth;
  const { text, sentiment_score, sentiment_label } = req.body;
  
  try {
    console.log('Logging mood for user:', userId);
    
    // Convert Clerk ID to UUID
    const userUUID = await getOrCreateUserUUID(userId);
    console.log('Using UUID:', userUUID, 'for Clerk ID:', userId);
    
    let finalSentimentScore = sentiment_score;
    let finalSentimentLabel = sentiment_label;
    
    if (!finalSentimentScore) {
      console.log('Analyzing sentiment for text:', text);
      const sentimentData = await analyzeSentiment(text);
      console.log('Sentiment analysis result:', sentimentData);

      finalSentimentScore = sentimentData.sentiment_score || sentimentData.score || 0;
      finalSentimentLabel = sentimentData.primary_emotion || sentimentData.label || 'neutral';
      
      console.log('Final sentiment - Score:', finalSentimentScore, 'Label:', finalSentimentLabel);
    }

    const { data, error } = await supabase.from('moods').insert([
      {
        userId: userUUID,
        inputText: text,
        sentimentScore: finalSentimentScore,
        created_at: new Date().toISOString()
      }
    ]).select().single();

    if (error) {
      console.error('Database error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error logging mood:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMoodHistory = async (req, res) => {
  const { userId } = req.auth;
  
  try {
    // Convert Clerk ID to UUID
    const userUUID = await getOrCreateUserUUID(userId);
    
    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .eq('userId', userUUID)
      .order('created_at', { ascending: false })
      .limit(50); // Get last 50 mood entries

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const analyzeMoodSentiment = async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    console.log('Analyzing sentiment with enhanced AI models for text:', text.substring(0, 100) + '...');
    const sentimentResult = await analyzeSentiment(text);
 
    let sentimentScore, confidence, label;
    
    if (typeof sentimentResult === 'object' && sentimentResult.sentiment_score !== undefined) {

      sentimentScore = sentimentResult.sentiment_score;
      confidence = sentimentResult.confidence || 0.8;
      label = sentimentResult.primary_emotion || (sentimentScore > 0 ? "positive" : "negative");
      
      console.log('Enhanced AI analysis result:', {
        score: sentimentScore,
        confidence: confidence,
        emotion: label,
        approach: sentimentResult.approach || 'Enhanced AI'
      });
    } else {
      sentimentScore = typeof sentimentResult === 'number' ? sentimentResult : 0;
      confidence = Math.min(0.95, 0.7 + Math.abs(sentimentScore) * 0.25);
      if (sentimentScore < -0.6) label = "Very Low";
      else if (sentimentScore < -0.3) label = "Low";
      else if (sentimentScore < -0.1) label = "Slightly Low";
      else if (sentimentScore < 0.1) label = "Neutral";
      else if (sentimentScore < 0.3) label = "Slightly Happy";
      else if (sentimentScore < 0.6) label = "Happy";
      else label = "Very Happy";
      
      console.log('Standard sentiment analysis result:', sentimentScore);
    }
    
    // Normalize score
    const normalizedScore = Math.max(-1, Math.min(1, sentimentScore));
    
    const result = {
      score: normalizedScore,
      label,
      confidence: Math.round(confidence * 100) / 100,
      enhanced_ai: typeof sentimentResult === 'object',
      accuracy_level: typeof sentimentResult === 'object' ? "High (AI-First)" : "Standard"
    };

    console.log('Sending enhanced sentiment result:', result);
    res.json(result);
  } catch (error) {
    console.error('Enhanced sentiment analysis error:', error.message);
    res.status(500).json({ 
      error: 'Failed to analyze sentiment: ' + error.message,
      fallback_available: true
    });
  }
};

const checkSchema = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({ error: error.message, hint: 'Check if moods table exists' });
    }

    res.json({ 
      sample_record: data[0] || null,
      columns_available: data[0] ? Object.keys(data[0]) : 'No data found',
      total_records: data.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const clearSentimentCache = async (req, res) => {
  try {
    clearCache();
    res.json({ success: true, message: 'Sentiment analysis cache cleared' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { logMood, getMoodHistory, analyzeMoodSentiment, checkSchema, clearSentimentCache };