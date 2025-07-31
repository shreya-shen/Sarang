import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, ArrowUp, Music, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import SpotifyPlayer from "@/components/SpotifyPlayer";

interface Song {
  trackName: string;
  artistName: string;
  valence: number;
  energy: number;
  spotifyId?: string;
  spotify_uri?: string;
  track_name?: string;
  artist_name?: string;
}

const Recommendations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isExportingPlaylist, setIsExportingPlaylist] = useState(false);
  const [hasPersonalization, setHasPersonalization] = useState(false);
  const { authenticatedFetch } = useAuthenticatedFetch();

  const { sentiment, moodText, playlistData } = location.state || {};

  useEffect(() => {
    if (!sentiment) {
      navigate("/");
      return;
    }

    // If we have existing playlist data, use it; otherwise generate new playlist
    if (playlistData && playlistData.recommendations) {
      // Use existing playlist data
      const transformedSongs: Song[] = playlistData.recommendations.map((song: any) => ({
        trackName: song.track_name,
        artistName: song.artist_name,
        valence: song.valence,
        energy: song.energy,
        spotifyId: song.spotify_id,
        spotify_uri: song.spotify_uri
      }));
      setPlaylist(transformedSongs);
      setIsLoading(false);
    } else {
      // Generate new playlist based on mood
      generatePlaylist();
    }
    
    checkSpotifyConnection();
  }, [sentiment, navigate, playlistData]);

  const checkSpotifyConnection = async () => {
    try {
      const response = await authenticatedFetch('/api/spotify/status');
      if (response.ok) {
        const data = await response.json();
        setSpotifyConnected(data.connected);
        
        // Check for personalization if connected
        if (data.connected) {
          checkPersonalizationStatus();
        }
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
    }
  };

  const checkPersonalizationStatus = async () => {
    try {
      const response = await authenticatedFetch('/api/spotify/top-tracks-permission-status');
      if (response.ok) {
        const data = await response.json();
        setHasPersonalization(data.hasPermission && data.tracksCount > 0);
      }
    } catch (error) {
      console.error('Error checking personalization status:', error);
    }
  };

  const generatePlaylist = async () => {
    setIsLoading(true);
    
    try {
      const response = await authenticatedFetch('/api/playlist/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moodText: moodText,
          preferences: {}
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Playlist generation failed:', response.status, errorText);
        throw new Error('Failed to generate playlist');
      }

      const data = await response.json();
      
      // Transform the Python response to match our interface
      const transformedSongs: Song[] = data.recommendations.map((song: any) => ({
        trackName: song.track_name,
        artistName: song.artist_name,
        valence: song.valence,
        energy: song.energy,
        spotifyId: song.spotify_id,
        spotify_uri: song.spotify_uri
      }));

      setPlaylist(transformedSongs);
      setIsLoading(false);
      toast.success("Your personalized playlist is ready!");
    } catch (error) {
      console.error('Error generating playlist:', error);
      toast.error("Failed to generate playlist. Please try again.");
      setIsLoading(false);
      
      // Fallback to mock data
      const mockSongs: Song[] = [
        { trackName: "Khamaaj", artistName: "Shafqat Amanat Ali", valence: 0.22, energy: 0.35 },
        { trackName: "Breathe Me", artistName: "Sia", valence: 0.28, energy: 0.40 },
        { trackName: "Mad World", artistName: "Gary Jules", valence: 0.35, energy: 0.45 },
        { trackName: "Skinny Love", artistName: "Bon Iver", valence: 0.42, energy: 0.52 },
        { trackName: "Holocene", artistName: "Bon Iver", valence: 0.48, energy: 0.58 },
        { trackName: "Vienna", artistName: "Billy Joel", valence: 0.55, energy: 0.62 },
        { trackName: "Don't Stop Believin'", artistName: "Journey", valence: 0.65, energy: 0.70 },
        { trackName: "Good as Hell", artistName: "Lizzo", valence: 0.72, energy: 0.78 },
        { trackName: "Uptown Funk", artistName: "Mark Ronson ft. Bruno Mars", valence: 0.80, energy: 0.85 },
        { trackName: "Dancing Queen", artistName: "ABBA", valence: 0.88, energy: 0.90 }
      ];
      setPlaylist(mockSongs);
    }
  };

  const exportToSpotify = async () => {
    if (!spotifyConnected) {
      toast.error("Please connect your Spotify account first");
      navigate("/settings");
      return;
    }

    setIsExportingPlaylist(true);
    try {
      const response = await authenticatedFetch('/api/spotify/create-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moodText: moodText,
          tracks: playlist.map(song => ({
            spotify_uri: song.spotify_uri,
            spotify_id: song.spotifyId,
            track_name: song.trackName,
            artist_name: song.artistName
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Playlist exported to Spotify!");
        
        // Open the playlist in Spotify
        if (data.playlist_url) {
          window.open(data.playlist_url, '_blank');
        }
      } else {
        throw new Error('Failed to export playlist');
      }
    } catch (error) {
      console.error('Error exporting playlist:', error);
      toast.error("Failed to export playlist to Spotify");
    } finally {
      setIsExportingPlaylist(false);
    }
  };

  const handleConnectSpotify = () => {
    navigate("/settings");
  };

  // Normalize playlist data for SpotifyPlayer component
  const normalizedTracks = playlist.map(song => ({
    track_name: song.trackName,
    artist_name: song.artistName,
    spotify_uri: song.spotify_uri,
    spotify_id: song.spotifyId,
    valence: song.valence,
    energy: song.energy
  }));

  const getValenceColor = (valence: number) => {
    if (valence < 0.3) return "bg-blue-400";
    if (valence < 0.5) return "bg-indigo-400";
    if (valence < 0.7) return "bg-green-400";
    return "bg-emerald-400";
  };

  const getEnergyColor = (energy: number) => {
    if (energy < 0.3) return "bg-purple-400";
    if (energy < 0.5) return "bg-pink-400";
    if (energy < 0.7) return "bg-orange-400";
    return "bg-red-400";
  };

  const getMoodEmoji = (valence: number) => {
    if (valence < 0.3) return "😔";
    if (valence < 0.5) return "😐";
    if (valence < 0.7) return "🙂";
    return "😊";
  };

  if (!sentiment) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-sarang-purple dark:text-sarang-periwinkle transition-colors duration-300">
          Your Personalized Playlist
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 transition-colors duration-300">
          Based on your mood analysis, we've created a therapeutic playlist that gradually uplifts your spirits
        </p>
      </div>

      {/* Mood Summary */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sarang-lavender/30 dark:border-gray-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 text-gray-900 dark:text-white transition-colors duration-300">
            <span>Your Mood Analysis</span>
            <Badge variant="secondary" className="bg-sarang-lavender dark:bg-sarang-periwinkle/20 text-sarang-purple dark:text-sarang-periwinkle w-fit">
              {sentiment.label}
            </Badge>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
            "{moodText?.slice(0, 100)}..."
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">
                <span>Sentiment Score</span>
                <span>{sentiment.score.toFixed(2)}</span>
              </div>
              <Progress value={(sentiment.score + 1) * 50} className="h-2 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
              {Math.round(sentiment.confidence * 100)}% confidence
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Playlist */}
      {isLoading ? (
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sarang-lavender/30 dark:border-gray-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="py-12 text-center px-0 sm:px-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sarang-purple dark:border-sarang-periwinkle"></div>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Curating your perfect playlist...</p>
              {hasPersonalization && (
                <div className="bg-sarang-purple/10 border border-sarang-purple/20 rounded-lg p-3 mt-4">
                  <p className="text-sm text-sarang-purple font-medium">
                    ✨ We are using your top played tracks to provide an enhanced experience for the playlist generation.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Playlist Cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Recommended Songs
                </h2>
                {hasPersonalization && (
                  <p className="text-sm text-sarang-purple mt-1">
                    ✨ Personalized using your top played tracks
                  </p>
                )}
              </div>
              <Button
                onClick={exportToSpotify}
                disabled={isExportingPlaylist || !spotifyConnected}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isExportingPlaylist ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export to Spotify
                  </>
                )}
              </Button>
            </div>

            {/* Existing playlist cards */}
            {playlist.map((song, index) => (
              <Card key={index} className="mood-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentTrackIndex(index)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="bg-sarang-purple/20 rounded-full p-2">
                          <Music className="w-4 h-4 text-sarang-purple" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{song.trackName}</h3>
                          <p className="text-gray-600">{song.artistName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Valence: {song.valence.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Energy: {song.energy.toFixed(2)}</div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-sarang-purple hover:bg-sarang-purple/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTrackIndex(index);
                        }}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Spotify Player */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <SpotifyPlayer
              tracks={normalizedTracks}
              currentTrackIndex={currentTrackIndex}
              onTrackChange={setCurrentTrackIndex}
              isConnected={spotifyConnected}
              onConnectRequest={handleConnectSpotify}
            />
          </div>
        </div>
      )}

      {/* Uplift Visualization */}
      <Card className="mood-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowUp className="w-5 h-5 text-sarang-purple" />
            <span>Mood Journey</span>
          </CardTitle>
          <CardDescription>
            Watch how this playlist gradually uplifts your mood using music therapy principles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Starting Mood: {Math.round(playlist[0]?.valence * 100)}% Joy</span>
              <span>Ending Mood: {Math.round(playlist[playlist.length - 1]?.valence * 100)}% Joy</span>
            </div>
            <Progress 
              value={((playlist[playlist.length - 1]?.valence - playlist[0]?.valence) + 1) * 50} 
              className="h-4"
            />
            <p className="text-sm text-gray-600 text-center">
              This playlist increases your joy level by {Math.round((playlist[playlist.length - 1]?.valence - playlist[0]?.valence) * 100)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recommendations;
