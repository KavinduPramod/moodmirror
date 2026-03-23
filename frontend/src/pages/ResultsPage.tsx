/**
 * Results Page
 * Displays analysis results with visualizations
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  LogOut,
  Activity,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { Logo, Button, Card } from '../components';
import { useAuthStore } from '../stores/authStore';
import { useAnalysisStore } from '../stores/analysisStore';

export function ResultsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, username, logout, isLoading, checkAuth } = useAuthStore();
  const { result, clearResult } = useAnalysisStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Allow viewing results if:
    // 1. User is authenticated (Reddit), OR
    // 2. User has a result (manual upload)
    // Otherwise, redirect to home
    if (!isAuthenticated && !result) {
      navigate('/');
    }
  }, [isAuthenticated, result, navigate]);

  useEffect(() => {
    // If user is authenticated but has no result, redirect to dashboard
    if (isAuthenticated && !result) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, result, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNewAnalysis = () => {
    clearResult();
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/manual-upload');
    }
  };

  if (!result) {
    return null;
  }

  const isElevatedRisk = result.risk_level === 'elevated';
  const riskColor = isElevatedRisk ? 'red' : 'green';
  const RiskIcon = isElevatedRisk ? AlertCircle : CheckCircle;

  return (
    <div className="bg-animated flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
        <div className="container-narrow flex justify-between items-center h-16">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-slate-300">
                  <User size={16} />
                  <span className="text-sm">u/{username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={isLoading}
                  icon={<LogOut size={16} />}
                >
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/manual-upload')}
                icon={<ArrowLeft size={16} />}
              >
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-16">
        <div className="container-narrow">
          {/* Back Button */}
          <Button variant="ghost" size="sm" onClick={handleNewAnalysis} className="mb-6">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>

          {/* Risk Assessment Card */}
          <Card className="max-w-4xl mx-auto mb-8" padding="lg">
            <div className="text-center mb-8">
              <motion.div
                className="flex justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="relative">
                  <div className={`absolute inset-0 bg-${riskColor}-500/20 rounded-full blur-2xl animate-pulse-glow`} />
                  <RiskIcon size={80} className={`text-${riskColor}-400 relative`} />
                </div>
              </motion.div>

              <h1 className="text-3xl font-bold text-white mb-2">Analysis Complete</h1>
              <p className="text-slate-400 mb-6">
                Based on your recent Reddit activity (last {result.stats.total_comments + result.stats.total_submissions} posts/comments)
              </p>

              {/* Risk Level Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 border border-white/10 mb-6">
                <span className="text-slate-400">Risk Level:</span>
                <span className={`text-xl font-bold text-${riskColor}-400 capitalize`}>
                  {result.risk_level}
                </span>
              </div>

              {/* Confidence */}
              <p className="text-slate-500 text-sm">
                Model Confidence: <span className="text-white font-semibold">{result.confidence}%</span>
              </p>
            </div>

            {/* Probabilities */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-slate-400 mb-2">Low Risk</p>
                <p className="text-2xl font-bold text-green-400">{result.probabilities.low_risk}%</p>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.probabilities.low_risk}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-slate-400 mb-2">Elevated Risk</p>
                <p className="text-2xl font-bold text-red-400">{result.probabilities.elevated_risk}%</p>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-red-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.probabilities.elevated_risk}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Important Disclaimer */}
            <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5">
              <p className="text-amber-400 text-sm">
                ⚠️ <strong>Important:</strong> This is a research tool and not a medical diagnosis. 
                Always consult a mental health professional for accurate assessment and support.
              </p>
            </div>
          </Card>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Behavioral Features */}
            {result.stats.behavioral_features && (
              <Card padding="lg">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-purple-400" />
                  Behavioral Indicators
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Posting Frequency:</span>
                    <span className="text-white font-semibold">
                      {result.stats.behavioral_features.posting_frequency?.toFixed(2)} posts/day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Late Night Activity:</span>
                    <span className={[
                      'font-semibold',
                      result.stats.behavioral_features.late_night_ratio > 0.5 ? 'text-red-400' :
                      result.stats.behavioral_features.late_night_ratio > 0.3 ? 'text-amber-400' :
                      'text-green-400'
                    ].join(' ')}>
                      {(result.stats.behavioral_features.late_night_ratio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Sentiment:</span>
                    <span className={[
                      'font-semibold',
                      result.stats.behavioral_features.avg_sentiment < -0.3 ? 'text-red-400' :
                      result.stats.behavioral_features.avg_sentiment < 0 ? 'text-amber-400' :
                      'text-green-400'
                    ].join(' ')}>
                      {result.stats.behavioral_features.avg_sentiment?.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Negative Posts:</span>
                    <span className={[
                      'font-semibold',
                      result.stats.behavioral_features.negative_post_ratio > 0.5 ? 'text-red-400' :
                      result.stats.behavioral_features.negative_post_ratio > 0.3 ? 'text-amber-400' :
                      'text-green-400'
                    ].join(' ')}>
                      {(result.stats.behavioral_features.negative_post_ratio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mental Health Focus:</span>
                    <span className="text-white font-semibold">
                      {(result.stats.behavioral_features.mental_health_participation * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subreddit Diversity:</span>
                    <span className="text-white font-semibold">
                      {result.stats.behavioral_features.unique_subreddits} communities
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Feature Alerts */}
            {result.stats.feature_analysis?.alerts && result.stats.feature_analysis.alerts.length > 0 && (
              <Card padding="lg" className="border-amber-500/30 bg-amber-500/5">
                <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Behavioral Alerts
                </h3>
                <ul className="space-y-2">
                  {result.stats.feature_analysis.alerts.map((alert: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-amber-300 text-sm">
                      <span className="mt-1">⚠️</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Account Statistics */}
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={20} className="text-purple-400" />
                Account Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Comments
                  </span>
                  <span className="text-white font-semibold">{result.stats.total_comments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <FileText size={16} />
                    Posts
                  </span>
                  <span className="text-white font-semibold">{result.stats.total_submissions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Post Karma
                  </span>
                  <span className="text-white font-semibold">{result.account_info.karma.post}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Comment Karma
                  </span>
                  <span className="text-white font-semibold">{result.account_info.karma.comment}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Calendar size={16} />
                    Account Age
                  </span>
                  <span className="text-white font-semibold">
                    {new Date(result.account_info.account_created).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Recommendations */}
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-purple-400" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-2 text-slate-300 text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{rec}</span>
                  </motion.li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Personalized Insights */}
          {result.stats.personalized_insights && result.stats.personalized_insights.length > 0 && (
            <Card className="max-w-4xl mx-auto mb-8" padding="lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={20} className="text-purple-400" />
                Personalized Behavioral Insights
              </h3>
              <div className="space-y-3">
                {result.stats.personalized_insights.map((insight: string, index: number) => (
                  <motion.div
                    key={index}
                    className="p-3 rounded-lg bg-slate-800/50 border border-white/5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Crisis Resources */}
          {isElevatedRisk && (
            <Card className="max-w-4xl mx-auto border-red-500/30 bg-red-500/5" padding="lg">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Immediate Support Resources</h3>
              <div className="space-y-3">
                <a
                  href="tel:988"
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <p className="text-white font-semibold">988 Suicide & Crisis Lifeline</p>
                    <p className="text-slate-400 text-sm">24/7 support via phone or chat</p>
                  </div>
                  <ExternalLink size={18} className="text-slate-400" />
                </a>
                <a
                  href="https://www.crisistextline.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <p className="text-white font-semibold">Crisis Text Line</p>
                    <p className="text-slate-400 text-sm">Text HOME to 741741</p>
                  </div>
                  <ExternalLink size={18} className="text-slate-400" />
                </a>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="max-w-4xl mx-auto mt-8 flex gap-4">
            <Button onClick={handleNewAnalysis} fullWidth>
              Run New Analysis
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
