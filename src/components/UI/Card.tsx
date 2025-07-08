import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false, onClick }) => {
  const baseClasses = 'bg-dark-800 rounded-xl border border-dark-700 shadow-lg';
  const hoverClasses = hover ? 'hover:bg-dark-750 hover:border-dark-600 transition-all duration-200 cursor-pointer' : '';
  
  const cardClasses = `${baseClasses} ${hoverClasses} ${className}`;

  const CardComponent = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 },
    onClick
  } : {};

  return (
    <CardComponent className={cardClasses} {...motionProps}>
      {children}
    </CardComponent>
  );
};

export default Card;