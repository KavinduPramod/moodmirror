/**
 * 404 Not Found Page
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Logo, Button, Footer } from '../components';

export function NotFoundPage() {
  return (
    <div className="bg-animated flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
        <div className="container-narrow flex justify-between items-center h-16">
          <Logo size="sm" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-16">
        <motion.div
          className="text-center px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-8 inline-block">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl" />
            <p className="text-[120px] font-black gradient-text leading-none relative">404</p>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto">
            The page you were looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button icon={<Home size={18} />}>Go to Home</Button>
            </Link>
            <Button variant="secondary" onClick={() => window.history.back()} icon={<ArrowLeft size={18} />}>
              Go Back
            </Button>
          </div>

          <div className="mt-12 text-sm text-slate-500 space-x-4">
            <Link to="/about" className="hover:text-purple-400 transition-colors">About</Link>
            <Link to="/resources" className="hover:text-purple-400 transition-colors">Resources</Link>
            <Link to="/contact" className="hover:text-purple-400 transition-colors">Contact</Link>
            <Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy</Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
