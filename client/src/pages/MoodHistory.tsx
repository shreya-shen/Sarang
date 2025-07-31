
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, Music, HeadphonesIcon } from "lucide-react";
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

  useEffect(() => {
    if (!isSignedIn) {
      navigate("/auth");
      return;
    }
    
    fetchUserHistory();
  }, [isSignedIn, navigate]);

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
          <h1 className="text-3xl md:text-4xl font-bold text-sarang-purple">
            My Mood Journey
          </h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sarang-purple"></div>
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
          <h1 className="text-3xl md:text-4xl font-bold text-sarang-purple">
            My Mood Journey
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track your emotional wellness and see how music therapy is helping you over time
          </p>
        </div>
        
        <Card className="mood-card text-center py-16">
          <CardContent>
            <HeadphonesIcon className="h-16 w-16 text-sarang-lavender mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Your history will appear here
            </h3>
            <p className="text-gray-600 mb-6">
              Start by analyzing your mood to see your journey unfold
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-sarang-purple to-sarang-periwinkle hover:from-sarang-purple/90 hover:to-sarang-periwinkle/90 text-white"
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-sarang-purple dark:text-sarang-periwinkle transition-colors duration-300">
          My Mood Journey
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 transition-colors duration-300">
          Track your emotional wellness and see how music therapy is helping you over time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sarang-lavender/30 dark:border-gray-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-4 sm:pt-6 px-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sarang-lavender dark:bg-sarang-periwinkle/20 rounded-full transition-colors duration-300">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-sarang-purple dark:text-sarang-periwinkle transition-colors duration-300" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  {averageMood > 0 ? '+' : ''}{averageMood.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Average Mood</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sarang-lavender/30 dark:border-gray-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-4 sm:pt-6 px-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sarang-periwinkle dark:bg-sarang-lavender/20 rounded-full transition-colors duration-300">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-sarang-purple dark:text-sarang-periwinkle transition-colors duration-300" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{totalSessions}</div>
                <div className="text-sm text-gray-600">Therapy Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mood-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sarang-purple rounded-full">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{totalSongs}</div>
                <div className="text-sm text-gray-600">Songs Recommended</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood Chart */}
      <Card className="mood-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-sarang-purple" />
            <span>Mood Trend</span>
          </CardTitle>
          <CardDescription>
            Your emotional journey over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C0C9EE" />
                <XAxis 
                  dataKey="date" 
                  stroke="#898AC4"
                  fontSize={12}
                />
                <YAxis 
                  domain={[-1, 1]}
                  stroke="#898AC4"
                  fontSize={12}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip 
                  formatter={(value: number, name) => [value.toFixed(2), 'Mood Score']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: '#FFF2E0',
                    border: '1px solid #C0C9EE',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#898AC4" 
                  strokeWidth={3}
                  dot={{ fill: '#898AC4', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#A2AADB' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card className="mood-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HeadphonesIcon className="w-5 h-5 text-sarang-purple" />
            <span>Recent Sessions</span>
          </CardTitle>
          <CardDescription>
            Your latest mood therapy sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moodHistory.slice(-5).reverse().map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-sarang-lavender/30">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge className={getMoodColor(entry.sentimentScore)}>
                      {entry.moodLabel}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">
                    "{entry.inputText}"
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Score: {entry.sentimentScore.toFixed(2)}</span>
                    <span>•</span>
                    <span>{entry.songsCount || 0} songs recommended</span>
                  </div>
                </div>
                {getPlaylistForMood(entry.id) ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-sarang-lavender text-sarang-purple hover:bg-sarang-lavender/20"
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
                    className="border-gray-300 text-gray-500 cursor-not-allowed"
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
      <Card className="mood-card">
        <CardHeader>
          <CardTitle className="text-sarang-purple">Your Wellness Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Progress Highlights</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Your mood has improved by 40% this week</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>You've been consistent with daily sessions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Music therapy is showing positive effects</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Try morning sessions for better results</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>Consider adding meditation between songs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
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
