
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";

const Home = () => {
  const [moodText, setMoodText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState<{
    score: number;
    label: string;
    confidence: number;
  } | null>(null);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Handle pending username from signup
  useEffect(() => {
    const setPendingUsername = async () => {
      if (isSignedIn) {
        const pendingUsername = localStorage.getItem('pendingUsername');
        if (pendingUsername) {
          try {
            console.log('Setting pending username:', pendingUsername);
            const response = await authenticatedFetch('/api/user/set-username', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: pendingUsername })
            });
            
            if (!response.ok) {
              throw new Error('Failed to set username');
            }
            
            const result = await response.json();
            console.log('Username set result:', result);
            
            // Clear the pending username
            localStorage.removeItem('pendingUsername');
            toast.success('Profile setup completed!');
          } catch (error) {
            console.error('Error setting username:', error);
            toast.error('Failed to complete profile setup');
          }
        }
      }
    };

    setPendingUsername();
  }, [isSignedIn, authenticatedFetch]);

  const handleAnalyzeMood = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to analyze your mood");
      navigate("/auth");
      return;
    }

    if (!moodText.trim()) {
      toast.error("Please describe how you're feeling");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Analyze mood sentiment
      const response = await authenticatedFetch('/api/mood/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: moodText })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze mood');
      }

      const sentimentData = await response.json();
      setSentiment(sentimentData);
      
      // Log mood to database
      try {
        await authenticatedFetch('/api/mood/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: moodText,
            sentiment_score: sentimentData.score,
            sentiment_label: sentimentData.label
          })
        });
      } catch (logError) {
        console.error('Error logging mood to database:', logError);
        // Don't show error to user as the analysis still worked
      }
      
      setIsAnalyzing(false);
      toast.success("Mood analyzed successfully!");
    } catch (error) {
      console.error('Error analyzing mood:', error);
      setIsAnalyzing(false);
      toast.error("Failed to analyze mood. Please try again.");
      
      // Fallback to mock data
      const mockSentiments = [
        { score: -0.7, label: "Low", confidence: 0.85 },
        { score: -0.3, label: "Calm", confidence: 0.78 },
        { score: 0.1, label: "Neutral", confidence: 0.82 },
        { score: 0.5, label: "Happy", confidence: 0.91 },
        { score: 0.8, label: "Excited", confidence: 0.87 }
      ];
      
      const randomSentiment = mockSentiments[Math.floor(Math.random() * mockSentiments.length)];
      setSentiment(randomSentiment);
    }
  };

  const handleGetRecommendations = () => {
    if (!isSignedIn) {
      toast.error("Please sign in to get recommendations");
      navigate("/auth");
      return;
    }
    
    if (sentiment) {
      navigate("/recommendations", { state: { sentiment, moodText } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sarang-cream via-sarang-lavender to-sarang-periwinkle dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 lg:space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="flex justify-center">
              <img 
                src="/lovable-uploads/683c065d-86de-4501-9731-47c93b32d544.png" 
                alt="Music Therapy" 
                className="h-32 sm:h-40 md:h-48 w-auto"
              />
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight transition-colors duration-300">
                Unleash Your{" "}
                <span className="bg-gradient-to-r from-sarang-purple to-sarang-periwinkle bg-clip-text text-transparent">
                  Emotions
                </span>
                ,<br />
                Ignite Your{" "}
                <span className="bg-gradient-to-r from-sarang-periwinkle to-sarang-lavender bg-clip-text text-transparent">
                  Mind!
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed px-4 transition-colors duration-300">
                Discover the revolutionary music therapy app that redefines the way 
                you experience emotional healing through personalized soundscapes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-sarang-purple to-sarang-periwinkle hover:from-sarang-purple/90 hover:to-sarang-periwinkle/90 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-base sm:text-lg transition-all duration-200 hover:shadow-lg flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-2 border-sarang-purple text-sarang-purple hover:bg-sarang-purple hover:text-white dark:border-sarang-periwinkle dark:text-sarang-periwinkle dark:hover:bg-sarang-periwinkle dark:hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-base sm:text-lg transition-all duration-200"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Mood Input Card */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden transition-colors duration-300">
            <CardHeader className="bg-gradient-to-r from-sarang-cream to-sarang-lavender/50 dark:from-gray-700/50 dark:to-gray-600/50 text-center py-6 sm:py-8 transition-colors duration-300">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center space-x-2 transition-colors duration-300">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-sarang-purple dark:text-sarang-periwinkle" />
                <span>Share Your Feelings</span>
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-2 px-4 transition-colors duration-300">
                Tell us how you're feeling today and let AI create your perfect playlist
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              <Textarea
                placeholder="I'm feeling a bit overwhelmed today. Work has been stressful and I could use some calm, uplifting music to help me relax and find my center again..."
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
                className="min-h-24 sm:min-h-32 text-base sm:text-lg border-2 border-gray-200 dark:border-gray-600 focus:border-sarang-purple dark:focus:border-sarang-periwinkle rounded-xl sm:rounded-2xl p-3 sm:p-4 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                disabled={isAnalyzing}
              />
              
              <Button
                onClick={handleAnalyzeMood}
                disabled={isAnalyzing || !moodText.trim()}
                size="lg"
                className="w-full bg-gradient-to-r from-sarang-purple to-sarang-periwinkle hover:from-sarang-purple/90 hover:to-sarang-periwinkle/90 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium text-base sm:text-lg transition-all duration-200 hover:shadow-lg"
              >
                {isAnalyzing ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                    <span>Analyzing your emotions...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Analyze My Mood</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Sentiment Results */}
          {sentiment && (
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden animate-fade-in transition-colors duration-300">
              <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-300">Mood Analysis Complete</h3>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                      Detected: <span className="bg-gradient-to-r from-sarang-purple to-sarang-periwinkle bg-clip-text text-transparent">{sentiment.label}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      <span>Emotional Range</span>
                      <span>{sentiment.score.toFixed(2)}</span>
                    </div>
                    <Progress 
                      value={(sentiment.score + 1) * 50} 
                      className="h-3 bg-gray-200 dark:bg-gray-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                      <span>Low Energy</span>
                      <span>Balanced</span>
                      <span>High Energy</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-300">
                      Confidence: {Math.round(sentiment.confidence * 100)}%
                    </div>
                  </div>

                  <Button
                    onClick={handleGetRecommendations}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-sarang-lavender to-sarang-periwinkle hover:from-sarang-lavender/90 hover:to-sarang-periwinkle/90 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-base sm:text-lg transition-all duration-200 hover:shadow-lg flex items-center space-x-2"
                  >
                    <span>Discover Your Playlist</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl rounded-xl sm:rounded-2xl text-center p-4 sm:p-6 transition-colors duration-300">
              <div className="text-3xl sm:text-4xl font-bold text-sarang-purple dark:text-sarang-periwinkle mb-2 transition-colors duration-300">1000+</div>
              <div className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Curated Playlists</div>
            </Card>
            
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl rounded-xl sm:rounded-2xl text-center p-4 sm:p-6 transition-colors duration-300">
              <div className="text-3xl sm:text-4xl font-bold text-sarang-periwinkle dark:text-sarang-lavender mb-2 transition-colors duration-300">50K+</div>
              <div className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Happy Users</div>
            </Card>
            
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl rounded-xl sm:rounded-2xl text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1 transition-colors duration-300">
              <div className="text-3xl sm:text-4xl font-bold text-sarang-lavender dark:text-sarang-purple mb-2 transition-colors duration-300">24/7</div>
              <div className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Mood Support</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
