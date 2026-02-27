-- =============================================================================
-- SARANG MUSIC APP - COMPLETE SUPABASE SCHEMA
-- =============================================================================
-- This schema creates all tables and structures needed for the Sarang app
-- Run this in your new Supabase project's SQL Editor

-- =============================================================================
-- 1. CORE USER PROFILES TABLE
-- =============================================================================

-- Create profiles table (extends Supabase auth.users)
-- NOTE: The app uses Clerk auth (not Supabase auth), so id is a plain UUID
-- generated from the Clerk user ID via SHA-256 hashing.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profile policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =============================================================================
-- 2. SPOTIFY INTEGRATION TABLES
-- =============================================================================

-- Spotify authentication tokens
CREATE TABLE IF NOT EXISTS spotify_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  spotify_user_id TEXT NOT NULL,
  spotify_display_name TEXT,
  spotify_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS on spotify_tokens
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;

-- Spotify tokens policies
CREATE POLICY "Users can access their own Spotify tokens" ON spotify_tokens
  FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spotify_tokens_user_id ON spotify_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_tokens_expires_at ON spotify_tokens(expires_at);

-- User's liked songs cache
CREATE TABLE IF NOT EXISTS user_liked_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spotify_track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  spotify_uri TEXT NOT NULL,
  duration_ms INTEGER,
  popularity INTEGER,
  added_at TIMESTAMP WITH TIME ZONE,
  audio_features JSONB, -- Store audio features for recommendations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, spotify_track_id)
);

-- Enable RLS on user_liked_songs
ALTER TABLE user_liked_songs ENABLE ROW LEVEL SECURITY;

-- Liked songs policies
CREATE POLICY "Users can access their own liked songs" ON user_liked_songs
  FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_liked_songs_user_id ON user_liked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_liked_songs_spotify_track_id ON user_liked_songs(spotify_track_id);
CREATE INDEX IF NOT EXISTS idx_user_liked_songs_audio_features ON user_liked_songs USING GIN(audio_features);

-- User's exported playlists tracking
CREATE TABLE IF NOT EXISTS user_playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  playlist_name TEXT NOT NULL,
  spotify_playlist_id TEXT NOT NULL,
  spotify_playlist_url TEXT NOT NULL,
  mood_context TEXT, -- The mood that generated this playlist
  track_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, spotify_playlist_id)
);

-- Enable RLS on user_playlists
ALTER TABLE user_playlists ENABLE ROW LEVEL SECURITY;

-- User playlists policies
CREATE POLICY "Users can access their own playlists" ON user_playlists
  FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_playlists_user_id ON user_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_spotify_playlist_id ON user_playlists(spotify_playlist_id);

-- =============================================================================
-- 3. USER PREFERENCES AND PERMISSIONS
-- =============================================================================

-- User permissions for various features
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, permission_type)
);

-- Enable RLS on user_permissions
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- User permissions policies
CREATE POLICY "Users can access their own permissions" ON user_permissions
  FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_type ON user_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_user_permissions_granted ON user_permissions(granted);

-- User's top tracks for personalization
CREATE TABLE IF NOT EXISTS user_preference_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spotify_track_id VARCHAR(255) NOT NULL,
  track_name VARCHAR(500) NOT NULL,
  artist_name VARCHAR(500) NOT NULL,
  album_name VARCHAR(500),
  spotify_uri VARCHAR(255),
  duration_ms INTEGER,
  popularity INTEGER,
  preference_type VARCHAR(50) DEFAULT 'top_track',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, spotify_track_id)
);

-- Enable RLS on user_preference_tracks
ALTER TABLE user_preference_tracks ENABLE ROW LEVEL SECURITY;

-- User preference tracks policies
CREATE POLICY "Users can access their own preference tracks" ON user_preference_tracks
  FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preference_tracks_user_id ON user_preference_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preference_tracks_updated_at ON user_preference_tracks(updated_at);

-- =============================================================================
-- 4. MOOD TRACKING
-- =============================================================================

-- User mood entries (logged from the frontend)
CREATE TABLE IF NOT EXISTS moods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "inputText" TEXT NOT NULL,
  "sentimentScore" FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on moods
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- Moods policy (service role bypasses RLS, but included for completeness)
CREATE POLICY "Users can access their own moods" ON moods
  FOR ALL USING ("userId" = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moods_userId ON moods("userId");
CREATE INDEX IF NOT EXISTS idx_moods_created_at ON moods(created_at);

-- =============================================================================
-- 5. PLAYLIST GENERATION (legacy/optional)
-- =============================================================================

-- Playlists generated from mood analysis
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inputText TEXT NOT NULL,
  songData JSONB NOT NULL, -- Stores recommendations, mood analysis, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on playlists
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Playlists policies
CREATE POLICY "Users can access their own playlists" ON playlists
  FOR ALL USING (userId = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_playlists_userId ON playlists(userId);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at);
CREATE INDEX IF NOT EXISTS idx_playlists_songData ON playlists USING GIN(songData);

-- =============================================================================
-- 5. SPOTIFY TRACKS DATABASE (FOR RECOMMENDATIONS)
-- =============================================================================
-- This table stores the song database for mood-based recommendations
-- Populate this using the migration script: migrate_to_supabase.py

CREATE TABLE IF NOT EXISTS spotify_tracks (
  id SERIAL PRIMARY KEY,
  track_id TEXT UNIQUE NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  acousticness FLOAT,
  danceability FLOAT,
  duration_ms INTEGER,
  energy FLOAT,
  instrumentalness FLOAT,
  key INTEGER,
  liveness FLOAT,
  loudness FLOAT,
  mode INTEGER,
  speechiness FLOAT,
  tempo FLOAT,
  time_signature INTEGER,
  valence FLOAT,
  popularity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast mood-based queries
CREATE INDEX IF NOT EXISTS idx_tracks_valence ON spotify_tracks(valence);
CREATE INDEX IF NOT EXISTS idx_tracks_energy ON spotify_tracks(energy);
CREATE INDEX IF NOT EXISTS idx_tracks_danceability ON spotify_tracks(danceability);
CREATE INDEX IF NOT EXISTS idx_tracks_acousticness ON spotify_tracks(acousticness);
CREATE INDEX IF NOT EXISTS idx_tracks_tempo ON spotify_tracks(tempo);
CREATE INDEX IF NOT EXISTS idx_tracks_popularity ON spotify_tracks(popularity);

-- Create indexes for search functionality
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON spotify_tracks USING gin(to_tsvector('english', artist_name));
CREATE INDEX IF NOT EXISTS idx_tracks_name ON spotify_tracks USING gin(to_tsvector('english', track_name));

-- Create compound indexes for mood combinations
CREATE INDEX IF NOT EXISTS idx_tracks_valence_energy ON spotify_tracks(valence, energy);
CREATE INDEX IF NOT EXISTS idx_tracks_dance_energy ON spotify_tracks(danceability, energy);
CREATE INDEX IF NOT EXISTS idx_tracks_valence_dance ON spotify_tracks(valence, danceability);

-- =============================================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spotify_tokens_updated_at 
    BEFORE UPDATE ON spotify_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_liked_songs_updated_at 
    BEFORE UPDATE ON user_liked_songs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preference_tracks_updated_at 
    BEFORE UPDATE ON user_preference_tracks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at 
    BEFORE UPDATE ON playlists 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. INITIAL DATA SETUP
-- =============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Trigger to automatically create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =============================================================================

-- Add table comments
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE spotify_tokens IS 'Spotify OAuth tokens for each user';
COMMENT ON TABLE user_liked_songs IS 'Cache of users liked songs for recommendations';
COMMENT ON TABLE user_playlists IS 'Tracking of exported Spotify playlists';
COMMENT ON TABLE user_permissions IS 'User permissions for various app features';
COMMENT ON TABLE user_preference_tracks IS 'Users top tracks for personalization';
COMMENT ON TABLE playlists IS 'Generated playlists from mood analysis';
COMMENT ON TABLE spotify_tracks IS 'Master database of tracks for recommendations';

-- Add column comments
COMMENT ON COLUMN user_permissions.permission_type IS 'Type of permission (e.g., top_tracks_access, playlist_create)';
COMMENT ON COLUMN user_permissions.granted IS 'Whether the permission is currently granted';
COMMENT ON COLUMN playlists.songData IS 'JSON containing mood analysis results and track recommendations';
COMMENT ON COLUMN spotify_tracks.valence IS 'Musical positiveness (0.0 to 1.0)';
COMMENT ON COLUMN spotify_tracks.energy IS 'Perceptual measure of intensity (0.0 to 1.0)';
COMMENT ON COLUMN spotify_tracks.danceability IS 'How suitable for dancing (0.0 to 1.0)';

-- =============================================================================
-- SCHEMA SETUP COMPLETE
-- =============================================================================

-- Display setup completion message
SELECT 
  'Sarang Music App database schema created successfully!' as message,
  'Next steps:' as next_steps,
  '1. Run migrate_to_supabase.py to populate spotify_tracks table' as step_1,
  '2. Update your environment variables with new Supabase URL and keys' as step_2,
  '3. Test the application with the new database' as step_3;