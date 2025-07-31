const { 
  getSpotifyAuthUrl, 
  handleCallbackExchange, 
  fetchUserLikedTracks, 
  getAllUserLikedTracks,
  getAudioFeatures,
  createPlaylistForMood,
  playTrack,
  getUserDevices,
  hasActiveDevice,
  isSpotifyConnected,
  getSpotifyProfile,
  disconnectSpotify,
  getValidAccessToken,
  fetchUserTopTracks,
  testSpotifyConnection,
  searchTracks
} = require('../services/spotifyService');
const supabase = require('../utils/supabase');
const { getOrCreateUserUUID } = require('../utils/userMapping');

const authorizeSpotify = async (req, res) => {
  try {
    const { userId } = req.auth;
    const userUUID = await getOrCreateUserUUID(userId);
    const url = getSpotifyAuthUrl(userUUID);
    res.json({ authUrl: url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handleSpotifyCallback = async (req, res) => {
  const { code, state } = req.query;
  console.log('🎵 Spotify callback received:', { code: !!code, state });
  try {
    const result = await handleCallbackExchange(code, state);
    console.log('✅ Spotify callback successful, redirecting to:', `${process.env.CLIENT_URL || 'http://localhost:8080'}/settings?spotify=connected`);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:8080'}/settings?spotify=connected`);
  } catch (error) {
    console.error('❌ Spotify callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:8080'}/settings?spotify=error`);
  }
};

const getConnectionStatus = async (req, res) => {
  try {
    const { userId } = req.auth;
    console.log('📱 Checking Spotify status for user:', userId);
    const userUUID = await getOrCreateUserUUID(userId);
    console.log('📱 User UUID:', userUUID);
    const connected = await isSpotifyConnected(userUUID);
    console.log('📱 Spotify connected:', connected);
    
    let profile = null;
    if (connected) {
      profile = await getSpotifyProfile(userUUID);
      console.log('📱 Spotify profile:', profile);
    }
    
    res.json({ connected, profile });
  } catch (error) {
    console.error('❌ Error in getConnectionStatus:', error);
    res.status(500).json({ error: error.message });
  }
};

const fetchLikedSongs = async (req, res) => {
  const { userId } = req.auth;
  const { limit = 50, offset = 0 } = req.query;
  
  try {
    console.log('🎵 Fetching liked songs for user:', userId);
    const userUUID = await getOrCreateUserUUID(userId);
    const tracks = await fetchUserLikedTracks(userUUID, parseInt(limit), parseInt(offset));
    console.log('🎵 Successfully fetched', tracks.length, 'liked songs');
    res.json(tracks);
  } catch (error) {
    console.error('❌ Error fetching liked songs:', error.message);
    
    if (error.message.includes('403')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to access your Spotify library. Please reconnect your Spotify account with proper permissions.' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};

const grantTopTracksPermission = async (req, res) => {
  const { userId } = req.auth;
  
  try {
    console.log('🎵 Granting top tracks permission for user:', userId);
    const userUUID = await getOrCreateUserUUID(userId);
    
    // Fetch initial top 5 tracks
    const topTracks = await fetchUserTopTracks(userUUID, 5, 'medium_term');
    console.log('🎵 Fetched', topTracks.length, 'top tracks for initial setup');
    
    if (topTracks.length === 0) {
      return res.status(400).json({ 
        error: 'No top tracks found. Please listen to more music on Spotify first.',
        recommendation: 'Try listening to some music on Spotify and then grant permission again.'
      });
    }
    
    // Store permission in database
    await supabase
      .from('user_permissions')
      .upsert({
        user_id: userUUID,
        permission_type: 'top_tracks_access',
        granted: true,
        granted_at: new Date(),
        last_updated: new Date()
      });
    
    // Store initial top 5 tracks for personalization
    console.log('🎵 Storing initial top tracks for personalization...');
    for (const track of topTracks) {
      await supabase
        .from('user_preference_tracks')
        .upsert({
          user_id: userUUID,
          spotify_track_id: track.spotify_id,
          track_name: track.track_name,
          artist_name: track.artist_name,
          album_name: track.album_name,
          spotify_uri: track.spotify_uri,
          duration_ms: track.duration_ms,
          popularity: track.popularity,
          preference_type: 'top_track',
          updated_at: new Date()
        });
    }
    
    console.log('🎵 Successfully granted top tracks permission and stored initial data');
    res.json({ 
      message: 'Permission granted! Your top tracks will be updated weekly for personalized recommendations.',
      totalTracks: topTracks.length,
      tracks: topTracks.map(t => ({ name: t.track_name, artist: t.artist_name })),
      nextUpdate: 'Weekly automatic updates enabled'
    });
  } catch (error) {
    console.error('❌ Error granting top tracks permission:', error.message);
    
    if (error.message.includes('403')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to access your Spotify top tracks. Please reconnect your Spotify account.',
        recommendation: 'Try disconnecting and reconnecting your Spotify account with proper permissions.'
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};

const revokeTopTracksPermission = async (req, res) => {
  const { userId } = req.auth;
  
  try {
    console.log('🎵 Revoking top tracks permission for user:', userId);
    const userUUID = await getOrCreateUserUUID(userId);
    
    // Revoke permission
    await supabase
      .from('user_permissions')
      .upsert({
        user_id: userUUID,
        permission_type: 'top_tracks_access',
        granted: false,
        revoked_at: new Date(),
        last_updated: new Date()
      });
    
    // Optionally keep the existing preference tracks or remove them
    // For now, we'll keep them but stop updating
    console.log('🎵 Successfully revoked top tracks permission');
    
    res.json({ 
      message: 'Permission revoked. Weekly top tracks updates have been stopped.',
      note: 'Your existing preference data will remain for current personalization.'
    });
  } catch (error) {
    console.error('❌ Error revoking top tracks permission:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getTopTracksPermissionStatus = async (req, res) => {
  const { userId } = req.auth;
  
  try {
    const userUUID = await getOrCreateUserUUID(userId);
    
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userUUID)
      .eq('permission_type', 'top_tracks_access')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }
    
    const hasPermission = data?.granted || false;
    const lastUpdated = data?.last_updated || null;
    
    // Get current preference tracks count
    const { data: tracksData } = await supabase
      .from('user_preference_tracks')
      .select('id')
      .eq('user_id', userUUID);
    
    const tracksCount = tracksData?.length || 0;
    
    res.json({
      hasPermission,
      lastUpdated,
      tracksCount,
      status: hasPermission ? 'active' : 'inactive'
    });
  } catch (error) {
    console.error('❌ Error checking top tracks permission status:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const syncAllLikedSongs = async (req, res) => {
  const { userId } = req.auth;
  
  try {
    console.log('🎵 Fetching top 5 tracks for personalization for user:', userId);
    const userUUID = await getOrCreateUserUUID(userId);
    
    // Instead of all liked songs, get top 5 tracks for personalization
    const topTracks = await fetchUserTopTracks(userUUID, 5, 'medium_term');
    console.log('🎵 Fetched', topTracks.length, 'top tracks for personalization');
    
    if (topTracks.length === 0) {
      return res.json({ 
        message: 'No top tracks found for personalization',
        totalTracks: 0,
        recommendation: 'Try listening to more music on Spotify first'
      });
    }
    
    // Store only the top 5 tracks for personalization
    console.log('🎵 Storing top tracks for personalization...');
    for (const track of topTracks) {
      await supabase
        .from('user_preference_tracks')
        .upsert({
          user_id: userUUID,
          spotify_track_id: track.spotify_id,
          track_name: track.track_name,
          artist_name: track.artist_name,
          album_name: track.album_name,
          spotify_uri: track.spotify_uri,
          duration_ms: track.duration_ms,
          popularity: track.popularity,
          preference_type: 'top_track',
          updated_at: new Date()
        });
    }
    
    console.log('🎵 Successfully stored top tracks for personalization');
    res.json({ 
      message: 'Top tracks imported successfully for personalized recommendations',
      totalTracks: topTracks.length,
      tracks: topTracks.map(t => ({ name: t.track_name, artist: t.artist_name }))
    });
  } catch (error) {
    console.error('❌ Error importing top tracks:', error.message);
    
    if (error.message.includes('403')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to access your Spotify top tracks. Please reconnect your Spotify account with proper permissions.',
        recommendation: 'Try disconnecting and reconnecting your Spotify account'
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};

const createMoodPlaylist = async (req, res) => {
  const { userId } = req.auth;
  const { moodText, tracks } = req.body;
  
  try {
    console.log('🎵 Creating mood playlist for user:', userId);
    console.log('🎵 Mood text:', moodText);
    console.log('🎵 Number of tracks:', tracks?.length || 0);
    console.log('🎵 Sample track structure:', tracks?.[0] ? Object.keys(tracks[0]) : 'No tracks');
    
    if (!moodText || !tracks || tracks.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: moodText and tracks' });
    }
    
    const userUUID = await getOrCreateUserUUID(userId);
    
    // Convert tracks to Spotify URIs by searching for them if needed
    const trackUris = [];
    
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      try {
        if (typeof track === 'string') {
          // If it's already a URI, use it; otherwise assume it's a track ID
          trackUris.push(track.startsWith('spotify:track:') ? track : `spotify:track:${track}`);
        } else if (track && typeof track === 'object') {
          // Check for various possible properties in the track object
          const trackId = track.uri || track.id || track.track_id || track.trackId || track.spotify_id;
          
          if (trackId) {
            // If it's already a URI, use it; otherwise convert to URI
            trackUris.push(trackId.startsWith('spotify:track:') ? trackId : `spotify:track:${trackId}`);
          } else if (track.track_name && track.artist_name) {
            // Search for the track on Spotify using name and artist
            console.log(`🔍 Searching for track: "${track.track_name}" by "${track.artist_name}"`);
            const searchQuery = `track:"${track.track_name}" artist:"${track.artist_name}"`;
            
            // Use the service function instead of direct API call
            const searchResult = await searchTracks(userUUID, searchQuery, 1);
            
            if (searchResult && searchResult.length > 0) {
              const foundTrack = searchResult[0];
              trackUris.push(foundTrack.uri);
              console.log(`✅ Found track: ${foundTrack.name} by ${foundTrack.artists[0].name}`);
            } else {
              console.warn(`⚠️ Track not found on Spotify: "${track.track_name}" by "${track.artist_name}"`);
              // Skip this track instead of failing the entire playlist
              continue;
            }
          } else {
            // Log the track structure for debugging
            console.log(`🔍 Track ${i} structure:`, Object.keys(track));
            throw new Error(`Track ${i} missing required fields. Available fields: ${Object.keys(track).join(', ')}`);
          }
        } else {
          throw new Error(`Track ${i} is neither string nor object: ${typeof track}`);
        }
      } catch (err) {
        console.error(`❌ Error processing track ${i}:`, err.message);
        console.error(`❌ Track data:`, track);
        // Continue with other tracks instead of failing entirely
        console.warn(`⚠️ Skipping track ${i} due to error: ${err.message}`);
        continue;
      }
    }
    
    console.log(`🎵 Successfully processed ${trackUris.length} out of ${tracks.length} tracks`);
    console.log('🎵 Sample track URIs:', trackUris.slice(0, 3), '...');
    
    if (trackUris.length === 0) {
      return res.status(400).json({ 
        error: 'No tracks could be found on Spotify. Please check track names and artist names.',
        suggestion: 'Make sure the track and artist names are spelled correctly and exist on Spotify.'
      });
    }
    
    const playlistName = `Sarang - ${moodText}`;
    const description = `A mood-based playlist created by Sarang for: ${moodText}. Contains ${trackUris.length} tracks.`;
    
    const result = await createPlaylistForMood(userUUID, playlistName, trackUris, description);
    
    // Store playlist info in database
    await supabase
      .from('user_playlists')
      .insert({
        user_id: userUUID,
        playlist_name: result.playlist_name,
        spotify_playlist_id: result.playlist_id,
        spotify_playlist_url: result.playlist_url,
        mood_context: moodText,
        track_count: result.tracks_added || trackUris.length
      });
    
    res.json(result);
  } catch (error) {
    console.error('❌ Create mood playlist error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const playTrackOnSpotify = async (req, res) => {
  const { userId } = req.auth;
  const { trackUri, deviceId } = req.body;
  
  try {
    const userUUID = await getOrCreateUserUUID(userId);
    const result = await playTrack(userUUID, trackUri, deviceId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAvailableDevices = async (req, res) => {
  const { userId } = req.auth;
  
  try {
    const userUUID = await getOrCreateUserUUID(userId);
    const devices = await getUserDevices(userUUID);
    res.json(devices);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const disconnectSpotifyAccount = async (req, res) => {
  const { userId } = req.auth;
  
  try {
    const userUUID = await getOrCreateUserUUID(userId);
    await disconnectSpotify(userUUID);
    res.json({ message: 'Spotify account disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserPlaylists = async (req, res) => {
  const { userId } = req.auth;
  
  try {
    const userUUID = await getOrCreateUserUUID(userId);
    const { data, error } = await supabase
      .from('user_playlists')
      .select('*')
      .eq('user_id', userUUID)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's preference tracks for recommendations
const getUserPreferenceTracks = async (userId) => {
  try {
    const userUUID = await getOrCreateUserUUID(userId);
    
    const { data, error } = await supabase
      .from('user_preference_tracks')
      .select('*')
      .eq('user_id', userUUID)
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching user preference tracks:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error in getUserPreferenceTracks:', error.message);
    return [];
  }
};

const checkActiveDevices = async (req, res) => {
  try {
    const { userId } = req.auth;
    const userUUID = await getOrCreateUserUUID(userId);
    const hasActive = await hasActiveDevice(userUUID);
    
    res.json({ hasActiveDevice: hasActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const testSpotifyConnectionEndpoint = async (req, res) => {
  try {
    const { userId } = req.auth;
    const userUUID = await getOrCreateUserUUID(userId);
    
    console.log('🧪 Testing Spotify connection for user:', userUUID);
    
    // Use the service function to test connection
    const result = await testSpotifyConnection(userUUID);
    
    res.json({
      success: true,
      message: 'Spotify connection is working properly',
      spotifyUser: {
        id: result.id,
        displayName: result.user
      }
    });
    
  } catch (error) {
    console.error('🧪 Spotify connection test failed:', error);
    res.json({
      success: false,
      error: error.message,
      suggestion: 'Check server logs for more details'
    });
  }
};

const fetchTopTracks = async (req, res) => {
  const { userId } = req.auth;
  const { limit = 50, timeRange = 'medium_term' } = req.query;
  
  try {
    console.log('🎵 Fetching top tracks for user:', userId);
    const userUUID = await getOrCreateUserUUID(userId);
    const tracks = await fetchUserTopTracks(userUUID, parseInt(limit), timeRange);
    console.log('🎵 Successfully fetched', tracks.length, 'top tracks');
    res.json(tracks);
  } catch (error) {
    console.error('❌ Error fetching top tracks:', error.message);
    
    if (error.message.includes('403')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to access your Spotify top tracks. Please reconnect your Spotify account with proper permissions.' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  authorizeSpotify,
  handleSpotifyCallback,
  getConnectionStatus,
  fetchLikedSongs,
  syncAllLikedSongs,
  createMoodPlaylist,
  playTrackOnSpotify,
  getAvailableDevices,
  checkActiveDevices,
  disconnectSpotifyAccount,
  getUserPlaylists,
  fetchTopTracks,
  getUserPreferenceTracks,
  grantTopTracksPermission,
  revokeTopTracksPermission,
  getTopTracksPermissionStatus,
  testSpotifyConnectionEndpoint
};