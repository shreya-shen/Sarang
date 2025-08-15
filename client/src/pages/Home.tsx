
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Sparkles, User, Settings, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";

const Home = () => {
  const [moodText, setMoodText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [sentiment, setSentiment] = useState<{
    score: number;
    label: string;
    confidence: number;
  } | null>(null);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isProfileDropdownOpen && !target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen]);

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
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: '#fff5da' }}>
      {/* Hero Section - Full viewport, exactly like reference */}
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Main Image positioned to fill entire viewport */}
        <div className="relative w-full h-screen">
          <img 
            src="/lovable-uploads/landingPageIcon.png" 
            alt="Music Therapy - Girl with flowing hair" 
            className="w-full h-full object-cover object-center hero-image"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          
          {/* Optional: Add a higher resolution version for high DPI displays */}
          <picture className="w-full h-full">
            <source 
              srcSet="/lovable-uploads/landingPageIcon.png 1x, /lovable-uploads/landingPageIcon.png 2x" 
              media="(min-width: 768px)"
            />
            <img 
              src="/lovable-uploads/landingPageIcon.png" 
              alt="Music Therapy - Girl with flowing hair" 
              className="w-full h-full object-cover object-center absolute inset-0 hero-image"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          
          {/* Top Navigation Options - Like in reference */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
            {/* Left - Sarang Logo and Name */}
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/Sarang-logo-transparent.png" 
                alt="Sarang Logo" 
                className="w-14 h-14 object-contain"
              />
              <span className="text-2xl font-black text-sarang-charcoal">
                Sarang
              </span>
            </div>
            
            {/* Right - Navigation Options and Profile */}
            <div className="flex items-center space-x-8">
              {/* Navigation Links */}
              <div className="flex space-x-8">
                <button 
                  onClick={() => navigate("/")}
                  className="text-lg text-white hover:text-white/80 transition-colors font-black tracking-wide"
                >
                  Home
                </button>
                <button 
                  onClick={() => navigate("/history")}
                  className="text-lg text-white hover:text-white/80 transition-colors font-black tracking-wide"
                >
                  History
                </button>
                <button 
                  onClick={() => navigate("/about")}
                  className="text-lg text-white hover:text-white/80 transition-colors font-black tracking-wide"
                >
                  About ♪
                </button>
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 px-5 py-3 rounded-full backdrop-blur-sm transition-all duration-200 bg-sarang-charcoal/80"
                >
                  <User className="w-5 h-5 text-white" />
                  <span className="text-white text-base font-bold">
                    {isSignedIn ? (user?.firstName || 'Profile') : 'Sign In'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-white transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-60 rounded-lg shadow-xl border-2 overflow-hidden z-30 border-sarang-charcoal"
                    style={{ backgroundColor: '#fff5da' }}
                  >
                    <div className="py-2">{isSignedIn ? (
                        <>
                          <div className="px-5 py-3 border-b border-sarang-charcoal">
                            <p className="text-sm font-bold text-sarang-charcoal break-words whitespace-normal">
                              {user?.emailAddresses?.[0]?.emailAddress}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigate('/profile');
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-5 py-3 text-base hover:opacity-80 transition-opacity flex items-center space-x-3 font-semibold text-sarang-charcoal"
                          >
                            <User className="w-5 h-5" />
                            <span>Account</span>
                          </button>
                          <button
                            onClick={() => {
                              navigate('/settings');
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-5 py-3 text-base hover:opacity-80 transition-opacity flex items-center space-x-3 font-semibold text-sarang-charcoal"
                          >
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                          </button>
                          <hr className="border-sarang-charcoal" />
                          <button
                            onClick={async () => {
                              try {
                                await signOut();
                                setIsProfileDropdownOpen(false);
                                toast.success('Signed out successfully');
                                navigate('/');
                              } catch (error) {
                                toast.error('Error signing out');
                              }
                            }}
                            className="w-full text-left px-5 py-3 text-base hover:opacity-80 transition-opacity font-semibold text-sarang-charcoal"
                          >
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            navigate('/auth');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-5 py-3 text-base hover:opacity-80 transition-opacity font-semibold text-sarang-charcoal"
                        >
                          Sign In
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Content - Positioned exactly like reference */}
          <div className="absolute inset-0 flex items-center justify-end pr-8 md:pr-16 lg:pr-24">
            <div className="text-right space-y-6 max-w-md lg:max-w-lg z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                SARANG<br />
              </h1>
              
              <p className="text-sm md:text-base lg:text-lg text-white/90 leading-relaxed drop-shadow-lg max-w-sm">
                Your personal music companion - blending science, emotion, and sound
                to help you feel, heal, and thrive! Experience emotional healing through 
                personalised soundscapes. 
              </p>
              
              <Button 
                size="lg"
                className="bg-[#213447] hover:bg-[#213447]/90 text-white font-semibold px-8 py-3 rounded-full text-sm md:text-base transition-all duration-200 hover:shadow-2xl"
              >
                LEARN MORE
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the content */}
      <div className="px-0 py-8">
        <div className="space-y-8 sm:space-y-10 lg:space-y-12">

          {/* Mood Input Card */}
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden transition-colors duration-300">
            <CardHeader className="bg-transparent text-center py-6 sm:py-8 transition-colors duration-300">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-sarang-charcoal flex items-center justify-center space-x-2 transition-colors duration-300 font-['Montserrat']">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-sarang-charcoal" />
                <span>Share Your Feelings</span>
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-sarang-charcoal mt-2 px-4 transition-colors duration-300 font-['Montserrat']">
                Tell us how you're feeling today and let AI create your perfect playlist
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              <Textarea
                placeholder="I'm feeling a bit overwhelmed today. Work has been stressful and I could use some calm, uplifting music to help me relax and find my center again..."
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
                className="min-h-24 sm:min-h-32 text-base sm:text-lg border-2 border-sarang-charcoal focus:border-sarang-coral rounded-xl sm:rounded-2xl p-3 sm:p-4 resize-none bg-transparent text-sarang-charcoal transition-colors duration-300 font-['Montserrat'] placeholder:text-sarang-charcoal/60"
                disabled={isAnalyzing}
              />
              
              <Button
                onClick={handleAnalyzeMood}
                disabled={isAnalyzing || !moodText.trim()}
                size="lg"
                className="w-full bg-[#213447] hover:bg-[#213447]/90 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium text-base sm:text-lg transition-all duration-200 hover:shadow-lg"
              >
                {isAnalyzing ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                    <span className="font-['Montserrat']">Analyzing your emotions...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-['Montserrat']">Analyze My Mood</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
            </div>
          </div>

          {/* Sentiment Results */}
          {sentiment && (
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <Card className="bg-sarang-cream backdrop-blur-sm border-2 border-black shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden animate-fade-in transition-colors duration-300">
              <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">Mood Analysis Complete</h3>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold font-['Montserrat']">
                      Detected: <span className="text-sarang-coral">{sentiment.label}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">
                      <span>Emotional Range</span>
                      <span>{sentiment.score.toFixed(2)}</span>
                    </div>
                    <Progress 
                      value={(sentiment.score + 1) * 50} 
                      className="h-3 bg-sarang-gray/30"
                    />
                    <div className="flex justify-between text-xs text-sarang-charcoal/70 transition-colors duration-300 font-['Montserrat']">
                      <span>Low Energy</span>
                      <span>Balanced</span>
                      <span>High Energy</span>
                    </div>
                    <div className="text-sm text-sarang-charcoal mt-2 transition-colors duration-300 font-['Montserrat']">
                      Confidence: {Math.round(sentiment.confidence * 100)}%
                    </div>
                  </div>

                  <Button
                    onClick={handleGetRecommendations}
                    size="lg"
                    className="w-full sm:w-auto bg-[#213447] hover:bg-[#213447]/90 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-base sm:text-lg transition-all duration-200 hover:shadow-lg flex items-center space-x-2"
                  >
                    <span className="font-['Montserrat']">Discover Your Playlist</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
              </div>
            </div>
          )}

          {/* Stats Section */}
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16">
            <Card className="bg-sarang-cream border-2 border-black shadow-xl rounded-xl sm:rounded-2xl text-center p-4 sm:p-6 transition-colors duration-300">
              <div className="text-3xl sm:text-4xl font-bold text-sarang-coral mb-2 transition-colors duration-300 font-['Montserrat']">1000+</div>
              <div className="text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">Curated Playlists</div>
            </Card>
            
            <Card className="bg-sarang-cream border-2 border-black shadow-xl rounded-xl sm:rounded-2xl text-center p-4 sm:p-6 transition-colors duration-300">
              <div className="text-3xl sm:text-4xl font-bold text-sarang-navy mb-2 transition-colors duration-300 font-['Montserrat']">50K+</div>
              <div className="text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">Happy Users</div>
            </Card>
            
            <Card className="bg-sarang-cream border-2 border-black shadow-xl rounded-xl sm:rounded-2xl text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1 transition-colors duration-300">
              <div className="text-3xl sm:text-4xl font-bold text-sarang-brown mb-2 transition-colors duration-300 font-['Montserrat']">24/7</div>
              <div className="text-sarang-charcoal transition-colors duration-300 font-['Montserrat']">Mood Support</div>
            </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom spacing */}
      <div className="py-8"></div>
    </div>
  );
};

export default Home;
