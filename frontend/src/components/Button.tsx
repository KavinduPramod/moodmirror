/**
 * Button Component
 * Animated button with variants and loading state
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const variantClasses = {
  primary: 'bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-purple-400 hover:shadow-xl hover:shadow-purple-500/30',
  secondary: 'bg-transparent text-white font-medium border border-white/20 hover:border-purple-400/60 hover:bg-purple-500/10',
  ghost: 'bg-transparent text-slate-300 font-medium hover:text-white hover:bg-white/5',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
}: Readonly<ButtonProps>) {
  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 size={18} className="animate-spin" />;
    }
    if (icon) {
      return <span className="shrink-0">{icon}</span>;
    }
    return null;
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-xl',
        'transition-all duration-200 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || isLoading}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
    >
      {renderIcon()}
      <span>{children}</span>
    </motion.button>
  );
}
