/**
 * Authentication Store
 * Manages user authentication state with Zustand
 */

import { create } from 'zustand';
import { api, endpoints } from '../config/api';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  error: string | null;

  // Actions
  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  clearError: () => void;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: false,
  email: null,
  error: null,

  // Check if user is already authenticated
  checkAuth: () => {
    const token = sessionStorage.getItem('session_token');
    const storedEmail = sessionStorage.getItem('email');
    if (token && storedEmail) {
      set({ isAuthenticated: true, email: storedEmail });
    }
  },

  register: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(endpoints.auth.register, {
        email,
        password,
      });

      const { session_token, email: responseEmail } = response.data;
      sessionStorage.setItem('session_token', session_token);
      sessionStorage.setItem('email', responseEmail);

      set({
        isAuthenticated: true,
        email: responseEmail,
        isLoading: false,
      });

      return true;
    } catch (err) {
      const error = err as ApiError;
      console.error('Register failed:', error);
      set({
        error: error.response?.data?.detail || 'Failed to register',
        isLoading: false,
      });
      return false;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(endpoints.auth.login, {
        email,
        password,
      });

      const { session_token, email: responseEmail } = response.data;

      sessionStorage.setItem('session_token', session_token);
      sessionStorage.setItem('email', responseEmail);

      set({
        isAuthenticated: true,
        email: responseEmail,
        isLoading: false,
      });

      return true;
    } catch (err) {
      const error = err as ApiError;
      console.error('Login failed:', error);
      set({
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false,
      });
      return false;
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post(endpoints.auth.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      sessionStorage.removeItem('session_token');
      sessionStorage.removeItem('email');
      set({
        isAuthenticated: false,
        email: null,
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
