/**
 * Auth Page
 * Dedicated sign in/register page
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Logo, Button, Card, Footer } from '../components';
import { useAuthStore } from '../stores/authStore';

export function AuthPage() {
  const navigate = useNavigate();
  const { register, login, isLoading, error, isAuthenticated, checkAuth, clearError } = useAuthStore();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleAuth = async () => {
    clearError();

    if (!email.trim() || !password.trim()) {
      return;
    }

    const success = authMode === 'register'
      ? await register(email, password)
      : await login(email, password);

    if (success) {
      setPassword('');
      navigate('/');
    }
  };

  return (
    <div className="bg-animated min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
        <div className="container-narrow flex justify-between items-center h-16">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/resources" className="hover:text-white transition-colors">Resources</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </nav>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
        </div>
      </header>

      <main className="flex-1 pt-24 pb-16 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md" padding="lg">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold text-white">Welcome</h1>
              <p className="text-sm text-slate-400 mt-1">Sign in or create an account to continue</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                  authMode === 'signin' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
                onClick={() => {
                  clearError();
                  setAuthMode('signin');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                  authMode === 'register' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
                onClick={() => {
                  clearError();
                  setAuthMode('register');
                }}
              >
                Register
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password (min 8 characters)"
                className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button onClick={handleAuth} isLoading={isLoading} fullWidth>
              {authMode === 'register' ? 'Create Account' : 'Sign In'}
            </Button>
          </motion.div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
