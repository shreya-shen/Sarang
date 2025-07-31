const SpotifyWebApi = require('spotify-web-api-node');
const supabase = require('../utils/supabase');

// Spotify API configuration
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Scopes required for the application
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-top-read',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-modify-playback-state',
  'user-read-playback-state'
];

/**
 * Generate Spotify authorization URL
 */
const getSpotifyAuthUrl = (userUUID) => {
  const state = userUUID; // Use userUUID as state for callback verification
  return spotifyApi.createAuthorizeURL(scopes, state);
};

/**
 * Handle Spotify OAuth callback and exchange code for tokens
 */
const handleCallbackExchange = async (code, state) => {
  try {
    console.log('🎵 Exchanging authorization code for tokens');
    
    // Use promise-based approach instead of async/await to avoid callback issues
    const data = await new Promise((resolve, reject) => {
      spotifyApi.authorizationCodeGrant(code, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;
    const expiresIn = data.body.expires_in;
    
    // Set tokens to get user info
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
    
    // Get user profile
    const userProfile = await new Promise((resolve, reject) => {
      spotifyApi.getMe((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    const spotifyUserId = userProfile.body.id;
    const displayName = userProfile.body.display_name;
    const email = userProfile.body.email;
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    
    // Store tokens in database
    const { error } = await supabase
      .from('spotify_tokens')
      .upsert({
        user_id: state, // userUUID from state parameter
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        spotify_user_id: spotifyUserId,
        spotify_display_name: displayName,
        spotify_email: email,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(`Failed to store Spotify tokens: ${error.message}`);
    }
    
    console.log('✅ Spotify tokens stored successfully');
    return { success: true, spotifyUserId, displayName };
    
  } catch (error) {
    console.error('❌ Error in Spotify callback exchange:', error);
    throw new Error(`Spotify authorization failed: ${error.message}`);
  }
};

/**
 * Get valid access token (refresh if needed)
 */
const getValidAccessToken = async (userUUID) => {
  try {
    console.log('🔑 Getting access token for user:', userUUID);
    
    const { data, error } = await supabase
      .from('spotify_tokens')
      .select('*')
      .eq('user_id', userUUID)
      .single();
    
    if (error || !data) {
      console.error('🔑 No Spotify tokens found for user:', userUUID);
      console.error('🔑 Database error:', error);
      throw new Error('No Spotify tokens found. Please reconnect your account.');
    }
    
    console.log('🔑 Token found, expires at:', data.expires_at);
    
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    // If token is still valid, return it
    if (now < expiresAt) {
      console.log('🔑 Token is still valid, returning existing token');
      return data.access_token;
    }
    
    // Token expired, refresh it
    console.log('🔄 Token expired, refreshing...');
    spotifyApi.setRefreshToken(data.refresh_token);
    
    try {
      const refreshData = await new Promise((resolve, reject) => {
        spotifyApi.refreshAccessToken((err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      console.log('🔄 Token refresh successful');
      
      const newAccessToken = refreshData.body.access_token;
      const newExpiresIn = refreshData.body.expires_in;
      const newExpiresAt = new Date(Date.now() + newExpiresIn * 1000).toISOString();
      
      // Update token in database
      const { error: updateError } = await supabase
        .from('spotify_tokens')
        .update({
          access_token: newAccessToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userUUID);
      
      if (updateError) {
        console.error('🔄 Error updating token in database:', updateError);
      } else {
        console.log('🔄 Token updated in database successfully');
      }
      
      return newAccessToken;
    } catch (refreshError) {
      console.error('🔄 Error refreshing token:', refreshError);
      throw new Error('Failed to refresh Spotify token. Please reconnect your account.');
    }
    
  } catch (error) {
    console.error('❌ Error getting valid access token:', error);
    throw new Error(`Failed to get valid Spotify token: ${error.message}`);
  }
};

/**
 * Check if user has connected Spotify
 */
const isSpotifyConnected = async (userUUID) => {
  try {
    const { data, error } = await supabase
      .from('spotify_tokens')
      .select('access_token')
      .eq('user_id', userUUID)
      .single();
    
    return !error && data && data.access_token;
  } catch (error) {
    return false;
  }
};

/**
 * Get Spotify user profile
 */
const getSpotifyProfile = async (userUUID) => {
  try {
    const accessToken = await getValidAccessToken(userUUID);
    spotifyApi.setAccessToken(accessToken);
    
    const userProfile = await new Promise((resolve, reject) => {
      spotifyApi.getMe((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    if (!userProfile || !userProfile.body) {
      throw new Error('Invalid response from Spotify API');
    }
    
    return {
      id: userProfile.body.id,
      display_name: userProfile.body.display_name,
      email: userProfile.body.email,
      followers: userProfile.body.followers?.total || 0,
      images: userProfile.body.images || []
    };
  } catch (error) {
    console.error('Error in getSpotifyProfile:', error);
    throw new Error(`Failed to get Spotify profile: ${error.message}`);
  }
};

/**
 * Fetch user's liked tracks
 */
const fetchUserLikedTracks = async (userUUID, limit = 50, offset = 0) => {
  try {
    const accessToken = await getValidAccessToken(userUUID);
    spotifyApi.setAccessToken(accessToken);
    
    const data = await new Promise((resolve, reject) => {
      spotifyApi.getMySavedTracks({ limit, offset }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    if (!data || !data.body || !data.body.items) {
      throw new Error('Invalid response from Spotify API');
    }
    
    return data.body.items.map(item => ({
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map(artist => artist.name),
      album: item.track.album.name,
      duration_ms: item.track.duration_ms,
      popularity: item.track.popularity,
      uri: item.track.uri,
      added_at: item.added_at
    }));
  } catch (error) {
    console.error('Error in fetchUserLikedTracks:', error);
    throw new Error(`Failed to fetch liked tracks: ${error.message}`);
  }
};

/**
 * Get all user's liked tracks (paginated)
 */
const getAllUserLikedTracks = async (userUUID) => {
  const allTracks = [];
  let offset = 0;
  const limit = 50;
  
  try {
    while (true) {
      const tracks = await fetchUserLikedTracks(userUUID, limit, offset);
      allTracks.push(...tracks);
      
      if (tracks.length < limit) {
        break; // No more tracks
      }
      
      offset += limit;
    }
    
    return allTracks;
  } catch (error) {
    throw new Error(`Failed to fetch all liked tracks: ${error.message}`);
  }
};

/**
 * Fetch user's top tracks
 */
const fetchUserTopTracks = async (userUUID, limit = 20, timeRange = 'medium_term') => {
  try {
    const accessToken = await getValidAccessToken(userUUID);
    spotifyApi.setAccessToken(accessToken);
    
    const data = await new Promise((resolve, reject) => {
      spotifyApi.getMyTopTracks({ limit, time_range: timeRange }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    if (!data || !data.body || !data.body.items) {
      throw new Error('Invalid response from Spotify API');
    }
    
    return data.body.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name),
      album: track.album.name,
      duration_ms: track.duration_ms,
      popularity: track.popularity,
      uri: track.uri
    }));
  } catch (error) {
    console.error('Error in fetchUserTopTracks:', error);
    throw new Error(`Failed to fetch top tracks: ${error.message}`);
  }
};

/**
 * Get audio features for tracks
 */
const getAudioFeatures = async (userUUID, trackIds) => {
  try {
    const accessToken = await getValidAccessToken(userUUID);
    spotifyApi.setAccessToken(accessToken);
    
    const data = await new Promise((resolve, reject) => {
      spotifyApi.getAudioFeaturesForTracks(trackIds, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    return data.body.audio_features;
  } catch (error) {
    throw new Error(`Failed to get audio features: ${error.message}`);
  }
};

/**
 * Create a playlist for mood
 */
const createPlaylistForMood = async (userUUID, playlistName, trackUris, description = '') => {
  try {
    console.log('🎵 Creating playlist:', playlistName, 'with', trackUris?.length || 0, 'tracks');
    
    const accessToken = await getValidAccessToken(userUUID);
    spotifyApi.setAccessToken(accessToken);
    
    // Get user profile to create playlist
    console.log('🎵 Getting user profile...');
    const userProfile = await new Promise((resolve, reject) => {
      spotifyApi.getMe((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    if (!userProfile) {
      throw new Error('No response from Spotify when getting user profile');
    }
    if (!userProfile.body) {
      console.error('Spotify user profile response:', userProfile);
      throw new Error('Invalid user profile response structure from Spotify');
    }
    const userId = userProfile.body.id;
    console.log('🎵 User ID:', userId);
    
    // Create playlist with more detailed error handling
    console.log('🎵 Creating playlist on Spotify...');
    let playlistData;
    
    // Try direct promise approach first
    try {
      console.log('🎵 Trying direct promise approach for createPlaylist...');
      console.log('🎵 Parameters:', { userId, playlistName, description });
      
      // Try the method without userId parameter (let it use the current user)
      playlistData = await spotifyApi.createPlaylist(playlistName, {
        description,
        public: false
      });
      
      console.log('✅ Direct promise approach worked!');
      console.log('🎵 Raw playlist response:', playlistData);
      
      // Check if we got a direct response instead of wrapped response
      if (playlistData && playlistData.id) {
        // Direct response - wrap it
        console.log('🎵 Got direct response, wrapping in body structure');
        playlistData = { body: playlistData };
      } else if (!playlistData) {
        // Try with userId parameter
        console.log('🎵 Trying with userId parameter...');
        playlistData = await spotifyApi.createPlaylist(userId, playlistName, {
          description,
          public: false
        });
        console.log('🎵 Response with userId:', playlistData);
        
        if (playlistData && playlistData.id) {
          playlistData = { body: playlistData };
        }
      }
    } catch (directError) {
      console.error('❌ Direct promise approach failed:', directError);
      
      // Fallback to callback approach
      try {
        console.log('🎵 Trying callback approach for createPlaylist...');
        playlistData = await new Promise((resolve, reject) => {
          spotifyApi.createPlaylist(userId, playlistName, {
            description,
            public: false
          }, (err, data) => {
            if (err) {
              console.error('CreatePlaylist callback error (fallback):', err);
              reject(err);
            } else {
              console.log('✅ Callback approach worked!');
              resolve(data);
            }
          });
        });
      } catch (callbackError) {
        console.error('❌ Both approaches failed');
        console.error('DirectError:', directError);
        console.error('CallbackError:', callbackError);
        
        if (callbackError.statusCode === 401) {
          throw new Error('Spotify authentication failed. Please reconnect your account.');
        } else if (callbackError.statusCode === 403) {
          throw new Error('Insufficient permissions to create playlists. Please reconnect with proper permissions.');
        } else if (callbackError.statusCode === 429) {
          throw new Error('Rate limited by Spotify. Please try again in a few minutes.');
        }
        throw new Error(`Spotify API error (${callbackError.statusCode}): ${callbackError.message}`);
      }
    }
    
    if (!playlistData) {
      throw new Error('No response from Spotify when creating playlist');
    }
    
    console.log('🎵 Playlist creation response:', JSON.stringify(playlistData, null, 2));
    
    if (!playlistData.body) {
      console.error('Spotify playlist creation response:', playlistData);
      throw new Error('Invalid playlist creation response structure from Spotify');
    }
    
    const playlistId = playlistData.body.id;
    const playlistUrl = playlistData.body.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}`;
    
    console.log('✅ Playlist created successfully:', playlistId);
    
    // Add tracks to playlist
    let tracksAdded = 0;
    if (trackUris && trackUris.length > 0) {
      try {
        console.log('🎵 Adding', trackUris.length, 'tracks to playlist...');
        console.log('🎵 Trying direct promise approach for addTracksToPlaylist...');
        
        await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
        
        tracksAdded = trackUris.length;
        console.log('✅ Successfully added', tracksAdded, 'tracks to playlist');
      } catch (addError) {
        console.warn('⚠️ Failed to add some tracks to playlist:', addError.message);
        // Continue anyway, playlist was created successfully
      }
    }
    
    return {
      id: playlistId,
      playlist_id: playlistId,  // For backward compatibility
      name: playlistName,
      playlist_name: playlistName,  // For backward compatibility
      url: playlistUrl,
      playlist_url: playlistUrl,  // For backward compatibility
      tracks_added: tracksAdded
    };
  } catch (error) {
    console.error('❌ Error in createPlaylistForMood:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    });
    throw new Error(`Failed to create playlist: ${error.message}`);
  }
};

/**
 * Get user's available devices
 */
const getUserDevices = async (userUUID) => {
  try {
    const accessToken = await getValidAccessToken(userUUID);
    spotifyApi.setAccessToken(accessToken);
    
    const data = await new Promise((resolve, reject) => {
      spotifyApi.getMyDevices((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    return data.body.devices;
  } catch (error) {
    throw new Error(`Failed to get devices: ${error.message}`);
  }
};

/**
 * Check if user has an active device
 */
const hasActiveDevice = async (userUUID) => {
  try {
    const devices = await getUserDevices(userUUID);
    return devices.some(device => device.is_active);
  } catch (error) {
    return false;
  }
};

/**
 * Play a track
 */
const playTrack = async (userUUID, trackUri, deviceId = null) => {
  try {
    const accessToken = await getValidAccessToken(userUUID);
    spotifyApi.setAccessToken(accessToken);
    
    const options = {
      uris: [trackUri]
    };
    
    if (deviceId) {
      options.device_id = deviceId;
    }
    
    await new Promise((resolve, reject) => {
      spotifyApi.play(options, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    return { success: true, message: 'Track started playing' };
  } catch (error) {
    throw new Error(`Failed to play track: ${error.message}`);
  }
};

/**
 * Disconnect Spotify account
 */
const disconnectSpotify = async (userUUID) => {
  try {
    const { error } = await supabase
      .from('spotify_tokens')
      .delete()
      .eq('user_id', userUUID);
    
    if (error) {
      throw new Error(`Failed to disconnect Spotify: ${error.message}`);
    }
    
    return { success: true, message: 'Spotify account disconnected' };
  } catch (error) {
    throw new Error(`Failed to disconnect Spotify: ${error.message}`);
  }
};

/**
 * Test Spotify connection and credentials
 */
const testSpotifyConnection = async (userUUID) => {
  try {
    console.log('🔍 Testing Spotify connection for user:', userUUID);
    
    // Check if we have environment variables
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify credentials not configured in environment variables');
    }
    
    const accessToken = await getValidAccessToken(userUUID);
    console.log('✅ Access token retrieved successfully');
    
    spotifyApi.setAccessToken(accessToken);
    
    // Test API call
    const userProfile = await new Promise((resolve, reject) => {
      spotifyApi.getMe((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    console.log('✅ Spotify API connection successful, user:', userProfile.body.display_name);
    
    return {
      success: true,
      user: userProfile.body.display_name,
      id: userProfile.body.id
    };
  } catch (error) {
    console.error('❌ Spotify connection test failed:', error);
    throw error;
  }
};

/**
 * Search for tracks on Spotify
 */
const searchTracks = async (userUUID, query, limit = 20) => {
  try {
    console.log('🔍 Searching for tracks:', query);
    
    const accessToken = await getValidAccessToken(userUUID);
    spotifyApi.setAccessToken(accessToken);
    
    const searchResult = await new Promise((resolve, reject) => {
      spotifyApi.searchTracks(query, { limit }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    
    const tracks = searchResult.body.tracks.items.map(track => ({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artists: track.artists,
      album: track.album,
      duration_ms: track.duration_ms,
      popularity: track.popularity,
      preview_url: track.preview_url,
      external_urls: track.external_urls
    }));
    
    console.log(`🔍 Found ${tracks.length} tracks for query: ${query}`);
    return tracks;
  } catch (error) {
    console.error('❌ Search tracks error:', error);
    throw error;
  }
};

module.exports = {
  getSpotifyAuthUrl,
  handleCallbackExchange,
  getValidAccessToken,
  isSpotifyConnected,
  getSpotifyProfile,
  fetchUserLikedTracks,
  getAllUserLikedTracks,
  fetchUserTopTracks,
  getAudioFeatures,
  createPlaylistForMood,
  getUserDevices,
  hasActiveDevice,
  playTrack,
  disconnectSpotify,
  testSpotifyConnection,
  searchTracks
};
