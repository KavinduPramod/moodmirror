/**
 * Dashboard Page
 * Authenticated view with analysis controls
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogOut, CheckCircle, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Logo, Button, Card, AnalysisLoading } from '../components';
import { InsufficientDataCard } from '../components/InsufficientDataCard';
import { useAuthStore } from '../stores/authStore';
import { useAnalysisStore } from '../stores/analysisStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, username, logout, isLoading: authLoading, checkAuth } = useAuthStore();
  const { isAnalyzing, error, insufficientData, modelReady, runAnalysis, checkStatus, clearError } = useAnalysisStore();
  const [analysisLimit, setAnalysisLimit] = useState(100);
  const [analysisStage, setAnalysisStage] = useState<'fetching' | 'analyzing' | 'processing' | 'finalizing'>('fetching');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      checkStatus();
    }
  }, [isAuthenticated, checkStatus]);

  // Simulate analysis stages for better UX
  useEffect(() => {
    if (isAnalyzing) {
      const stages: Array<'fetching' | 'analyzing' | 'processing' | 'finalizing'> = ['fetching', 'analyzing', 'processing', 'finalizing'];
      let currentStageIndex = 0;
      
      const interval = setInterval(() => {
        currentStageIndex = (currentStageIndex + 1) % stages.length;
        setAnalysisStage(stages[currentStageIndex]);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const handleStartAnalysis = async () => {
    clearError();
    const success = await runAnalysis(analysisLimit);
    if (success) {
      navigate('/results');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  // Show insufficient data card if present
  if (insufficientData) {
    return (
      <div className="bg-animated min-h-screen">
        <InsufficientDataCard
          data={insufficientData}
          onBack={() => clearError()}
        />
      </div>
    );
  }

  // Show loading screen during analysis
  if (isAnalyzing) {
    return <AnalysisLoading stage={analysisStage} />;
  }

  // Show error if analysis failed
  if (error && !isAnalyzing) {
    return (
      <div className="bg-animated flex flex-col min-h-screen">
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
          <div className="container-narrow flex justify-between items-center h-16">
            <Logo size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await useAuthStore.getState().logout();
                navigate('/');
              }}
              icon={<LogOut size={16} />}
            >
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <Card className="max-w-md text-center" padding="lg">
            <AlertTriangle size={64} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <Button onClick={handleStartAnalysis}>Try Again</Button>
          </Card>
        </main>
      </div>
    );
  }

  // Fallback waiting screen (model not ready yet)
  return (
    <div className="bg-animated flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
        <div className="container-narrow flex justify-between items-center h-16">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-slate-300">
              <User size={16} />
              <span className="text-sm">u/{username}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              isLoading={authLoading}
              icon={<LogOut size={16} />}
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-16">
        <div className="container-narrow">
          <Card className="max-w-2xl mx-auto text-center" padding="lg">
            {/* Success Icon */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse-glow" />
                <CheckCircle size={64} className="text-green-400 relative" />
              </div>
            </motion.div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Successfully Authenticated!
            </h1>
            <p className="text-lg text-slate-400 mb-6">
              Welcome, <span className="text-purple-400 font-semibold">u/{username}</span>
            </p>

            {/* Status Indicators */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-sm text-green-400">Reddit Connected</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                modelReady 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                {modelReady ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <Loader2 size={16} className="animate-spin text-amber-400" />
                )}
                <span className={`text-sm ${modelReady ? 'text-green-400' : 'text-amber-400'}`}>
                  {modelReady ? 'Model Ready' : 'Loading Model...'}
                </span>
              </div>
            </div>

            {/* Analysis Configuration */}
            <div className="text-left mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Configure Analysis</h3>
              
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Number of posts/comments to analyze:
                </label>
                <div className="flex gap-3">
                  {[50, 100, 200].map((limit) => (
                    <button
                      key={limit}
                      onClick={() => setAnalysisLimit(limit)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        analysisLimit === limit
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {limit}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  More posts = More accurate analysis (takes longer)
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                <p className="text-xs text-blue-300">
                  ℹ️ The model will analyze your recent Reddit posts to detect behavioral patterns and mental health indicators.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                  <p className="text-sm text-red-400 flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    {error}
                  </p>
                </div>
              )}

              <Button 
                onClick={handleStartAnalysis}
                fullWidth 
                disabled={!modelReady || isAnalyzing}
                isLoading={isAnalyzing}
                size="lg"
                icon={<ArrowRight size={20} />}
              >
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-slate-400">
                ⚠️ <span className="text-amber-400 font-medium">Important:</span> This is a research tool, not a medical diagnosis.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
