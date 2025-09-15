import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  // Fix: Updated the type of `icon` to specify that it can accept a className prop.
  // This resolves the TypeScript error with React.cloneElement.
  icon: React.ReactElement<{ className?: string }>;
  change?: string;
  changeType?: 'positive' | 'negative';
}

const Card: React.FC<CardProps> = ({ title, value, icon, change, changeType }) => {
  const changeColor = changeType === 'positive' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="rounded-lg border border-slate-700 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-900 text-primary-400">
          {React.cloneElement(icon, { className: 'h-6 w-6' })}
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`${changeColor} font-semibold`}>{change}</span>
          <span className="ml-2 text-slate-400">em relação ao mês passado</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(Card);