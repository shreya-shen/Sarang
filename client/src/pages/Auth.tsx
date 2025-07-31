import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Mail, ArrowRight } from "lucide-react";
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const navigate = useNavigate();
  
  const { signIn, setActive } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setUsername("");
    setVerificationCode("");
    setPendingVerification(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (isSignUp && !username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        // Sign up flow - create account first, then set username in our database
        const result = await signUp?.create({
          emailAddress: email,
          password,
        });

        if (result?.status === "complete") {
          await setActiveSignUp({ session: result.createdSessionId });
          
          // Store the username for profile creation
          localStorage.setItem('pendingUsername', username);
          
          toast.success("Account created successfully!");
          navigate("/");
        } else if (result?.status === "missing_requirements") {
          await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
          
          // Store the username for later use
          localStorage.setItem('pendingUsername', username);
          
          setPendingVerification(true);
          toast.success("Check your email for verification code");
        }
      } else {
        // Sign in flow
        const result = await signIn?.create({
          identifier: email,
          password,
        });

        if (result?.status === "complete") {
          await setActive({ session: result.createdSessionId });
          toast.success("Signed in successfully!");
          navigate("/");
        }
      }
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    try {
      setLoading(true);
      const result = await signUp?.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result?.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
        
        // Store the username for profile creation
        localStorage.setItem('pendingUsername', username);
        
        toast.success("Email verified successfully!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifyAuth = async () => {
    try {
      setLoading(true);
      if (isSignUp) {
        await signUp?.authenticateWithRedirect({
          strategy: "oauth_spotify",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
      } else {
        await signIn?.authenticateWithRedirect({
          strategy: "oauth_spotify",
          redirectUrl: "/sso-callback", 
          redirectUrlComplete: "/",
        });
      }
    } catch (error: any) {
      toast.error("Spotify authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex transition-colors duration-300">
      {/* Left Side - Decorative Elements */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sarang-cream via-sarang-lavender to-sarang-periwinkle dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 p-8 xl:p-12 flex-col justify-center items-center relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 transition-colors duration-300"></div>
        
        {/* Decorative Audio Devices - Similar to your original design */}
        <div className="relative z-10 grid grid-cols-3 gap-4 xl:gap-6 mb-6 xl:mb-8">
          <div className="bg-black dark:bg-white rounded-full h-20 xl:h-24 w-10 xl:w-12 flex items-center justify-center transition-colors duration-300">
            <div className="bg-white dark:bg-black rounded-full h-12 xl:h-16 w-3 xl:w-4 transition-colors duration-300"></div>
          </div>
          <div className="bg-sarang-purple dark:bg-sarang-periwinkle rounded-2xl h-20 xl:h-24 w-10 xl:w-12 flex items-center justify-center transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-full h-5 xl:h-6 w-5 xl:w-6 transition-colors duration-300"></div>
          </div>
          <div className="bg-yellow-400 dark:bg-yellow-500 rounded-2xl h-20 xl:h-24 w-10 xl:w-12 flex items-center justify-center transition-colors duration-300">
            <div className="h-12 xl:h-16 w-1 bg-black dark:bg-gray-900 rounded-full transition-colors duration-300"></div>
          </div>
          
          <div className="bg-white dark:bg-gray-200 rounded-full h-20 xl:h-24 w-10 xl:w-12 border-4 border-black dark:border-gray-700 flex items-center justify-center transition-colors duration-300">
            <div className="bg-black dark:bg-gray-700 rounded-full h-6 xl:h-8 w-6 xl:w-8 transition-colors duration-300"></div>
          </div>
          <div className="bg-yellow-400 dark:bg-yellow-500 rounded-2xl h-20 xl:h-24 w-10 xl:w-12 flex flex-col items-center justify-center space-y-1 transition-colors duration-300">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="bg-black dark:bg-gray-900 h-0.5 w-4 xl:w-6 rounded-full transition-colors duration-300"></div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-200 rounded-2xl h-20 xl:h-24 w-10 xl:w-12 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center transition-colors duration-300">
            <div className="space-y-2">
              <div className="bg-black dark:bg-gray-700 rounded-full h-2 w-2 transition-colors duration-300"></div>
              <div className="bg-black dark:bg-gray-700 rounded-full h-2 w-2 transition-colors duration-300"></div>
            </div>
          </div>
          
          <div className="bg-sarang-purple dark:bg-sarang-periwinkle rounded-2xl h-20 xl:h-24 w-10 xl:w-12 flex items-center justify-center transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-sm h-5 xl:h-6 w-5 xl:w-6 transition-colors duration-300"></div>
          </div>
          <div className="bg-black dark:bg-gray-800 rounded-2xl h-20 xl:h-24 w-10 xl:w-12 flex flex-col items-center justify-center space-y-1 transition-colors duration-300">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-300 h-0.5 w-4 xl:w-6 rounded-full transition-colors duration-300"></div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-center max-w-md">
          <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            Unleash Your{" "}
            <span className="bg-gradient-to-r from-sarang-purple to-sarang-periwinkle bg-clip-text text-transparent">
              Emotions
            </span>,<br />
            Ignite Your{" "}
            <span className="bg-gradient-to-r from-sarang-periwinkle to-sarang-lavender bg-clip-text text-transparent">
              Mind!
            </span>
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Introducing Sarang, the revolutionary music therapy app that redefines the way you experience emotional healing.
          </p>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src="/lovable-uploads/db55ce61-da39-4838-a1cf-c1dc1a8e6c03.png" 
                alt="Sarang Logo" 
                className="h-16 w-16"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isSignUp ? "Join Sarang" : "Welcome Back"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {isSignUp 
                  ? "Create your account to start your journey" 
                  : "Sign in to continue your musical experience"
                }
              </p>
            </div>
          </div>

          {/* Auth Card */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8 space-y-6">
              {!pendingVerification ? (
                <>
                  {/* Spotify Button */}
                  <Button
                    onClick={handleSpotifyAuth}
                    disabled={loading}
                    className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        <span>{isSignUp ? "Sign up" : "Login"} with Spotify</span>
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
                    </div>
                  </div>

                  {/* Email Sign In */}
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-gray-200 dark:border-gray-600 focus:border-sarang-purple focus:ring-sarang-purple dark:bg-gray-700 dark:text-white py-3"
                        disabled={loading}
                      />
                    </div>
                    
                    {isSignUp && (
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label>
                        <Input 
                          id="username" 
                          type="text" 
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="border-gray-200 dark:border-gray-600 focus:border-sarang-purple focus:ring-sarang-purple dark:bg-gray-700 dark:text-white py-3"
                          disabled={loading}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-gray-200 dark:border-gray-600 focus:border-sarang-purple focus:ring-sarang-purple dark:bg-gray-700 dark:text-white py-3"
                        disabled={loading}
                      />
                    </div>

                    <Button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-sarang-purple to-sarang-periwinkle hover:from-sarang-purple/90 hover:to-sarang-periwinkle/90 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                        </>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                /* Verification Code Form */
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Verify Your Email
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      We sent a verification code to <strong>{email}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verification-code" className="text-gray-700 dark:text-gray-300">
                        Verification Code
                      </Label>
                      <Input 
                        id="verification-code" 
                        type="text" 
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="border-gray-200 dark:border-gray-600 focus:border-sarang-purple focus:ring-sarang-purple dark:bg-gray-700 dark:text-white py-3 text-center text-lg tracking-widest"
                        disabled={loading}
                        maxLength={6}
                      />
                    </div>

                    <Button 
                      type="submit"
                      disabled={loading || verificationCode.length !== 6}
                      className="w-full bg-gradient-to-r from-sarang-purple to-sarang-periwinkle hover:from-sarang-purple/90 hover:to-sarang-periwinkle/90 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <ArrowRight className="w-5 h-5" />
                          <span>Verify Email</span>
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        setPendingVerification(false);
                        setVerificationCode("");
                      }}
                      className="text-sm text-sarang-purple hover:text-sarang-purple/80 font-semibold transition-colors"
                      disabled={loading}
                    >
                      ← Back to sign up
                    </button>
                  </div>
                </div>
              )}

              {!pendingVerification && (
                /* Toggle Sign Up/Sign In */
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    <button
                      onClick={handleToggleMode}
                      className="ml-1 text-sarang-purple hover:text-sarang-purple/80 font-semibold transition-colors"
                      disabled={loading}
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
