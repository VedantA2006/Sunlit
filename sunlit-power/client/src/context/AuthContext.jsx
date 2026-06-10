import React, { createContext, useReducer, useEffect } from 'react';
import api, { setAccessToken } from '../api/axios';

const initialState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.user.role,
        isAuthenticated: true,
        isLoading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false
      };
    default:
      return state;
  }
};

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email, password, role) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.post('/auth/login', { email, password, role });
      const { accessToken, user } = response.data;
      
      setAccessToken(accessToken);
      localStorage.setItem('sunlit_user', JSON.stringify(user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
      return { success: true, user };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      setAccessToken('');
      localStorage.removeItem('sunlit_user');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { accessToken, user } = response.data;
      
      setAccessToken(accessToken);
      localStorage.setItem('sunlit_user', JSON.stringify(user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
    } catch (error) {
      setAccessToken('');
      localStorage.removeItem('sunlit_user');
      dispatch({ type: 'LOGOUT' });
    }
  };

  useEffect(() => {
    // Attempt session restore on mount
    const storedUser = localStorage.getItem('sunlit_user');
    if (storedUser) {
      refreshUser().catch(() => {
        // Silently handle — refreshUser already dispatches LOGOUT on failure
      });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    // Intercept manual logouts triggered by axios interceptor on session expiry
    const handleLogoutEvent = () => {
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
