import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserInfo } from '../services/rocketchat';  // NEW: Import for refetching

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const userData = localStorage.getItem('user');

    if (token && userId && userData) {
      setAuthToken(token);
      setUserId(userId);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    const { authToken, userId, user } = authData;
    setAuthToken(authToken);
    setUserId(userId);
    setUser(user);
    
    // Store in localStorage
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userId', userId);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setAuthToken(null);
    setUserId(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  };

  // NEW: Refetch and update user data (e.g., after status change)
  const updateUser = async () => {
    if (!authToken || !userId) return { success: false, error: 'Not authenticated' };

    try {
      const result = await getUserInfo(authToken, userId);
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        return { success: true };
      } else {
        console.error('Failed to update user:', result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Update user error:', err);
      return { success: false, error: 'Failed to update user data' };
    }
  };

  const value = {
    user,
    authToken,
    userId,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!authToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};