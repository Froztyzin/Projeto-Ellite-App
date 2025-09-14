import React from 'react';
import { FaBrain } from 'react-icons/fa';

interface AssistantFABProps {
  onClick: () => void;
}

const AssistantFAB: React.FC<AssistantFABProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-50 transition-transform transform hover:scale-110"
      aria-label="Abrir Assistente IA"
      title="Assistente IA"
    >
      <FaBrain className="w-8 h-8" />
    </button>
  );
};

export default AssistantFAB;
