import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({ children, className = '', hover = false }: CardProps) => {
  const baseClasses = 'rounded-3xl border-2 border-white/20 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl shadow-lg';

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)' } : {}}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
};
