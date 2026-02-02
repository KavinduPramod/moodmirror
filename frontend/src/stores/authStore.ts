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
  username: string | null;
  error: string | null;

  // Actions
  initOAuth: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<boolean>;
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
  username: null,
  error: null,

  // Check if user is already authenticated
  checkAuth: () => {
    const token = sessionStorage.getItem('session_token');
    const storedUsername = sessionStorage.getItem('username');
    if (token && storedUsername) {
      set({ isAuthenticated: true, username: storedUsername });
    }
  },

  // Initiate Reddit OAuth flow
  initOAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(endpoints.auth.init, {
        redirect_uri: `${globalThis.location.origin}/auth/callback`,
      });

      const { auth_url, state } = response.data;

      // Store state for CSRF verification
      sessionStorage.setItem('oauth_state', state);

      // Redirect to Reddit
      globalThis.location.href = auth_url;
    } catch (err) {
      const error = err as ApiError;
      console.error('OAuth init failed:', error);
      set({
        error: error.response?.data?.detail || 'Failed to start authentication',
        isLoading: false,
      });
    }
  },

  // Handle OAuth callback
  handleCallback: async (code: string, state: string) => {
    set({ isLoading: true, error: null });
    try {
      // Verify state matches
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('State mismatch - possible CSRF attack');
      }

      // Exchange code for session token
      const response = await api.post(endpoints.auth.callback, {
        code,
        state,
      });

      const { session_token, username: responseUsername } = response.data;

      // Store session
      sessionStorage.setItem('session_token', session_token);
      sessionStorage.setItem('username', responseUsername);
      sessionStorage.removeItem('oauth_state');

      set({
        isAuthenticated: true,
        username: responseUsername,
        isLoading: false,
      });

      return true;
    } catch (err) {
      const error = err as ApiError & Error;
      console.error('OAuth callback failed:', error);
      set({
        error: error.response?.data?.detail || error.message || 'Authentication failed',
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
      sessionStorage.removeItem('username');
      set({
        isAuthenticated: false,
        username: null,
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
