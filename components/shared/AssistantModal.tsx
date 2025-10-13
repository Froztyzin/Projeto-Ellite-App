import React, { useState, useEffect, useRef } from 'react';
import { AssistantMessage } from '../../types';
import { getAiAssistantResponse } from '../../services/mockApi';
import { FaTimes, FaPaperPlane, FaSpinner, FaBrain } from 'react-icons/fa';

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { role: 'assistant', content: 'Olá! Sou seu assistente de IA. Como posso ajudar a analisar os dados da academia hoje?\nExperimente perguntar: "quantos alunos ativos temos?" ou "encontre o aluno joão".' }
            ]);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: AssistantMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const responseContent = await getAiAssistantResponse(inputValue);
            const assistantMessage: AssistantMessage = { role: 'assistant', content: responseContent };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Failed to get AI response:", error);
            const errorMessage: AssistantMessage = { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua solicitação.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[1000] flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl h-[70vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100 flex items-center">
                        <FaBrain className="mr-3 text-primary-500"/>
                        Assistente IA
                    </h3>
                    <button onClick={onClose} className="text-slate-400 bg-transparent hover:bg-slate-600 hover:text-slate-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <FaTimes className="w-5 h-5" />
                        <span className="sr-only">Fechar modal</span>
                    </button>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-700 text-white' : 'bg-slate-600 text-slate-200'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                            <div className="max-w-md p-3 rounded-lg bg-slate-600 text-slate-200 flex items-center">
                               <FaSpinner className="animate-spin mr-2"/>
                               <span className="text-sm">Pensando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-700">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-1 bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                            placeholder="Pergunte algo sobre os dados..."
                            disabled={isLoading}
                            autoFocus
                        />
                        <button type="submit" disabled={isLoading || !inputValue.trim()} className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:bg-primary-800 disabled:cursor-not-allowed">
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AssistantModal;
