import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, Music, HeadphonesIcon, User } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MoodEntry {
  id: string;
  date: string;
  inputText: string;
  sentimentScore: number;
  moodLabel: string;
  songsCount?: number;
}

interface PlaylistEntry {
  id: string;
  userId: string;
  inputText: string;
  songData: any; // Match your schema: camelCase
  created_at: string;
}

const MoodHistory = () => {
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [playlistHistory, setPlaylistHistory] = useState<PlaylistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSignedIn } = useUser();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const navigate = useNavigate();

  // Show sign-in message if user is not signed in
  if (!isSignedIn) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in px-4 sm:px-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-sarang-charcoal font-['Montserrat']">
            My Mood Journey
          </h1>
          <p className="text-sarang-brown max-w-2xl mx-auto font-['Montserrat']">
            Track your emotional wellness and see how music therapy is helping you over time
          </p>
        </div>
        
        <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl text-center py-16 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent>
            <User className="h-16 w-16 text-sarang-gray mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-sarang-charcoal mb-2 font-['Montserrat']">
              Sign in to view your history
            </h3>
            <p className="text-sarang-brown mb-6 font-semibold font-['Montserrat']">
              Track your mood journey and see your progress over time
            </p>
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-sarang-navy hover:bg-sarang-navy/90 text-white font-['Montserrat']"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (!isSignedIn) {
      return; // Don't navigate immediately, let the component render the sign-in message
    }
    
    fetchUserHistory();
  }, [isSignedIn]);

  const fetchUserHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch mood history
      const moodResponse = await authenticatedFetch('/api/mood/history');
      let formattedMoodData: MoodEntry[] = [];
      
      if (moodResponse.ok) {
        const moodData = await moodResponse.json();
        formattedMoodData = moodData.map((entry: any) => ({
          id: entry.id,
          date: entry.created_at,
          inputText: entry.inputText, // Match your schema: camelCase
          sentimentScore: entry.sentimentScore, // Match your schema: camelCase
          moodLabel: entry.sentimentScore > 0.5 ? "Happy" : entry.sentimentScore > 0 ? "Neutral" : "Low", // Calculate label since it's not stored
          songsCount: 0 // Will be updated with playlist data
        }));
        setMoodHistory(formattedMoodData);
      }

      // Fetch playlist history
      const playlistResponse = await authenticatedFetch('/api/playlist/history');
      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        setPlaylistHistory(playlistData);
        
        // Update mood entries with song counts
        const updatedMoodData = formattedMoodData.map((mood: MoodEntry) => {
          const playlist = playlistData.find((p: PlaylistEntry) => p.inputText === mood.inputText); // Match by inputText since no direct mood_id
          return {
            ...mood,
            songsCount: playlist?.songData?.recommendations?.length || 0
          };
        });
        setMoodHistory(updatedMoodData);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error("Failed to load your history");
    } finally {
      setLoading(false);
    }
  };

  const chartData = moodHistory.map(entry => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: entry.sentimentScore,
    label: entry.moodLabel
  }));

  const getMoodColor = (score: number) => {
    if (score < -0.5) return "bg-red-100 text-red-800 border-red-200";
    if (score < 0) return "bg-orange-100 text-orange-800 border-orange-200";
    if (score < 0.3) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (score < 0.7) return "bg-green-100 text-green-800 border-green-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  const getPlaylistForMood = (moodId: string) => {
    // Since we don't have direct mood_id linking, match by inputText
    const mood = moodHistory.find(m => m.id === moodId);
    return playlistHistory.find(p => p.inputText === mood?.inputText);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-sarang-charcoal font-['Montserrat']">
            My Mood Journey
          </h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sarang-coral"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no history
  if (moodHistory.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-sarang-charcoal font-['Montserrat']">
            My Mood Journey
          </h1>
          <p className="text-sarang-brown max-w-2xl mx-auto font-['Montserrat']">
            Track your emotional wellness and see how music therapy is helping you over time
          </p>
        </div>
        
        <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl text-center py-16 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent>
            <HeadphonesIcon className="h-16 w-16 text-sarang-gray mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-sarang-charcoal mb-2 font-['Montserrat']">
              Your history will appear here
            </h3>
            <p className="text-sarang-brown mb-6 font-semibold font-['Montserrat']">
              Start by analyzing your mood to see your journey unfold
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="bg-sarang-navy hover:bg-sarang-navy/90 text-white font-['Montserrat']"
            >
              Analyze Your Mood
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const averageMood = moodHistory.reduce((sum, entry) => sum + entry.sentimentScore, 0) / moodHistory.length;
  const totalSessions = moodHistory.length;
  const totalSongs = moodHistory.reduce((sum, entry) => sum + (entry.songsCount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">
          My Mood Journey
        </h1>
        <p className="text-sarang-brown max-w-2xl mx-auto px-4 transition-colors duration-300 font-['Montserrat']">
          Track your emotional wellness and see how music therapy is helping you over time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-4 sm:pt-6 px-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sarang-coral rounded-full transition-colors duration-300">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white transition-colors duration-300" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">
                  {averageMood > 0 ? '+' : ''}{averageMood.toFixed(2)}
                </div>
                <div className="text-sm text-sarang-brown transition-colors duration-300 font-['Montserrat'] font-semibold">Average Mood</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-4 sm:pt-6 px-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sarang-navy rounded-full transition-colors duration-300">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white transition-colors duration-300" />
              </div>
              <div>
                <div className="text-2xl font-bold text-sarang-charcoal font-['Montserrat']">{totalSessions}</div>
                <div className="text-sm text-sarang-brown font-['Montserrat'] font-semibold">Therapy Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-4 sm:pt-6 px-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sarang-gray rounded-full transition-colors duration-300">
                <Music className="h-5 w-5 sm:h-6 sm:w-6 text-white transition-colors duration-300" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">{totalSongs}</div>
                <div className="text-sm text-sarang-brown transition-colors duration-300 font-['Montserrat'] font-semibold">Songs Recommended</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood Chart */}
      <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sarang-charcoal font-['Montserrat']">
            <TrendingUp className="w-5 h-5 text-sarang-coral" />
            <span>Mood Trend</span>
          </CardTitle>
          <CardDescription className="text-sarang-brown font-['Montserrat']">
            Your emotional journey over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#6d504d" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#4e575b"
                  fontSize={12}
                  fontFamily="Montserrat"
                />
                <YAxis 
                  domain={[-1, 1]}
                  stroke="#4e575b"
                  fontSize={12}
                  fontFamily="Montserrat"
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip 
                  formatter={(value: number, name) => [value.toFixed(2), 'Mood Score']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: '#f0d9bc',
                    border: '2px solid #130f10',
                    borderRadius: '12px',
                    fontFamily: 'Montserrat'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#d76e72" 
                  strokeWidth={3}
                  dot={{ fill: '#d76e72', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#213447' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sarang-charcoal font-['Montserrat']">
            <HeadphonesIcon className="w-5 h-5 text-sarang-coral" />
            <span>Recent Sessions</span>
          </CardTitle>
          <CardDescription className="font-semibold text-sarang-brown font-['Montserrat']">
            Your latest mood therapy sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moodHistory.slice(-5).reverse().map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border-2 border-sarang-gray/30 hover:border-sarang-coral/50 transition-all duration-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge className={getMoodColor(entry.sentimentScore)}>
                      {entry.moodLabel}
                    </Badge>
                    <span className="text-sm text-sarang-brown font-semibold font-['Montserrat']">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <p className="text-sarang-charcoal text-sm font-semibold font-['Montserrat']">
                    "{entry.inputText}"
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-sarang-brown font-semibold font-['Montserrat']">
                    <span>Score: {entry.sentimentScore.toFixed(2)}</span>
                    <span>•</span>
                    <span>{entry.songsCount || 0} songs recommended</span>
                  </div>
                </div>
                {getPlaylistForMood(entry.id) ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-sarang-navy hover:bg-sarang-navy/90 text-white border-sarang-navy font-['Montserrat']"
                    onClick={() => {
                      const playlist = getPlaylistForMood(entry.id);
                      if (playlist) {
                        navigate("/recommendations", { 
                          state: { 
                            sentiment: { 
                              score: entry.sentimentScore, 
                              label: entry.moodLabel, 
                              confidence: 0.8 
                            }, 
                            moodText: entry.inputText,
                            playlistData: playlist.songData
                          } 
                        });
                      }
                    }}
                  >
                    View Playlist
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-sarang-navy hover:bg-sarang-navy/90 text-white border-sarang-navy font-['Montserrat']"
                    disabled
                  >
                    No Playlist
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-sarang-charcoal font-['Montserrat']">Your Wellness Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-sarang-charcoal font-['Montserrat']">Progress Highlights</h4>
              <ul className="space-y-2 text-sm text-sarang-brown font-['Montserrat']">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-coral rounded-full"></div>
                  <span>Your mood has improved by 40% this week</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-navy rounded-full"></div>
                  <span>You've been consistent with daily sessions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-gray rounded-full"></div>
                  <span>Music therapy is showing positive effects</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sarang-charcoal font-['Montserrat']">Recommendations</h4>
              <ul className="space-y-2 text-sm text-sarang-brown font-['Montserrat']">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-coral rounded-full"></div>
                  <span>Try morning sessions for better results</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-navy rounded-full"></div>
                  <span>Consider adding meditation between songs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-sarang-gray rounded-full"></div>
                  <span>Share your progress with a wellness coach</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MoodHistory;
