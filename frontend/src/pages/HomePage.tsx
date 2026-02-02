/**
 * Home Page
 * Landing page with Reddit OAuth login
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Brain, Lock, ArrowRight } from 'lucide-react';
import { Logo, Button, Card } from '../components';
import { useAuthStore } from '../stores/authStore';

// Reddit SVG icon
function RedditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced BERT + BiLSTM model trained on mental health patterns',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'No data stored. Analysis happens in real-time and is immediately deleted',
  },
  {
    icon: Lock,
    title: 'Secure OAuth',
    description: 'Reddit authorization with temporary access. We never see your password',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { initOAuth, isLoading, error, isAuthenticated, checkAuth, clearError } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    clearError();
    initOAuth();
  };

  return (
    <div className="bg-animated flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
        <div className="container-narrow flex justify-between items-center h-16">
          <Logo size="sm" />
          <Button variant="secondary" size="sm" onClick={handleLogin} isLoading={isLoading}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-16">
        <div className="container-narrow">
          {/* Hero Section */}
          <section className="text-center py-12 md:py-20">
            {/* Logo */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Logo size="lg" />
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="text-lg md:text-xl lg:text-2xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Understand your mental well-being through AI-powered analysis of your Reddit activity
            </motion.p>

            {/* Disclaimer */}
            <motion.div
              className="glass-card p-4 mb-8 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-sm text-slate-400">
                ⚠️ <span className="text-amber-400 font-medium">Important:</span> This is a research tool, not a medical diagnosis. 
                Always consult a mental health professional for concerns.
              </p>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="glass-card p-4 mb-6 border-red-500/30 max-w-md mx-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* CTA Button */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                onClick={handleLogin}
                isLoading={isLoading}
                size="lg"
                icon={<RedditIcon />}
              >
                Connect with Reddit
                <ArrowRight size={18} className="ml-1" />
              </Button>
            </motion.div>
          </section>

          {/* Features Section */}
          <section className="py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={feature.title} hover delay={0.4 + index * 0.1}>
                  <feature.icon
                    size={40}
                    className="text-purple-400 mb-4"
                    strokeWidth={1.5}
                  />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="container-narrow text-center">
          <p className="text-slate-500 text-sm">
            © 2026 MoodMirror. Built for mental health awareness.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            If you're in crisis, please contact{' '}
            <a
              href="tel:988"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              988 Suicide & Crisis Lifeline
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
