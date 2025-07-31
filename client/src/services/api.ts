
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface SentimentResponse {
  sentiment_score: number
  mood_label: string
  confidence: number
}

export interface RecommendationResponse {
  songs: Array<{
    track_name: string
    artist_name: string
    valence: number
    energy: number
    spotify_id?: string
  }>
}

export interface MoodLogResponse {
  logs: Array<{
    id: string
    input_text: string
    sentiment_score: number
    mood_label: string
    logged_at: string
  }>
}

// API methods
export const apiService = {
  // Sentiment analysis
  analyzeSentiment: async (text: string): Promise<SentimentResponse> => {
    const response = await api.post('/api/sentiment', { text })
    return response.data
  },

  // Get recommendations
  getRecommendations: async (sentimentScore: number, userId?: string): Promise<RecommendationResponse> => {
    const response = await api.post('/api/recommendations', { 
      sentiment_score: sentimentScore,
      user_id: userId 
    })
    return response.data
  },

  // Mood logs
  saveMoodLog: async (data: {
    input_text: string
    sentiment_score: number
    mood_label: string
    playlist_id?: string
  }) => {
    const response = await api.post('/api/mood-logs', data)
    return response.data
  },

  getMoodLogs: async (): Promise<MoodLogResponse> => {
    const response = await api.get('/api/mood-logs')
    return response.data
  },

  // Spotify integration
  linkSpotify: async () => {
    const response = await api.get('/api/spotify/auth')
    return response.data
  },

  unlinkSpotify: async () => {
    const response = await api.delete('/api/spotify/link')
    return response.data
  },

  exportPlaylist: async (songs: any[], playlistName: string) => {
    const response = await api.post('/api/spotify/create-playlist', {
      songs,
      name: playlistName
    })
    return response.data
  }
}

export default api
