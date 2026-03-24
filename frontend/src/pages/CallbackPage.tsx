/**
 * Callback Page
 * Legacy route placeholder after OAuth removal
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { Logo, Button, Card } from '../components';

export function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/'), 1200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="bg-animated flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
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
            <XCircle size={64} className="text-amber-400" />
          </motion.div>
          <p className="text-white text-xl font-semibold">OAuth Disabled</p>
          <p className="text-slate-400 text-sm">This route is no longer used. Redirecting to home...</p>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </motion.div>
      </Card>
    </div>
  );
}
