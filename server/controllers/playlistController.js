const { generateRecommendations } = require('../services/recommendationService');
const supabase = require('../utils/supabase');
const { getOrCreateUserUUID } = require('../utils/userMapping');

const generatePlaylist = async (req, res) => {
  const { userId } = req.auth;
  const { moodText, preferences } = req.body;
  
  try {
    console.log('Generating playlist for user:', userId);
    console.log('Mood text:', moodText);
    console.log('Preferences:', preferences);
    
    // Convert Clerk ID to UUID
    const userUUID = await getOrCreateUserUUID(userId);
    
    const playlist = await generateRecommendations(moodText, preferences);
    console.log('Generated playlist:', playlist);
    console.log('Playlist recommendations:', playlist?.recommendations);
    
    // Validate that playlist has recommendations
    if (!playlist || (!playlist.recommendations && !playlist.tracks)) {
      throw new Error('No recommendations generated from Python service');
    }
    
    // Handle both old and new response formats
    const recommendations = playlist.recommendations || playlist.tracks || [];
    const sentimentScore = playlist.sentiment_score || playlist.mood_analysis?.sentiment_score || 0;
    
    // Store playlist in database using your existing schema
    const { data: playlistData, error: playlistError } = await supabase
      .from('playlists')
      .insert([
        {
          userId: userUUID, // Use generated UUID
          inputText: moodText, // Match your schema: camelCase
          songData: { // Match your schema: camelCase
            sentiment_score: sentimentScore,
            primary_emotion: playlist.primary_emotion || playlist.mood_analysis?.primary_emotion || 'neutral',
            method: playlist.method || 'unknown',
            confidence: playlist.confidence || playlist.mood_analysis?.confidence || 0.5,
            recommendations: recommendations, // Use 'recommendations' instead of 'tracks'
            generated_at: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (playlistError) {
      console.error('Error storing playlist:', playlistError);
      // Still return the playlist even if storage fails
    } else {
      console.log('Playlist stored successfully:', playlistData.id);
    }

    res.json(playlist);
  } catch (err) {
    console.error('Error generating playlist:', err);
    res.status(500).json({ error: err.message });
  }
};

const getPlaylistHistory = async (req, res) => {
  const { userId } = req.auth;
  
  try {
    // Convert Clerk ID to UUID
    const userUUID = await getOrCreateUserUUID(userId);
    
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('userId', userUUID) // Use generated UUID
      .order('created_at', { ascending: false })
      .limit(20); // Get last 20 playlists

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { generatePlaylist, getPlaylistHistory };