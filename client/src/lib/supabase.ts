import { createClient } from '@supabase/supabase-js'

declare global {
  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
    };
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface MoodLog {
  id: string
  user_id: string
  input_text: string
  sentiment_score: number
  mood_label: string
  playlist_id?: string
  logged_at: string
  created_at: string
}

export interface PlaylistSong {
  track_name: string
  artist_name: string
  valence: number
  energy: number
  spotify_id?: string
}

export interface Playlist {
  id: string
  user_id: string
  sentiment_score: number
  songs: PlaylistSong[]
  generated_at: string
  created_at: string
}

export interface SpotifyLink {
  id: string
  user_id: string
  spotify_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  linked_at: string
  created_at: string
}