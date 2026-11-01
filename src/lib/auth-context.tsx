'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthTokens, clearAuthTokens } from './api';

export interface UserProfile {
  id: number;
  full_name: string;
  first_name?: string;
  second_name?: string;
  batch: string;
  competing_batch?: string;
  college: string;
  department: string;
  fellowship_team: string;
  gender?: string;
  academic_year?: string;
  primary_position?: string;
  secondary_position?: string;
  preferred_jersey_number?: number;
  personal_chant?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  is_football_eligible: boolean;
  profile_picture?: string | null;
  jersey_picture?: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'MEMBER' | 'MANAGER';
  is_manager: boolean;
  profile?: UserProfile | null;
  player_registration?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { username?: string; email?: string; password: string }) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({} as User),
  register: async () => ({} as User),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.auth.getMe();
      setUser(data);
    } catch {
      clearAuthTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.auth.login(credentials);
    if (res.access) {
      setAuthTokens(res.access, res.refresh);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Invalid authentication response.');
  };

  const register = async (userData: any) => {
    const res = await api.auth.register(userData);
    if (res.tokens?.access) {
      setAuthTokens(res.tokens.access, res.tokens.refresh);
      setUser(res.user);
      return res.user;
    }
    return res.user;
  };

  const logout = () => {
    clearAuthTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
