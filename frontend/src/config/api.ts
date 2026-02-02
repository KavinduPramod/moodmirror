/**
 * API Configuration
 * Handles backend communication
 */

import axios from 'axios';

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with defaults
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-logout on 401 - let the component handle it
    // if (error.response?.status === 401) {
    //   sessionStorage.removeItem('session_token');
    //   globalThis.location.href = '/';
    // }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  health: '/health',
  config: '/config',
  auth: {
    init: '/auth/reddit/init',
    callback: '/auth/reddit/callback',
    logout: '/auth/logout',
  },
  analysis: {
    analyze: '/analysis/analyze',
    status: '/analysis/status',
  },
};
