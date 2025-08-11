
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, User, Bell, Download, Link as LinkIcon, Unlink, Edit, Save, X, Play, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { useUser } from "@clerk/clerk-react";

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [autoExport, setAutoExport] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [tempProfileData, setTempProfileData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [topTracksPermission, setTopTracksPermission] = useState(false);
  const [topTracksLoading, setTopTracksLoading] = useState(false);
  const [topTracksStatus, setTopTracksStatus] = useState(null);
  
  const { spotifyLinked, setSpotifyLinked } = useApp();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { user, isSignedIn } = useUser();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isSignedIn) {
        setProfileLoading(false);
        return;
      }
      
      setProfileLoading(true);
      
      try {
        const response = await authenticatedFetch('/api/user/profile', {
          method: 'GET'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const userData = await response.json();
        
        setProfileData({
          name: userData.name || user?.fullName || '',
          email: userData.email || user?.primaryEmailAddress?.emailAddress || ''
        });
        setTempProfileData({
          name: userData.name || user?.fullName || '',
          email: userData.email || user?.primaryEmailAddress?.emailAddress || ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
        
        // Fallback to Clerk data
        setProfileData({
          name: user?.fullName || user?.firstName || '',
          email: user?.primaryEmailAddress?.emailAddress || ''
        });
        setTempProfileData({
          name: user?.fullName || user?.firstName || '',
          email: user?.primaryEmailAddress?.emailAddress || ''
        });
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [isSignedIn, user]);

  // Fetch Spotify connection status
  useEffect(() => {
    const checkSpotifyStatus = async () => {
      if (!isSignedIn) return;
      
      console.log('🔍 Checking Spotify status...');
      try {
        const response = await authenticatedFetch('/api/spotify/status');
        console.log('🔍 Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Spotify status data:', data);
          setSpotifyConnected(data.connected);
          setSpotifyProfile(data.profile);
          setSpotifyLinked(data.connected);
          
          // Check top tracks permission if connected
          if (data.connected) {
            checkTopTracksPermission();
          }
        }
      } catch (error) {
        console.error('❌ Error checking Spotify status:', error);
      }
    };

    checkSpotifyStatus();
  }, [isSignedIn]);

  // Check top tracks permission status
  const checkTopTracksPermission = async () => {
    try {
      const response = await authenticatedFetch('/api/spotify/top-tracks-permission-status');
      if (response.ok) {
        const data = await response.json();
        setTopTracksPermission(data.hasPermission);
        setTopTracksStatus(data);
      }
    } catch (error) {
      console.error('❌ Error checking top tracks permission:', error);
    }
  };

  // Handle URL params for Spotify connection result
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyResult = urlParams.get('spotify');
    
    if (spotifyResult === 'connected') {
      toast.success('Spotify account connected successfully!');
      setSpotifyConnected(true);
      setSpotifyLinked(true);
      
      // Fetch updated Spotify status and profile with retry logic
      const fetchUpdatedStatus = async () => {
        let retries = 0;
        const maxRetries = 5;
        
        while (retries < maxRetries) {
          try {
            if (!isSignedIn) {
              console.log('🔄 Waiting for user to be signed in, retry', retries + 1);
              await new Promise(resolve => setTimeout(resolve, 1000));
              retries++;
              continue;
            }
            
            const response = await authenticatedFetch('/api/spotify/status');
            if (response.ok) {
              const data = await response.json();
              console.log('✅ Successfully fetched updated Spotify status:', data);
              setSpotifyConnected(data.connected);
              setSpotifyProfile(data.profile);
              setSpotifyLinked(data.connected);
              break;
            } else {
              throw new Error(`HTTP ${response.status}`);
            }
          } catch (error) {
            console.error('❌ Error fetching updated Spotify status:', error);
            retries++;
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      };
      
      fetchUpdatedStatus();
      
      // Remove URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (spotifyResult === 'error') {
      toast.error('Failed to connect Spotify account');
      // Remove URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isSignedIn, authenticatedFetch]);

  const handleProfileEdit = () => {
    setEditingProfile(true);
    setTempProfileData({ ...profileData });
  };

  const handleProfileSave = async () => {
    if (!tempProfileData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tempProfileData.name.trim(),
          email: tempProfileData.email.trim()
        })
      });

      const updatedUser = await response.json();

      setProfileData({ ...tempProfileData });
      setEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setTempProfileData({ ...profileData });
    setEditingProfile(false);
  };

  const handleSpotifyConnect = async () => {
    if (spotifyConnected) {
      // Disconnect Spotify
      setSpotifyLoading(true);
      try {
        const response = await authenticatedFetch('/api/spotify/disconnect', {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setSpotifyConnected(false);
          setSpotifyLinked(false);
          setSpotifyProfile(null);
          toast.success("Spotify account disconnected");
        } else {
          throw new Error('Failed to disconnect');
        }
      } catch (error) {
        console.error('Error disconnecting Spotify:', error);
        toast.error("Failed to disconnect Spotify");
      } finally {
        setSpotifyLoading(false);
      }
    } else {
      // Connect to Spotify
      setSpotifyLoading(true);
      try {
        const response = await authenticatedFetch('/api/spotify/authorize');
        if (response.ok) {
          const data = await response.json();
          window.location.href = data.authUrl;
        } else {
          throw new Error('Failed to get authorization URL');
        }
      } catch (error) {
        console.error('Error connecting to Spotify:', error);
        toast.error("Failed to connect to Spotify");
        setSpotifyLoading(false);
      }
    }
  };

  const handleImportLikedSongs = async () => {
    if (!spotifyConnected) {
      toast.error("Please connect your Spotify account first");
      return;
    }
    
    setSpotifyLoading(true);
    try {
      toast.info("Importing your liked songs...");
      const response = await authenticatedFetch('/api/spotify/sync-liked', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully imported ${data.totalTracks} liked songs!`);
      } else {
        throw new Error('Failed to import songs');
      }
    } catch (error) {
      console.error('Error importing liked songs:', error);
      toast.error("Failed to import liked songs");
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleGrantTopTracksPermission = async () => {
    if (!spotifyConnected) {
      toast.error("Please connect your Spotify account first");
      return;
    }
    
    setTopTracksLoading(true);
    try {
      toast.info("Granting permission to access your top tracks...");
      const response = await authenticatedFetch('/api/spotify/grant-top-tracks-permission', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTopTracksPermission(true);
        await checkTopTracksPermission(); // Refresh status
        toast.success(`Permission granted! Your top ${data.totalTracks} tracks will be used for personalized recommendations.`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to grant permission');
      }
    } catch (error) {
      console.error('Error granting top tracks permission:', error);
      toast.error(error.message || "Failed to grant permission");
    } finally {
      setTopTracksLoading(false);
    }
  };

  const handleRevokeTopTracksPermission = async () => {
    setTopTracksLoading(true);
    try {
      toast.info("Revoking top tracks permission...");
      const response = await authenticatedFetch('/api/spotify/revoke-top-tracks-permission', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTopTracksPermission(false);
        await checkTopTracksPermission(); // Refresh status
        toast.success("Permission revoked. Weekly updates have been stopped.");
      } else {
        throw new Error('Failed to revoke permission');
      }
    } catch (error) {
      console.error('Error revoking top tracks permission:', error);
      toast.error("Failed to revoke permission");
    } finally {
      setTopTracksLoading(false);
    }
  };

  const handleExportData = () => {
    toast.info("Preparing your data export...");
    setTimeout(() => {
      toast.success("Data export ready for download!");
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-4">
        {isSignedIn ? (
          <div className="bg-sarang-coral border-2 border-black rounded-lg p-4 mb-6 transition-colors duration-300">
            {profileLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="bg-black/20 text-black rounded-full w-12 h-12 flex items-center justify-center transition-colors duration-300">
                  <User className="w-6 h-6 text-black" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="h-5 bg-black/20 rounded w-24 mb-2 animate-pulse transition-colors duration-300"></div>
                  <div className="h-4 bg-black/20 rounded w-32 animate-pulse transition-colors duration-300"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <div className="bg-black/20 text-black rounded-full w-12 h-12 flex items-center justify-center transition-colors duration-300">
                  <User className="w-6 h-6 text-black" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-black transition-colors duration-300 font-['Montserrat']">
                    {profileData.name || user?.fullName || 'User'}
                  </h2>
                  <p className="text-sm text-black font-semibold transition-colors duration-300 font-['Montserrat'] break-words overflow-wrap-anywhere">
                    {profileData.email || user?.primaryEmailAddress?.emailAddress || 'No email set'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-transparent border-2 border-black rounded-lg p-4 mb-6 transition-colors duration-300">
            <div className="flex items-center justify-center space-x-3">
              <div className="bg-sarang-coral text-black rounded-full w-12 h-12 flex items-center justify-center transition-colors duration-300">
                <User className="w-6 h-6 text-black" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">
                  Sign In Required
                </h2>
                <p className="text-sm text-sarang-brown font-semibold transition-colors duration-300 font-['Montserrat']">
                  Please sign in to access your profile and settings
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/auth'}
                style={{ backgroundColor: '#d76e72', color: 'black' }}
                className="ml-4 hover:bg-opacity-90 font-['Montserrat'] font-bold"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">
          Profile & Settings
        </h1>
        <p className="text-sarang-brown max-w-2xl mx-auto px-4 transition-colors duration-300 font-['Montserrat'] font-semibold">
          Manage your profile information, preferences, and music integrations
        </p>
      </div>

      {/* Profile Section */}
      <Card className="bg-transparent backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-black transition-colors duration-300 font-['Montserrat'] font-bold">
            <User className="w-5 h-5 text-black" />
            <span>
              {isSignedIn && (profileData.name || user?.fullName) 
                ? `${profileData.name || user?.fullName}'s Profile` 
                : 'Profile'
              }
            </span>
          </CardTitle>
          <CardDescription className="text-black transition-colors duration-300 font-['Montserrat'] font-semibold">
            Your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0 sm:px-6">
          {isSignedIn ? (
            <div className="space-y-4">
              {editingProfile ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Username/Display Name</Label>
                    <Input
                      id="name"
                      value={tempProfileData.name}
                      onChange={(e) => setTempProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your username or display name"
                      style={{ backgroundColor: '#d76e72', color: 'black', borderColor: 'black' }}
                      className="font-semibold placeholder:text-black/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                    <Input
                      id="email"
                      value={tempProfileData.email}
                      onChange={(e) => setTempProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      type="email"
                      style={{ backgroundColor: '#d76e72', color: 'black', borderColor: 'black' }}
                      className="font-semibold placeholder:text-black/70"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button 
                      onClick={handleProfileSave}
                      disabled={loading}
                      style={{ backgroundColor: '#d76e72', color: 'black' }}
                      className="hover:bg-opacity-90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleProfileCancel}
                      disabled={loading}
                      style={{ backgroundColor: '#d76e72', color: 'black', borderColor: '#d76e72' }}
                      className="hover:bg-opacity-90"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-black font-['Montserrat']">Username</h3>
                      <p className="text-sm text-black font-semibold font-['Montserrat']">
                        {profileData.name || "Not set"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-black font-['Montserrat']">Email</h3>
                      <p className="text-sm text-black font-semibold font-['Montserrat']">
                        {profileData.email || "Not set"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-black font-['Montserrat']">Account Status</h3>
                      <p className="text-sm text-black font-semibold font-['Montserrat']">
                        Active - Signed in with Clerk
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-black font-['Montserrat']">Member Since</h3>
                      <p className="text-sm text-black font-semibold font-['Montserrat']">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline"
                      onClick={handleProfileEdit}
                      style={{ backgroundColor: '#d76e72', color: 'black', borderColor: '#d76e72' }}
                      className="hover:bg-opacity-90 font-['Montserrat']"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
              
              <Separator className="bg-black" />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-black font-['Montserrat']">Daily Mood Reminders</h3>
                  <p className="text-sm text-black font-['Montserrat'] font-semibold">Get gentle reminders to check in with your mood</p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  style={{ 
                    '--switch-bg': '#d76e72',
                    '--switch-thumb-bg': 'black'
                  } as React.CSSProperties}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-800 mb-2">Sign in to manage your profile</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create an account to save your mood history and personalize your experience
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'}
                style={{ backgroundColor: '#d76e72', color: 'black' }}
                className="hover:bg-opacity-90"
              >
                Sign In / Sign Up
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spotify Integration */}
      <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">
            <Music className="w-5 h-5 text-black" />
            <span>Spotify Integration</span>
          </CardTitle>
          <CardDescription className="text-sarang-brown transition-colors duration-300 font-['Montserrat']">
            Connect your Spotify account for enhanced music therapy experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-sarang-charcoal font-['Montserrat']">Spotify Account</h3>
                {spotifyConnected ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Connected
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200">Not Connected</Badge>
                )}
              </div>
            </div>
            <Button
              onClick={handleSpotifyConnect}
              variant={spotifyConnected ? "outline" : "default"}
              className={spotifyConnected ? "font-['Montserrat'] hover:bg-opacity-90" : "font-['Montserrat'] hover:bg-opacity-90"}
              style={spotifyConnected 
                ? { backgroundColor: '#d76e72', color: 'black', borderColor: '#d76e72' }
                : { backgroundColor: '#d76e72', color: 'black' }
              }
              disabled={spotifyLoading}
            >
              {spotifyLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-gray-300 border-t-transparent rounded-full"></div>
                  {spotifyConnected ? "Disconnecting..." : "Connecting..."}
                </>
              ) : spotifyConnected ? (
                <>
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect Spotify
                </>
              )}
            </Button>
          </div>

          {spotifyConnected && spotifyProfile && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">
                    Connected as: {spotifyProfile.spotify_display_name || spotifyProfile.spotify_email}
                  </span>
                </div>
                <p className="text-sm text-green-700">
                  Your Spotify account is connected and ready to use. You can now import your liked songs, export playlists, and play music directly from Sarang.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">Top Tracks Personalization</h3>
                    <p className="text-sm text-gray-600">
                      Allow permission to access your top 5 tracks on Spotify for enhanced recommendations
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {topTracksPermission ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <ShieldX className="w-3 h-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>

                {topTracksPermission ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Weekly updates active
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      Your top tracks are being used for personalized recommendations. Updates happen automatically every week.
                    </p>
                    {topTracksStatus && (
                      <div className="text-xs text-green-600 mb-3">
                        {topTracksStatus.tracksCount} tracks stored • Last updated: {topTracksStatus.lastUpdated ? new Date(topTracksStatus.lastUpdated).toLocaleDateString() : 'Recently'}
                      </div>
                    )}
                    <Button
                      onClick={handleRevokeTopTracksPermission}
                      variant="outline"
                      size="sm"
                      style={{ backgroundColor: '#d76e72', color: 'black', borderColor: '#d76e72' }}
                      className="hover:bg-opacity-90"
                      disabled={topTracksLoading}
                    >
                      {topTracksLoading ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin border-2 border-gray-300 border-t-transparent rounded-full"></div>
                          Revoking...
                        </>
                      ) : (
                        <>
                          <ShieldX className="w-4 h-4 mr-2" />
                          Revoke Access
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Enhance your experience
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Grant permission to access your top 5 tracks for better personalized recommendations. Your data will be updated weekly.
                    </p>
                    <Button
                      onClick={handleGrantTopTracksPermission}
                      variant="outline"
                      size="sm"
                      style={{ backgroundColor: '#d76e72', color: 'black', borderColor: '#d76e72' }}
                      className="hover:bg-opacity-90"
                      disabled={topTracksLoading}
                    >
                      {topTracksLoading ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin border-2 border-gray-300 border-t-transparent rounded-full"></div>
                          Granting...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Allow permission to access top 5 tracks on Spotify
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-black font-['Montserrat']">Auto-Export Playlists</h3>
                    <p className="text-sm text-black font-['Montserrat'] font-semibold">Automatically save Sarang playlists to your Spotify</p>
                  </div>
                  <Switch
                    checked={autoExport}
                    onCheckedChange={setAutoExport}
                    style={{ 
                      '--switch-bg': '#d76e72',
                      '--switch-thumb-bg': 'black'
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            </>
          )}

          {!spotifyConnected && (
            <div className="bg-sarang-coral backdrop-blur-sm border-2 border-black rounded-lg p-4">
              <h4 className="font-bold text-black mb-2 font-['Montserrat']">Why connect Spotify?</h4>
              <ul className="text-sm text-black space-y-1 font-['Montserrat'] font-semibold">
                <li>• Access your top tracks for personalized recommendations</li>
                <li>• Export Sarang playlists directly to your account</li>
                <li>• Play songs directly within the app</li>
                <li>• Weekly automatic updates for better personalization</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="bg-transparent backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">
            <Download className="w-5 h-5 text-black" />
            <span>Data & Privacy</span>
          </CardTitle>
          <CardDescription className="text-sarang-brown transition-colors duration-300 font-['Montserrat']">
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sarang-charcoal font-['Montserrat']">Export My Data</h3>
              <p className="text-sm text-sarang-brown font-['Montserrat'] font-semibold">Download all your mood logs and playlist history</p>
            </div>
            <Button
              onClick={handleExportData}
              variant="outline"
              style={{ backgroundColor: '#d76e72', color: 'black' }}
              className="hover:bg-opacity-90 font-['Montserrat'] border-black"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-bold text-sarang-charcoal font-['Montserrat']">Privacy Preferences</h3>
            <div className="space-y-3 text-sm text-sarang-brown font-['Montserrat'] font-semibold">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sarang-coral rounded-full"></div>
                <span>Your mood data is encrypted and stored securely</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sarang-navy rounded-full"></div>
                <span>We never share your personal information with third parties</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sarang-brown rounded-full"></div>
                <span>All AI analysis is processed anonymously</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-transparent backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="text-sarang-charcoal transition-colors duration-300 font-['Montserrat'] font-bold">Need Help?</CardTitle>
          <CardDescription className="text-sarang-brown transition-colors duration-300 font-['Montserrat'] font-semibold">
            Get support or learn more about Sarang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              style={{ backgroundColor: '#d76e72', color: 'black' }}
              className="hover:bg-opacity-90 font-['Montserrat'] border-black"
            >
              Contact Support
            </Button>
            <Button 
              variant="outline" 
              style={{ backgroundColor: '#d76e72', color: 'black' }}
              className="hover:bg-opacity-90 font-['Montserrat'] border-black"
            >
              View Tutorial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
