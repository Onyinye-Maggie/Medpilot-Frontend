import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

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
          if (storedUser) setUser(JSON.parse(storedUser));
          const res = await authAPI.getProfile();
          // Profile returns: { success, data: { _id, name, email, role, ... } }
          const freshUser = res.data?.data || res.data;
          if (freshUser && typeof freshUser === 'object') {
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
    // Response: { success, data: { user: {...}, accessToken, refreshToken } }
    const data = res.data?.data || res.data;
    const token = data?.accessToken;
    const u = data?.user;

    if (!token) throw new Error('No access token received from server');

    localStorage.setItem('medpilot_token', token);
    const userToStore = u || { email: credentials.email };
    localStorage.setItem('medpilot_user', JSON.stringify(userToStore));
    setUser(userToStore);
    return userToStore;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authAPI.register(payload);
    // Registration may or may not return a token (email verify required)
    const data = res.data?.data || res.data;
    const token = data?.accessToken;
    const u = data?.user;
    if (token) {
      localStorage.setItem('medpilot_token', token);
      const userToStore = u || { email: payload.email };
      localStorage.setItem('medpilot_user', JSON.stringify(userToStore));
      setUser(userToStore);
    }
    return res.data;
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('medpilot_user', JSON.stringify(updated));
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
