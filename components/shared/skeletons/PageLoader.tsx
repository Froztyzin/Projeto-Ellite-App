import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const PageLoader: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-96">
      <div className="text-center text-slate-400">
        <FaSpinner className="animate-spin text-4xl mx-auto mb-4 text-primary-500" />
        <p>Carregando página...</p>
      </div>
    </div>
  );
};

export default PageLoader;
