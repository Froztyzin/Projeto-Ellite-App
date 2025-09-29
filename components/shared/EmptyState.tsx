import React from 'react';
import { FaRegFolderOpen } from 'react-icons/fa';

interface EmptyStateProps {
  icon?: React.ReactElement<{ className?: string }>;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FaRegFolderOpen />,
  title,
  message,
  actionText,
  onAction,
}) => {
  return (
    <div className="text-center py-10 px-6 bg-card">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-primary-500">
        {React.cloneElement(icon, { className: 'h-6 w-6' })}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
      {actionText && onAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;