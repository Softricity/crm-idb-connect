import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface Partner {
  id: string;
  name: string;
  email: string;
  role: string;
  type?: string;
  branch_id?: string;
  branch_name?: string;
  branch_type?: string;
  permissions?: string[];
}

interface AuthContextType {
  partner: Partner | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.idbconnect.global';

// Cookie helpers
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.split('=')[1]);
  } catch {
    return null;
  }
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from cookie on mount
  useEffect(() => {
    const token = getCookie('auth-token');
    const userData = getCookie('auth-user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setPartner(user);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        deleteCookie('auth-token');
        deleteCookie('auth-user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store token and user data
      setCookie('auth-token', data.access_token, 7);
      setCookie('auth-user', JSON.stringify(data.partner), 7);
      
      setPartner(data.partner);
      
      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    deleteCookie('auth-token');
    deleteCookie('auth-user');
    setPartner(null);
    router.push('/login');
  };

  const value = {
    partner,
    isAuthenticated: !!partner,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
