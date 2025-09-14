import React from 'react';

interface SkeletonTableProps {
  rows?: number;
  headers: string[];
}

const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, headers }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-900/50">
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-slate-700 animate-pulse">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {headers.map((_, j) => (
                <td key={j} className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-slate-700 rounded"></div>
                  {j === 0 && <div className="h-3 bg-slate-700 rounded mt-2 w-3/4"></div>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkeletonTable;
