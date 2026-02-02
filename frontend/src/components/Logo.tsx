/**
 * Logo Component
 * Animated MoodMirror brand logo
 */

import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeConfig = {
  sm: { icon: 28, text: 'text-xl', gap: 'gap-2' },
  md: { icon: 40, text: 'text-2xl md:text-3xl', gap: 'gap-3' },
  lg: { icon: 56, text: 'text-4xl md:text-5xl', gap: 'gap-4' },
};

export function Logo({ size = 'md', showText = true }: Readonly<LogoProps>) {
  const config = sizeConfig[size];

  return (
    <motion.div
      className={`flex items-center ${config.gap}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Icon with glow */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-40 animate-pulse-glow" />
        
        {/* Icon */}
        <Brain
          size={config.icon}
          className="text-purple-400 relative z-10"
          strokeWidth={1.5}
        />
      </motion.div>

      {/* Text */}
      {showText && (
        <span className={`font-bold gradient-text ${config.text}`}>
          MoodMirror
        </span>
      )}
    </motion.div>
  );
}
