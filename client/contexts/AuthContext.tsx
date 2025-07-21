import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'investigator';
  full_name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isOwner: () => boolean;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('iris_token');
    const storedUser = localStorage.getItem('iris_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('iris_token');
        localStorage.removeItem('iris_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // For non-200 responses, try to get error message
        let errorMessage = `Erreur HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use the default error message
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        return { success: false, message: errorMessage };
      }

      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing response JSON:', error);
        return { success: false, message: 'Erreur de format de réponse du serveur' };
      }

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        
        localStorage.setItem('iris_token', data.token);
        localStorage.setItem('iris_user', JSON.stringify(data.user));
        
        return { success: true, message: data.message || 'Connexion réussie' };
      } else {
        return { success: false, message: data.message || 'Identifiants invalides' };
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { success: false, message: 'Impossible de contacter le serveur' };
      }
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  };

  const logout = () => {
    const currentToken = token;
    
    // Clear state immediately
    setUser(null);
    setToken(null);
    localStorage.removeItem('iris_token');
    localStorage.removeItem('iris_user');
    
    // Optional: Call logout endpoint (fire and forget)
    if (currentToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      }).catch(() => {
        // Ignore errors for logout endpoint
      });
    }
  };

  const isOwner = (): boolean => {
    return user?.role === 'owner';
  };

  const isAuthenticated = (): boolean => {
    return !!(user && token);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isOwner,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook for API calls with authentication
export function useAuthenticatedFetch() {
  const { token } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return authenticatedFetch;
}
