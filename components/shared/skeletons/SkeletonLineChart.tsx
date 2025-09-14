import React from 'react';

const SkeletonLineChart: React.FC<{ isPie?: boolean }> = ({ isPie = false }) => {
  return (
    <div className="w-full h-[300px] bg-card rounded-lg animate-pulse flex items-center justify-center">
      <div className="flex items-end justify-between w-full h-full p-4">
        {isPie ? (
            <div className="w-48 h-48 bg-slate-700 rounded-full mx-auto"></div>
        ) : (
            Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="w-8 bg-slate-700 rounded-t-lg"
                    style={{ height: `${20 + Math.random() * 60}%` }}
                ></div>
            ))
        )}
      </div>
    </div>
  );
};

export default SkeletonLineChart;
