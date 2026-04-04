import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

// Safely extract token from any response shape
const extractToken = (data) =>
  data?.token ||
  data?.accessToken ||
  data?.access_token ||
  data?.authToken ||
  null;

// Safely extract user from any response shape
const extractUser = (data) =>
  data?.user ||
  data?.data?.user ||
  data?.data ||
  data?.profile ||
  null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('medpilot_token');
    localStorage.removeItem('medpilot_user');
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('medpilot_token');
      const storedUser = localStorage.getItem('medpilot_user');
      if (storedToken) {
        try {
          // Restore from storage immediately so UI doesn't flash
          if (storedUser) setUser(JSON.parse(storedUser));
          // Then revalidate with server
          const res = await authAPI.getProfile();
          const freshUser = extractUser(res.data) || res.data;
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('medpilot_user', JSON.stringify(freshUser));
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const res = await authAPI.login(credentials);
    const data = res.data;

    const token = extractToken(data);
    const u = extractUser(data);

    if (!token) {
      // Some backends return 200 but embed token differently — log for debug
      console.warn('[MedPilot] Login response did not contain a recognisable token:', data);
      throw new Error('No token in server response');
    }

    localStorage.setItem('medpilot_token', token);

    // Store whatever user info we have; fall back to a minimal object
    const userToStore = u || { email: credentials.email };
    localStorage.setItem('medpilot_user', JSON.stringify(userToStore));
    setUser(userToStore);

    return userToStore;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    const resData = res.data;

    const token = extractToken(resData);
    const u = extractUser(resData);

    // Registration might not return a token (email verify required)
    if (token) {
      localStorage.setItem('medpilot_token', token);
      const userToStore = u || { email: data.email };
      localStorage.setItem('medpilot_user', JSON.stringify(userToStore));
      setUser(userToStore);
    }

    return resData;
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('medpilot_user', JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
