import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

const extractToken = (data) => {
  // Log the full response so we can see exactly what the backend returns
  console.log('[MedPilot] Full login response data:', JSON.stringify(data, null, 2));
  return (
    data?.token ||
    data?.accessToken ||
    data?.access_token ||
    data?.authToken ||
    data?.jwt ||
    data?.data?.token ||
    data?.data?.accessToken ||
    data?.result?.token ||
    null
  );
};

const extractUser = (data) =>
  data?.user ||
  data?.data?.user ||
  data?.data ||
  data?.profile ||
  data?.result?.user ||
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
          if (storedUser) setUser(JSON.parse(storedUser));
          const res = await authAPI.getProfile();
          const freshUser = extractUser(res.data) || res.data;
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
    const data = res.data;

    const token = extractToken(data);
    const u = extractUser(data);

    if (!token) {
      throw new Error(
        'Login succeeded but no token found. Check browser console for response details.'
      );
    }

    localStorage.setItem('medpilot_token', token);
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
