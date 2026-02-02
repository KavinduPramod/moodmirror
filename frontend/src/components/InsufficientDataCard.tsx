/**
 * Insufficient Data Card Component
 * Displays information when user doesn't have enough data for analysis
 */

import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, Clock, Target, Phone, MessageCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface InsufficientDataCardProps {
  data: {
    message: string;
    progress?: {
      current_posts?: number;
      required_posts?: number;
      current_days?: number;
      required_days?: number;
      current_stability?: number;
      required_stability?: number;
      percentage?: number;
      posts_needed?: number;
      days_needed?: number;
    };
    requirements: {
      min_posts: number;
      min_days: number;
      min_stability: number;
    };
    guidance: string[];
    resources: Array<{ name: string; contact: string }>;
  };
  onBack: () => void;
}

export const InsufficientDataCard: React.FC<InsufficientDataCardProps> = ({ data, onBack }) => {
  const { progress, requirements, guidance, resources } = data;

  // Calculate overall progress percentage
  const calculateOverallProgress = () => {
    if (!progress) return 0;

    const weights = {
      posts: 0.4,
      days: 0.3,
      stability: 0.3,
    };

    let totalProgress = 0;

    if (progress.current_posts !== undefined && progress.required_posts) {
      totalProgress += (progress.current_posts / progress.required_posts) * weights.posts * 100;
    }

    if (progress.current_days !== undefined && progress.required_days) {
      totalProgress += (progress.current_days / progress.required_days) * weights.days * 100;
    }

    if (progress.current_stability !== undefined && progress.required_stability) {
      totalProgress += (progress.current_stability / progress.required_stability) * weights.stability * 100;
    }

    return Math.min(Math.round(totalProgress), 100);
  };

  const overallProgress = calculateOverallProgress();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card padding="lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
              <AlertCircle className="text-amber-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Insufficient Data for Analysis</h2>
            <p className="text-slate-400">{data.message}</p>
          </div>

          {/* Overall Progress */}
          {progress && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Overall Progress</span>
                <span className="text-sm font-bold text-purple-400">{overallProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Detailed Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Posts Requirement */}
            {progress?.current_posts !== undefined && (
              <Card className="bg-slate-800/50 border border-white/5" padding="md">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Target className="text-blue-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-300 mb-1">Post Count</h3>
                    <div className="text-2xl font-bold text-white mb-1">
                      {progress.current_posts}/{requirements.min_posts}
                    </div>
                    <p className="text-xs text-slate-400">
                      {progress.posts_needed || 0} more needed
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Temporal Coverage */}
            {progress?.current_days !== undefined && (
              <Card className="bg-slate-800/50 border border-white/5" padding="md">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Clock className="text-purple-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-300 mb-1">Time Span</h3>
                    <div className="text-2xl font-bold text-white mb-1">
                      {progress.current_days}/{requirements.min_days} days
                    </div>
                    <p className="text-xs text-slate-400">
                      {progress.days_needed || 0} more needed
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Baseline Stability */}
            {progress?.current_stability !== undefined && (
              <Card className="bg-slate-800/50 border border-white/5" padding="md">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="text-green-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-300 mb-1">Stability</h3>
                    <div className="text-2xl font-bold text-white mb-1">
                      {(progress.current_stability * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-slate-400">
                      Target: {(requirements.min_stability * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Guidance */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-400" />
              What You Can Do
            </h3>
            <ul className="space-y-2">
              {guidance.map((item, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-2 text-slate-300 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Crisis Resources */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
              <Phone size={20} />
              Need Help Now?
            </h3>
            <p className="text-slate-300 text-sm mb-3">
              If you're in crisis, please reach out immediately. You don't have to wait for the analysis.
            </p>
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-red-400" />
                    <span className="text-sm text-slate-300">{resource.name}</span>
                  </div>
                  <span className="text-sm font-mono text-white">{resource.contact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button onClick={onBack} variant="secondary" size="lg">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
