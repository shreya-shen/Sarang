
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeadphonesIcon, User, Menu, X, Settings, ChevronDown } from "lucide-react";
import { useUser, useClerk } from '@clerk/clerk-react';
import { toast } from "sonner";

export const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/mood-history", label: "History" },
    { path: "/about", label: "About" },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

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

  return (
    <nav className="bg-sarang-cream backdrop-blur-md border-b border-sarang-gray sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 sm:space-x-3">
            <div className="relative">
              <img 
                src="/lovable-uploads/Sarang-logo-transparent.png" 
                alt="Sarang Logo" 
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
              />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-sarang-charcoal">
              Sarang
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8 xl:space-x-10">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-lg font-bold transition-all duration-200 hover:text-sarang-coral relative tracking-wide ${
                  location.pathname === item.path
                    ? "text-sarang-coral"
                    : "text-sarang-charcoal"
                }`}
              >
                {item.label}
                {location.pathname === item.path && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sarang-coral rounded-full" />
                )}
              </Link>
            ))}
            
            {/* Profile Dropdown */}
            <div className="relative profile-dropdown-container">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 px-5 py-3 rounded-full backdrop-blur-sm transition-all duration-200 bg-sarang-charcoal/80"
              >
                <User className="w-5 h-5 text-white" />
                <span className="text-white text-base font-bold">
                  {isSignedIn ? (user?.firstName || 'Profile') : 'Profile'}
                </span>
                <ChevronDown className={`w-5 h-5 text-white transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-52 rounded-lg shadow-xl border-2 overflow-hidden z-30 bg-sarang-cream border-sarang-charcoal"
                >
                  <div className="py-2">
                    {isSignedIn ? (
                      <>
                        <div className="px-5 py-3 border-b border-sarang-charcoal">
                          <p className="text-sm font-bold text-sarang-charcoal">
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
                          onClick={() => {
                            handleSignOut();
                            setIsProfileDropdownOpen(false);
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

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-10 w-10 p-2 text-white"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-sarang-charcoal/95 backdrop-blur-md lg:hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                  <HeadphonesIcon className="h-8 w-8 text-sarang-coral" />
                  <h1 className="text-2xl font-['Montserrat'] font-black text-white">
                    SARANG
                  </h1>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-6">
                <div className="space-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-6 py-3 text-lg font-bold rounded-lg transition-colors ${
                        location.pathname === item.path
                          ? 'bg-sarang-coral text-white'
                          : 'text-sarang-cream hover:bg-sarang-brown/20'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <hr className="border-sarang-brown/30" />

                {/* Mobile Profile Section */}
                <div className="space-y-4 pt-4">
                  {isSignedIn ? (
                    <>
                      <div className="px-6 py-3 bg-sarang-cream/10 rounded-lg">
                        <p className="text-sarang-cream text-sm opacity-75 mb-1">Signed in as</p>
                        <p className="text-white font-bold truncate">
                          {user?.emailAddresses?.[0]?.emailAddress}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-6 py-3 text-lg font-bold text-sarang-cream hover:bg-sarang-brown/20 rounded-lg transition-colors flex items-center space-x-3"
                      >
                        <User className="w-5 h-5" />
                        <span>Account</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-6 py-3 text-lg font-bold text-sarang-cream hover:bg-sarang-brown/20 rounded-lg transition-colors flex items-center space-x-3"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-6 py-3 text-lg font-bold text-sarang-coral hover:bg-sarang-coral/20 rounded-lg transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        navigate('/auth');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-6 py-4 bg-sarang-coral text-white text-lg font-bold rounded-lg hover:bg-sarang-coral/90 transition-colors"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
