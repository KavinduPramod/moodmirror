/**
 * OAuth Callback Page
 * Handles Reddit OAuth redirect
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Logo, Button, Card } from '../components';
import { useAuthStore } from '../stores/authStore';

type Status = 'loading' | 'success' | 'error';

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback, error } = useAuthStore();
  const [status, setStatus] = useState<Status>('loading');
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing (React strict mode issue)
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    async function processCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        return;
      }

      if (!code || !state) {
        setStatus('error');
        return;
      }

      const success = await handleCallback(code, state);

      if (success) {
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setStatus('error');
      }
    }

    processCallback();
  }, [searchParams, handleCallback, navigate]);

  return (
    <div className="bg-animated flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>

        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex justify-center">
              <Loader2 size={48} className="text-purple-400 animate-spin" />
            </div>
            <p className="text-slate-300 text-lg">Authenticating with Reddit...</p>
            <p className="text-slate-500 text-sm">Please wait while we verify your account</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                <CheckCircle size={64} className="text-green-400 relative" />
              </div>
            </motion.div>
            <p className="text-white text-xl font-semibold">Authentication Successful!</p>
            <p className="text-slate-400">Redirecting to dashboard...</p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <XCircle size={64} className="text-red-400" />
            </motion.div>
            <p className="text-white text-xl font-semibold">Authentication Failed</p>
            <p className="text-slate-400 text-sm">
              {error || 'Something went wrong during authentication'}
            </p>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </motion.div>
        )}
      </Card>
    </div>
  );
}
