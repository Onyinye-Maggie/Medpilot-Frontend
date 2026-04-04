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
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          const res = await authAPI.getProfile();
          setUser(res.data.user || res.data);
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
    const { token: t, user: u } = res.data;
    localStorage.setItem('medpilot_token', t);
    localStorage.setItem('medpilot_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    const { token: t, user: u } = res.data;
    localStorage.setItem('medpilot_token', t);
    localStorage.setItem('medpilot_user', JSON.stringify(u));
    setUser(u);
    return u;
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
