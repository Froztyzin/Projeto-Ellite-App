import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-lg border border-slate-700 bg-card p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
          <div className="h-7 bg-slate-600 rounded w-1/2"></div>
        </div>
        <div className="h-12 w-12 rounded-full bg-slate-700"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
