import React from 'react';

/**
 * A simple Card component. This file was previously empty, which can cause
 * unexpected build errors. It is now a valid component.
 */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={`bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm ${className || ''}`}>
      {children}
    </div>
  );
};

export default Card;
