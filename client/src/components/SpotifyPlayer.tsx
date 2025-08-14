import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, SkipForward, SkipBack, Volume2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

interface Track {
  track_name: string;
  artist_name: string;
  spotify_uri?: string;
  spotify_id?: string;
  album_name?: string;
  duration_ms?: number;
  popularity?: number;
}

interface SpotifyPlayerProps {
  tracks: Track[];
  currentTrackIndex?: number;
  onTrackChange?: (index: number) => void;
  isConnected?: boolean;
  onConnectRequest?: () => void;
  controlButtonColor?: string;
  iconColor?: string;
  connectButtonColor?: string;
  showSpotifyLogo?: boolean;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  tracks,
  currentTrackIndex = 0,
  onTrackChange,
  isConnected = false,
  onConnectRequest,
  controlButtonColor = "#213447",
  iconColor = "white",
  connectButtonColor = "#1DB954",
  showSpotifyLogo = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { authenticatedFetch } = useAuthenticatedFetch();

  useEffect(() => {
    if (tracks.length > 0) {
      setCurrentTrack(tracks[currentTrackIndex]);
    }
  }, [tracks, currentTrackIndex]);

  useEffect(() => {
    if (isConnected) {
      fetchDevices();
    }
  }, [isConnected]);

  const fetchDevices = async () => {
    try {
      const response = await authenticatedFetch('/api/spotify/devices');
      if (response.ok) {
        const deviceList = await response.json();
        setDevices(deviceList);
        
        // Auto-select first active device
        const activeDevice = deviceList.find(d => d.is_active);
        if (activeDevice) {
          setSelectedDevice(activeDevice.id);
        } else if (deviceList.length > 0) {
          setSelectedDevice(deviceList[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const playTrack = async (trackUri: string) => {
    if (!isConnected) {
      toast.error('Please connect your Spotify account first');
      onConnectRequest?.();
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/spotify/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackUri,
          deviceId: selectedDevice
        })
      });

      if (response.ok) {
        setIsPlaying(true);
        toast.success('Playing on Spotify!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to play track');
      }
    } catch (error) {
      console.error('Error playing track:', error);
      toast.error(error.message || 'Failed to play track');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack) return;
    
    const trackUri = currentTrack.spotify_uri || `spotify:track:${currentTrack.spotify_id}`;
    if (trackUri) {
      playTrack(trackUri);
    } else {
      toast.error('Track not available on Spotify');
    }
  };

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      const newIndex = currentTrackIndex - 1;
      setCurrentTrack(tracks[newIndex]);
      onTrackChange?.(newIndex);
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      const newIndex = currentTrackIndex + 1;
      setCurrentTrack(tracks[newIndex]);
      onTrackChange?.(newIndex);
    }
  };

  const openInSpotify = () => {
    if (currentTrack?.spotify_uri) {
      const spotifyUrl = `https://open.spotify.com/track/${currentTrack.spotify_id}`;
      window.open(spotifyUrl, '_blank');
    }
  };

  if (!currentTrack) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No track selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg bg-white/90 dark:bg-gray-800/90 border border-sarang-lavender/30 dark:border-gray-600 transition-colors duration-300">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Track Info */}
          <div className="text-center">
            <h3 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-gray-200 truncate transition-colors duration-300">
              {currentTrack.track_name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 truncate transition-colors duration-300">
              {currentTrack.artist_name}
            </p>
            {currentTrack.album_name && (
              <p className="text-sm text-gray-500 dark:text-gray-500 truncate transition-colors duration-300">
                {currentTrack.album_name}
              </p>
            )}
          </div>

          {/* Progress indicator */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
            Track {currentTrackIndex + 1} of {tracks.length}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentTrackIndex === 0}
              className="border-gray-300 dark:border-gray-600 transition-colors duration-300"
              style={{
                backgroundColor: controlButtonColor,
                color: iconColor,
                borderColor: controlButtonColor
              }}
            >
              <SkipBack className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            <Button
              onClick={handlePlayPause}
              disabled={loading || !isConnected}
              className="transition-colors duration-300"
              style={{
                backgroundColor: controlButtonColor,
                color: iconColor
              }}
            >
              {loading ? (
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 animate-spin border-2 border-t-transparent rounded-full" 
                  style={{ borderColor: iconColor, borderTopColor: 'transparent' }}
                />
              ) : (
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentTrackIndex === tracks.length - 1}
              className="border-gray-300 dark:border-gray-600 transition-colors duration-300"
              style={{
                backgroundColor: controlButtonColor,
                color: iconColor,
                borderColor: controlButtonColor
              }}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Device Selection */}
          {isConnected && devices.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Play on device:
              </label>
              <select
                value={selectedDevice || ''}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} {device.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* External Link */}
          {currentTrack.spotify_uri && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={openInSpotify}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Spotify
              </Button>
            </div>
          )}

          {/* Connection prompt */}
          {!isConnected && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-700 mb-2">
                Connect your Spotify account to play music
              </p>
              <Button
                onClick={onConnectRequest}
                size="sm"
                className="transition-colors duration-300"
                style={{
                  backgroundColor: connectButtonColor,
                  color: 'black'
                }}
              >
                {showSpotifyLogo && (
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                )}
                Connect Spotify
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotifyPlayer;
