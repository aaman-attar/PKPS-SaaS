import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  mfaRequired: boolean;
  mfaUsername: string;
  login: (username: string, password: string) => Promise<any>;
  verifyOTP: (username: string, otp: string) => Promise<any>;
  requestOTP: (mobile: string, purpose?: 'LOGIN' | 'REGISTRATION', username?: string) => Promise<any>;
  loginWithOTP: (mobile: string, otp_code: string) => Promise<any>;
  registerFarmer: (data: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved && saved !== 'undefined' && saved !== 'null' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUsername, setMfaUsername] = useState('');

  // Synchronize authentication state across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'access_token') {
        try {
          const saved = localStorage.getItem('user');
          setUser(saved && saved !== 'undefined' && saved !== 'null' ? JSON.parse(saved) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAuthenticated = !!user && !!localStorage.getItem('access_token');

  const login = async (username: string, password: string) => {
    const response = await api.post('/auth/login/', { username, password });
    if (response.data.mfa_required) {
      setMfaRequired(true);
      setMfaUsername(response.data.username);
      return {
        mfa_required: true,
        username: response.data.username,
        message: response.data.message,
        dev_otp: response.data.dev_otp ?? null,  // Present only when FAST2SMS_ENABLED=False
      };
    } else {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return { mfa_required: false, user: response.data.user };
    }
  };

  const verifyOTP = async (username: string, otp_code: string) => {
    const response = await api.post('/auth/verify-otp/', { username, otp_code });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    setMfaRequired(false);
    setMfaUsername('');
    return response.data;
  };

  const requestOTP = async (mobile: string, purpose: 'LOGIN' | 'REGISTRATION' = 'LOGIN', username?: string) => {
    const payload: any = { mobile, purpose };
    if (username) payload.username = username;
    const response = await api.post('/auth/otp/request/', payload);
    return response.data;
  };

  const loginWithOTP = async (mobile: string, otp_code: string) => {
    const response = await api.post('/auth/otp/login/', { mobile, otp_code });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data;
  };

  const registerFarmer = async (data: any) => {
    const response = await api.post('/auth/register/', data);
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setMfaRequired(false);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (err) {
      logout();
    }
  };

  useEffect(() => {
    if (localStorage.getItem('access_token') && !user) {
      refreshUser();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        mfaRequired,
        mfaUsername,
        login,
        verifyOTP,
        requestOTP,
        loginWithOTP,
        registerFarmer,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
