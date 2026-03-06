/**
 * Home Page
 * Landing page with Reddit OAuth login
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Brain, Lock, ArrowRight, ChevronDown, Users, Activity, Database } from 'lucide-react';
import { Logo, Button, Card, Footer } from '../components';
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

const steps = [
  {
    step: '01',
    title: 'Connect Your Reddit Account',
    description: 'Sign in securely using Reddit OAuth. We never see your password — Reddit handles authentication directly.',
  },
  {
    step: '02',
    title: 'AI Analyses Your Activity',
    description: 'Our BERT + BiLSTM model scans your recent posts and comments, extracting 8 behavioural signals including sentiment, posting patterns, and community engagement.',
  },
  {
    step: '03',
    title: 'Receive Your Risk Report',
    description: 'View your personalised mental health risk assessment with confidence scores, behavioural insights, and curated support resources.',
  },
];

const stats = [
  { icon: Users, value: '1,500+', label: 'Users in Training Dataset' },
  { icon: Database, value: '35+', label: 'Mental Health Subreddits' },
  { icon: Activity, value: '8', label: 'Behavioural Features Analysed' },
  { icon: Brain, value: 'BERT', label: 'Transformer Model Used' },
];

const faqs = [
  {
    q: 'Is this a medical diagnosis?',
    a: 'No. MoodMirror is a research prototype and not a substitute for professional medical advice. Always consult a qualified mental health professional for accurate assessment and treatment.',
  },
  {
    q: 'Does MoodMirror store my Reddit data?',
    a: 'No. Your posts and comments are fetched in real-time solely for analysis and are never stored on our servers. Once your session ends, all data is discarded.',
  },
  {
    q: 'How accurate is the model?',
    a: 'The model was trained and validated on real Reddit data using BERT + BiLSTM architecture. It reports a confidence score with each result. Accuracy varies and the tool should not be used for clinical decisions.',
  },
  {
    q: 'Who can see my results?',
    a: 'Only you. Results are displayed in your browser session and are not saved or shared with any third party.',
  },
  {
    q: 'What if I need immediate help?',
    a: 'If you are in crisis, please call or text 988 (Suicide & Crisis Lifeline) immediately. You can also visit our Resources page for a full list of support lines.',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { initOAuth, isLoading, error, isAuthenticated, checkAuth, clearError } = useAuthStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/resources" className="hover:text-white transition-colors">Resources</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </nav>
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
                  <feature.icon size={40} className="text-purple-400 mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Stats Banner */}
          <section className="py-10">
            <div className="glass-card p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <stat.icon size={24} className="text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-12 md:py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">How It Works</h2>
              <p className="text-slate-400">Three simple steps to understand your mental well-being</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.15 }}
                >
                  <div className="glass-card p-6 h-full">
                    <span className="text-4xl font-black gradient-text block mb-3">{step.step}</span>
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 -right-4 text-slate-600 text-2xl z-10">→</div>
                  )}
                </motion.div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="py-12 md:py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  className="glass-card overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <button
                    className="w-full flex justify-between items-center p-5 text-left"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-medium text-white pr-4">{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
