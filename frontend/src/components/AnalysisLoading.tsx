/**
 * Analysis Loading Component
 * Shows progress with rotating mental health tips and facts
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, Activity, Lightbulb, Shield, Users, Clock, TrendingUp } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

const MENTAL_HEALTH_FACTS = [
  {
    icon: Brain,
    title: "Understanding Depression",
    content: "Depression is more than just feeling sad. It's a medical condition that affects how you think, feel, and handle daily activities.",
    color: "purple"
  },
  {
    icon: Heart,
    title: "Self-Care Matters",
    content: "Regular exercise, adequate sleep (7-9 hours), and healthy eating can significantly improve mental well-being.",
    color: "red"
  },
  {
    icon: Activity,
    title: "Early Detection Saves Lives",
    content: "Recognizing early warning signs of mental health issues can lead to timely intervention and better outcomes.",
    color: "blue"
  },
  {
    icon: Users,
    title: "You're Not Alone",
    content: "1 in 5 adults experience mental illness each year. Seeking help is a sign of strength, not weakness.",
    color: "green"
  },
  {
    icon: Shield,
    title: "Mental Health Is Health",
    content: "Your mental health is just as important as your physical health. Both deserve attention and care.",
    color: "amber"
  },
  {
    icon: Clock,
    title: "Sleep & Mental Health",
    content: "Poor sleep can worsen anxiety and depression. Consistent sleep schedules help regulate mood and emotions.",
    color: "indigo"
  },
  {
    icon: Lightbulb,
    title: "Cognitive Behavioral Patterns",
    content: "Our thoughts influence our feelings and behaviors. Recognizing negative thought patterns is the first step to change.",
    color: "yellow"
  },
  {
    icon: TrendingUp,
    title: "Recovery Is Possible",
    content: "Most people with mental health conditions can improve significantly with proper treatment and support.",
    color: "teal"
  }
];

interface AnalysisLoadingProps {
  stage: 'fetching' | 'analyzing' | 'processing' | 'finalizing';
  onCancel?: () => void;
}

export const AnalysisLoading: React.FC<AnalysisLoadingProps> = ({ stage, onCancel }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const stageInfo = {
    fetching: { text: 'Fetching your Reddit activity...', progress: 25 },
    analyzing: { text: 'Analyzing behavioral patterns...', progress: 50 },
    processing: { text: 'Processing with AI model...', progress: 75 },
    finalizing: { text: 'Generating personalized insights...', progress: 95 }
  };

  // Rotate facts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % MENTAL_HEALTH_FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animate progress
  useEffect(() => {
    setProgress(stageInfo[stage].progress);
  }, [stage]);

  const currentFact = MENTAL_HEALTH_FACTS[currentFactIndex];
  const Icon = currentFact.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-animated">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Main Loading Card */}
        <Card padding="lg" className="mb-6">
          {/* Animated Brain Icon */}
          <div className="flex justify-center mb-8">
            <motion.div
              className="relative"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl" />
              <Brain size={64} className="text-purple-400 relative" />
            </motion.div>
          </div>

          {/* Stage Text */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Analyzing Your Mental Health Indicators
          </h2>
          <p className="text-slate-400 text-center mb-8">
            {stageInfo[stage].text}
          </p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Progress</span>
              <span className="text-sm font-bold text-purple-400">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-linear-to-r from-purple-500 via-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="flex justify-between items-center mb-6">
            {(['fetching', 'analyzing', 'processing', 'finalizing'] as const).map((s, idx) => (
              <div key={s} className="flex flex-col items-center">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    stageInfo[s].progress <= progress
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                  animate={s === stage ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {stageInfo[s].progress <= progress ? '✓' : idx + 1}
                </motion.div>
                <span className="text-xs text-slate-400 text-center hidden sm:block">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Mental Health Education Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFactIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card padding="lg" className="bg-slate-800/50">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-${currentFact.color}-500/10`}>
                  <Icon className={`text-${currentFact.color}-400`} size={24} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-${currentFact.color}-400 mb-2`}>
                    {currentFact.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {currentFact.content}
                  </p>
                </div>
              </div>

              {/* Fact Progress Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {MENTAL_HEALTH_FACTS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentFactIndex ? 'bg-purple-400' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Additional Info */}
        <p className="text-center text-slate-500 text-sm mt-6">
          This analysis typically takes 15-30 seconds. We're analyzing your posting patterns,
          sentiment, and behavioral indicators to provide personalized insights.
        </p>

        {onCancel && (
          <div className="flex justify-center mt-6">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
