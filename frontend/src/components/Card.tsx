/**
 * Card Component
 * Glassmorphism card with animation
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className = '',
  hover = false,
  delay = 0,
  padding = 'md',
}: Readonly<CardProps>) {
  return (
    <motion.div
      className={[
        'glass-card',
        paddingClasses[padding],
        hover && 'glass-card-hover cursor-pointer',
        className,
      ].filter(Boolean).join(' ')}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
}
