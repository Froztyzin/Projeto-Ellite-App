import React, { useEffect, useState } from 'react';
import { ToastMessage, ToastType } from '../../contexts/ToastContext';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const toastConfig = {
  duration: 5000,
  types: {
    success: {
      icon: <FaCheckCircle />,
      barClass: 'bg-green-500',
    },
    error: {
      icon: <FaExclamationCircle />,
      barClass: 'bg-red-500',
    },
    info: {
      icon: <FaInfoCircle />,
      barClass: 'bg-blue-500',
    },
  },
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [exiting, setExiting] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300); // Allow time for exit animation
    }, toastConfig.duration);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleRemove = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };
  
  const config = toastConfig.types[toast.type];

  return (
    <div
      className={`relative flex items-center w-full p-4 text-slate-200 bg-slate-700 rounded-lg shadow-lg overflow-hidden border-l-4 border-transparent ${
        config.barClass.replace('bg-', 'border-')
      } transition-all duration-300 ease-in-out ${
        exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      role="alert"
    >
      <div className={`text-xl ${config.barClass.replace('bg-', 'text-')}`}>
        {config.icon}
      </div>
      <div className="ml-3 text-sm font-normal">{toast.message}</div>
      <button
        onClick={handleRemove}
        className="ml-auto -mx-1.5 -my-1.5 bg-slate-700 text-slate-400 hover:text-slate-100 hover:bg-slate-600 rounded-lg focus:ring-2 focus:ring-slate-500 p-1.5 inline-flex h-8 w-8"
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <FaTimes />
      </button>
      <div
        className={`absolute bottom-0 left-0 h-1 ${config.barClass}`}
        style={{ animation: `progress ${toastConfig.duration}ms linear forwards` }}
      />
      {/* Fix: Replaced non-standard `style jsx` with a standard `style` tag to inject keyframes.
          This is compatible with standard React/TypeScript setups without Next.js. */}
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
