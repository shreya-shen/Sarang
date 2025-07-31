import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sarang-cream via-sarang-lavender to-sarang-periwinkle dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 px-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <div className="space-y-4">
          <h1 className="text-6xl sm:text-8xl font-bold text-sarang-purple dark:text-sarang-periwinkle transition-colors duration-300">404</h1>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300">Page Not Found</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
            Oops! The page you're looking for seems to have gotten lost in the music. 
            Let's get you back to the rhythm.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-sarang-purple to-sarang-periwinkle hover:from-sarang-purple/90 hover:to-sarang-periwinkle/90 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto border-2 border-sarang-purple dark:border-sarang-periwinkle text-sarang-purple dark:text-sarang-periwinkle hover:bg-sarang-purple dark:hover:bg-sarang-periwinkle hover:text-white dark:hover:text-gray-900 px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
