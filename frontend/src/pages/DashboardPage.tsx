/**
 * Dashboard Page
 * Authenticated view showing successful login
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogOut, CheckCircle, ArrowRight } from 'lucide-react';
import { Logo, Button, Card } from '../components';
import { useAuthStore } from '../stores/authStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, username, logout, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-animated flex flex-col">
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
              isLoading={isLoading}
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
          {/* Success Card */}
          <Card className="max-w-2xl mx-auto text-center" padding="lg">
            {/* Success Icon */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse-glow" />
                <CheckCircle size={80} className="text-green-400 relative" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Successfully Authenticated!
            </motion.h1>

            {/* Username */}
            <motion.p
              className="text-lg text-slate-400 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Welcome, <span className="text-purple-400 font-semibold">u/{username}</span>
            </motion.p>

            <motion.p
              className="text-slate-500 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              You're connected to Reddit and ready to analyze your activity
            </motion.p>

            {/* Status Badges */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400">Reddit Connected</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-sm text-purple-400">Session Active</span>
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              className="glass-card p-6 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Next Steps</h3>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-medium">1.</span>
                  <span>Review the consent form for analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-medium">2.</span>
                  <span>Fetch and analyze your Reddit activity</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-medium">3.</span>
                  <span>Receive your mental health insights</span>
                </li>
              </ul>

              <Button className="mt-6" fullWidth disabled>
                Start Analysis
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Analysis feature coming soon
              </p>
            </motion.div>
          </Card>

          {/* Help Section */}
          <motion.div
            className="glass-card p-4 mt-8 max-w-2xl mx-auto text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-slate-400 text-sm">
              🆘 Need help? Contact{' '}
              <a
                href="tel:988"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                988 Suicide & Crisis Lifeline
              </a>
              {' '}(available 24/7)
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
