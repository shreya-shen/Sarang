import { useAuth } from '@clerk/clerk-react';

export const useAuthenticatedFetch = () => {
  const { getToken, isSignedIn } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!isSignedIn) {
      throw new Error('User is not signed in');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('Failed to get authentication token');
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    console.log('Making authenticated request to:', fullUrl);
    console.log('Token exists:', !!token);
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', response.status, errorData);
      throw new Error(`API request failed: ${response.status} ${errorData}`);
    }

    return response;
  };

  return { authenticatedFetch };
};
