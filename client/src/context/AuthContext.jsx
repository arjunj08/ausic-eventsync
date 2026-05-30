import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure Axios globally
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true; // Required to send cookies

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [landingRole, setLandingRole] = useState('member'); // 'member' or 'admin' for role selector

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      setTeam(res.data.team);
    } catch (err) {
      // console.log('Not authenticated');
      setUser(null);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.twoFactorRequired) {
        return res.data;
      }
      await fetchCurrentUser(); // Refresh full profile with team details
      return res.data;
    } catch (err) {
      throw err.response?.data?.error || 'Login failed. Please try again.';
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, role });
      await fetchCurrentUser(); // Refresh full profile
      return res.data;
    } catch (err) {
      throw err.response?.data?.error || 'Registration failed. Please try again.';
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      setTeam(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      team,
      loading,
      landingRole,
      setLandingRole,
      login,
      register,
      logout,
      refreshUser: fetchCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
