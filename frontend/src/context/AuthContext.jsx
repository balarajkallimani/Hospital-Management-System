import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the Context
const AuthContext = createContext(null);

// Configure the base URL for Axios globally
axios.defaults.baseURL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in when the app starts
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Configure Axios to automatically send the token in the Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch current user details from backend
        const response = await axios.get('/api/auth/me');
        
        if (response.data && response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // If response isn't successful, clear stale token
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data && response.data.success) {
        const { token, user: userData } = response.data;
        
        // 1. Save token in localStorage
        localStorage.setItem('token', token);
        
        // 2. Set default Authorization header for future Axios requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // 3. Update global states
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message: errorMsg };
    }
  };

  // Register handler
  const register = async (name, email, password, role) => {
    try {
      const response = await axios.post('/api/auth/register', { name, email, password, role });
      
      if (response.data && response.data.success) {
        const { token, user: userData } = response.data;
        
        // 1. Save token in localStorage
        localStorage.setItem('token', token);
        
        // 2. Set default Authorization header for Axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // 3. Update global states
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message: errorMsg };
    }
  };

  // Logout handler
  const logout = () => {
    // 1. Remove token from storage
    localStorage.removeItem('token');
    
    // 2. Delete the common Axios authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // 3. Reset states
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
