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
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  tracks,
  currentTrackIndex = 0,
  onTrackChange,
  isConnected = false,
  onConnectRequest
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
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
            >
              <SkipBack className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            <Button
              onClick={handlePlayPause}
              disabled={loading || !isConnected}
              className="bg-sarang-purple hover:bg-sarang-purple/90 dark:bg-sarang-periwinkle dark:hover:bg-sarang-periwinkle/90 dark:text-gray-900 transition-colors duration-300"
            >
              {loading ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentTrackIndex === tracks.length - 1}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
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
                className="bg-green-600 hover:bg-green-700"
              >
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
