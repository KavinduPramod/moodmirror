/**
 * Analysis Store
 * Manages analysis state and operations
 */

import { create } from 'zustand';
import { api, endpoints } from '../config/api';

interface AnalysisResult {
  username: string;
  risk_level: string;
  confidence: number;
  probabilities: {
    low_risk: number;
    elevated_risk: number;
  };
  account_info: {
    account_created: string;
    karma: {
      post: number;
      comment: number;
    };
  };
  stats: {
    total_comments: number;
    total_submissions: number;
    total_text_length: number;
  };
  recommendations: string[];
  timestamp: string;
}

interface AnalysisState {
  // State
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
  insufficientData: Record<string, unknown> | null;
  modelReady: boolean;

  // Actions
  runAnalysis: (limit?: number) => Promise<boolean>;
  uploadData: (file: File) => Promise<boolean>;
  checkStatus: () => Promise<void>;
  clearResult: () => void;
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

export const useAnalysisStore = create<AnalysisState>((set) => ({
  // Initial state
  isAnalyzing: false,
  result: null,
  error: null,
  insufficientData: null,
  modelReady: false,

  // Check if model is ready
  checkStatus: async () => {
    try {
      const response = await api.get(endpoints.analysis.status);
      set({ modelReady: response.data.model_ready });
    } catch (err) {
      const error = err as ApiError;
      console.error('Status check failed:', error);
      set({ modelReady: false });
    }
  },

  // Run analysis
  runAnalysis: async (limit = 100) => {
    set({ isAnalyzing: true, error: null, insufficientData: null });
    try {
      const response = await api.post(endpoints.analysis.analyze, {
        limit,
      });

      set({
        result: response.data,
        isAnalyzing: false,
        error: null,
        insufficientData: null,
      });

      return true;
    } catch (err) {
      const error = err as ApiError;
      console.error('Analysis failed:', error);
      
      // Check if it's an insufficient data error
      const errorDetail = error.response?.data?.detail as Record<string, unknown> | undefined;
      if (errorDetail && typeof errorDetail === 'object' && errorDetail.error === 'insufficient_data') {
        set({
          insufficientData: errorDetail,
          isAnalyzing: false,
          error: null,
        });
      } else {
        set({
          error: typeof errorDetail === 'string' ? errorDetail : (error.message || 'Analysis failed'),
          isAnalyzing: false,
          insufficientData: null,
        });
      }
      return false;
    }
  },

  // Upload and analyze data
  uploadData: async (file: File) => {
    set({ isAnalyzing: true, error: null, insufficientData: null });
    try {
      // Parse JSON file
      const fileContent = await file.text();
      const uploadedData = JSON.parse(fileContent);

      // Send to backend for analysis
      const response = await api.post(endpoints.analysis.analyzeUpload, uploadedData);

      set({
        result: response.data,
        isAnalyzing: false,
        error: null,
        insufficientData: null,
      });

      return true;
    } catch (err) {
      const error = err as ApiError;
      console.error('Upload analysis failed:', error);
      
      // Handle different error types
      let errorMessage = 'Upload analysis failed';
      if (error instanceof SyntaxError) {
        errorMessage = 'Invalid JSON file format';
      } else {
        const errorDetail = error.response?.data?.detail as Record<string, unknown> | string | undefined;

        if (errorDetail && typeof errorDetail === 'object' && errorDetail.error === 'insufficient_data') {
          set({
            insufficientData: errorDetail,
            isAnalyzing: false,
            error: null,
          });
          return false;
        }

        errorMessage = typeof errorDetail === 'string' ? errorDetail : (error.message || errorMessage);
      }

      set({
        error: errorMessage,
        isAnalyzing: false,
        insufficientData: null,
      });
      return false;
    }
  },

  // Clear result
  clearResult: () => {
    set({ result: null, error: null, insufficientData: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null, insufficientData: null });
  },
}));
