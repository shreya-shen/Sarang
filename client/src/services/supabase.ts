
import { supabase, MoodLog, Playlist, SpotifyLink } from '@/lib/supabase'

const handleSupabaseCall = async <T>(operation: () => Promise<T>): Promise<T> => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  }
  return operation()
}

export const supabaseService = {
  // Authentication
  signUp: async (email: string, password: string) => {
    return handleSupabaseCall(async () => {
      const { data, error } = await supabase!.auth.signUp({ email, password })
      return { data, error }
    })
  },

  signIn: async (email: string, password: string) => {
    return handleSupabaseCall(async () => {
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password })
      return { data, error }
    })
  },

  signInWithSpotify: async () => {
    return handleSupabaseCall(async () => {
      const { data, error } = await supabase!.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      return { data, error }
    })
  },

  signOut: async () => {
    return handleSupabaseCall(async () => {
      const { error } = await supabase!.auth.signOut()
      return { error }
    })
  },

  getCurrentUser: async () => {
    return handleSupabaseCall(async () => {
      const { data: { user } } = await supabase!.auth.getUser()
      return user
    })
  },

  // Mood logs
  saveMoodLog: async (moodLog: Omit<MoodLog, 'id' | 'created_at'>) => {
    return handleSupabaseCall(async () => {
      const { data, error } = await supabase!
        .from('mood_logs')
        .insert([moodLog])
        .select()
      return { data, error }
    })
  },

  getMoodLogs: async (userId: string) => {
    return handleSupabaseCall(async () => {
      const { data, error } = await supabase!
        .from('mood_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
      return { data, error }
    })
  },

  // Playlists
  savePlaylist: async (playlist: Omit<Playlist, 'id' | 'created_at'>) => {
    return handleSupabaseCall(async () => {
      const { data, error } = await supabase!
        .from('playlists')
        .insert([playlist])
        .select()
      return { data, error }
    })
  },

  getPlaylists: async (userId: string) => {
    return handleSupabaseCall(async () => {
      const { data, error } = await supabase!
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
      return { data, error }
    })
  },

  // Spotify integration
  saveSpotifyLink: async (spotifyLink: Omit<SpotifyLink, 'id' | 'created_at'>) => {
    return handleSupabaseCall(async () => {
      const { data, error } = await supabase!
        .from('spotify_links')
        .upsert([spotifyLink])
        .select()
      return { data, error }
    })
  },

  getSpotifyLink: async (userId: string) => {
    return handleSupabaseCall(async () => {
      const { data, error } = await supabase!
        .from('spotify_links')
        .select('*')
        .eq('user_id', userId)
        .single()
      return { data, error }
    })
  },

  removeSpotifyLink: async (userId: string) => {
    return handleSupabaseCall(async () => {
      const { error } = await supabase!
        .from('spotify_links')
        .delete()
        .eq('user_id', userId)
      return { error }
    })
  }
}
