
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
        {isSignedIn && (
          <div className="bg-gradient-to-r from-sarang-purple/10 to-sarang-periwinkle/10 dark:from-sarang-purple/20 dark:to-sarang-periwinkle/20 rounded-lg p-4 mb-6 transition-colors duration-300">
            {profileLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-full w-12 h-12 flex items-center justify-center transition-colors duration-300">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2 animate-pulse transition-colors duration-300"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse transition-colors duration-300"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <div className="bg-sarang-purple dark:bg-sarang-periwinkle text-white dark:text-gray-900 rounded-full w-12 h-12 flex items-center justify-center transition-colors duration-300">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                    {profileData.name || user?.fullName || 'User'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    {profileData.email || user?.primaryEmailAddress?.emailAddress || 'No email set'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-sarang-purple dark:text-sarang-periwinkle transition-colors duration-300">
          Profile & Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 transition-colors duration-300">
          Manage your profile information, preferences, and music integrations
        </p>
      </div>

      {/* Profile Section */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sarang-lavender/30 dark:border-gray-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white transition-colors duration-300">
            <User className="w-5 h-5 text-sarang-purple dark:text-sarang-periwinkle" />
            <span>
              {isSignedIn && (profileData.name || user?.fullName) 
                ? `${profileData.name || user?.fullName}'s Profile` 
                : 'Profile'
              }
            </span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
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
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
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
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button 
                      onClick={handleProfileSave}
                      disabled={loading}
                      className="bg-sarang-purple hover:bg-sarang-purple/90 dark:bg-sarang-periwinkle dark:hover:bg-sarang-periwinkle/90 dark:text-gray-900"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleProfileCancel}
                      disabled={loading}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                      <h3 className="font-medium text-gray-800">Username</h3>
                      <p className="text-sm text-gray-600">
                        {profileData.name || "Not set"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-800">Email</h3>
                      <p className="text-sm text-gray-600">
                        {profileData.email || "Not set"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-800">Account Status</h3>
                      <p className="text-sm text-gray-600">
                        Active - Signed in with Clerk
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-800">Member Since</h3>
                      <p className="text-sm text-gray-600">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline"
                      onClick={handleProfileEdit}
                      className="border-sarang-purple text-sarang-purple hover:bg-sarang-purple hover:text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Daily Mood Reminders</h3>
                  <p className="text-sm text-gray-600">Get gentle reminders to check in with your mood</p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
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
                className="bg-sarang-purple hover:bg-sarang-purple/90"
              >
                Sign In / Sign Up
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spotify Integration */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sarang-lavender/30 dark:border-gray-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white transition-colors duration-300">
            <Music className="w-5 h-5 text-sarang-purple dark:text-sarang-periwinkle" />
            <span>Spotify Integration</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
            Connect your Spotify account for enhanced music therapy experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-800">Spotify Account</h3>
                {spotifyConnected ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not Connected</Badge>
                )}
              </div>
            </div>
            <Button
              onClick={handleSpotifyConnect}
              variant={spotifyConnected ? "outline" : "default"}
              className={spotifyConnected ? "border-red-200 text-red-600 hover:bg-red-50" : "bg-sarang-purple hover:bg-sarang-purple/90"}
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
                      className="border-red-200 text-red-600 hover:bg-red-50"
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
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
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
                    <h3 className="font-medium text-gray-800">Auto-Export Playlists</h3>
                    <p className="text-sm text-gray-600">Automatically save Sarang playlists to your Spotify</p>
                  </div>
                  <Switch
                    checked={autoExport}
                    onCheckedChange={setAutoExport}
                  />
                </div>
              </div>
            </>
          )}

          {!spotifyConnected && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Why connect Spotify?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
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
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sarang-lavender/30 dark:border-gray-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white transition-colors duration-300">
            <Download className="w-5 h-5 text-sarang-purple dark:text-sarang-periwinkle" />
            <span>Data & Privacy</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Export My Data</h3>
              <p className="text-sm text-gray-600">Download all your mood logs and playlist history</p>
            </div>
            <Button
              onClick={handleExportData}
              variant="outline"
              className="border-sarang-lavender text-sarang-purple hover:bg-sarang-lavender/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Privacy Preferences</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Your mood data is encrypted and stored securely</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>We never share your personal information with third parties</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>All AI analysis is processed anonymously</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sarang-lavender/30 dark:border-gray-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle className="text-gray-900 dark:text-white transition-colors duration-300">Need Help?</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
            Get support or learn more about Sarang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" className="border-sarang-lavender text-sarang-purple hover:bg-sarang-lavender/20">
              Contact Support
            </Button>
            <Button variant="outline" className="border-sarang-lavender text-sarang-purple hover:bg-sarang-lavender/20">
              View Tutorial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
