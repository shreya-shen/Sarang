
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeadphonesIcon, User, LogOut, Menu, X } from "lucide-react";
import { useUser, useClerk } from '@clerk/clerk-react';
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <img 
                src="/lovable-uploads/db55ce61-da39-4838-a1cf-c1dc1a8e6c03.png" 
                alt="Sarang Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sarang-purple to-sarang-periwinkle bg-clip-text text-transparent">
              Sarang
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-all duration-200 hover:text-sarang-purple dark:hover:text-sarang-periwinkle relative ${
                  location.pathname === item.path
                    ? "text-sarang-purple dark:text-sarang-periwinkle"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {item.label}
                {location.pathname === item.path && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-sarang-purple to-sarang-periwinkle rounded-full" />
                )}
              </Link>
            ))}
            
            <ThemeToggle />
            
            {!isSignedIn ? (
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-sarang-purple to-sarang-periwinkle hover:from-sarang-purple/90 hover:to-sarang-periwinkle/90 text-white px-4 xl:px-6 py-2 rounded-full font-medium transition-all duration-200 hover:shadow-lg text-sm">
                  Sign In
                </Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" align="end" forceMount>
                  <DropdownMenuItem className="font-normal text-gray-900 dark:text-gray-100">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.primaryEmailAddress?.emailAddress || user?.firstName || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        via Clerk
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="text-gray-900 dark:text-gray-100">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-gray-900 dark:text-gray-100">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? "text-sarang-purple dark:text-sarang-periwinkle bg-sarang-cream/50 dark:bg-gray-800"
                      : "text-gray-600 dark:text-gray-300 hover:text-sarang-purple dark:hover:text-sarang-periwinkle hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {!isSignedIn ? (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-sarang-purple to-sarang-periwinkle hover:from-sarang-purple/90 hover:to-sarang-periwinkle/90 text-white py-2 rounded-full font-medium transition-all duration-200">
                      Sign In
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {user?.primaryEmailAddress?.emailAddress || user?.firstName || 'User'}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/settings');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-gray-600 dark:text-gray-300"
                    >
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-gray-600 dark:text-gray-300"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
