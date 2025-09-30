import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaListAlt, FaSpinner, FaPiggyBank, FaUsersCog, FaBell } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === Role.ADMIN;
    const { addToast } = useToast();
    const { settings: contextSettings, updateSettings, loading: isLoading } = useSettings();

    const [localSettings, setLocalSettings] = useState(contextSettings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setLocalSettings(contextSettings);
    }, [contextSettings]);

    const handleSettingChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target;
        const name = target.name;

        if (target instanceof HTMLInputElement && target.type === 'checkbox') {
            setLocalSettings(prev => prev ? ({ ...prev, [name]: target.checked }) : null);
        } else {
            const value = target.value;
            const isNumberInput = 'type' in target && target.type === 'number';
            setLocalSettings(prev => prev ? ({
                ...prev,
                [name]: isNumberInput ? parseInt(value, 10) || 0 : value,
            }) : null);
        }
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (localSettings) {
                await updateSettings(localSettings);
            }
        } catch (error) {
            // Toast is handled in context
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !localSettings) {
        return (
             <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm animate-pulse">
                <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-8">
                    <div className="h-6 bg-slate-700 rounded w-1/4 mb-4"></div>
                    <div className="h-20 bg-slate-700 rounded"></div>
                    <div className="h-6 bg-slate-700 rounded w-1/4 mb-4"></div>
                    <div className="h-20 bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Configurações</h1>
            <div className="space-y-12">
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2">Gerenciamento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       <Link to="/settings/plans" className="block p-6 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700 hover:shadow-md transition-all">
                           <FaListAlt className="text-3xl text-primary-500 mb-3" />
                           <h3 className="font-semibold text-slate-100">Planos da Academia</h3>
                           <p className="text-sm text-slate-400 mt-1">Crie, edite e gerencie os planos.</p>
                       </Link>
                       {isAdmin && (
                           <Link to="/settings/users" className="block p-6 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700 hover:shadow-md transition-all">
                               <FaUsersCog className="text-3xl text-primary-500 mb-3" />
                               <h3 className="font-semibold text-slate-100">Usuários do Sistema</h3>
                               <p className="text-sm text-slate-400 mt-1">Gerencie os acessos da equipe.</p>
                           </Link>
                       )}
                    </div>
                </div>

                 {isAdmin && (
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2 flex items-center">
                            <FaPiggyBank className="mr-3 text-primary-400"/>
                            Configurações de Pagamento
                        </h2>
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 space-y-4">
                            <div>
                                <label htmlFor="gymName" className="block text-sm font-medium text-slate-300">Nome da Academia</label>
                                <input type="text" id="gymName" name="gymName" value={localSettings.gymName} onChange={handleSettingChange} className="mt-1 block w-full md:w-2/3 rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2"/>
                            </div>
                            <div>
                                <label htmlFor="pixKey" className="block text-sm font-medium text-slate-300">Chave PIX da Empresa</label>
                                <input type="text" id="pixKey" name="pixKey" value={localSettings.pixKey} onChange={handleSettingChange} className="mt-1 block w-full md:w-2/3 rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2" placeholder="CNPJ, E-mail, etc."/>
                                <p className="text-xs text-slate-400 mt-2">Usada para gerar cobranças PIX. Deixe em branco para desativar.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2 flex items-center">
                        <FaBell className="mr-3 text-primary-400"/>
                        Notificações Automáticas
                    </h2>
                    <fieldset disabled={!isAdmin} className="space-y-6 disabled:opacity-70">
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">Ativar lembretes de vencimento</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="remindersEnabled" checked={localSettings.remindersEnabled} onChange={handleSettingChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                            {localSettings.remindersEnabled && (
                                <div className="pl-4 border-l-2 border-slate-500">
                                    <label htmlFor="daysBeforeDue" className="block text-sm font-medium text-slate-300">Enviar lembrete (dias antes)</label>
                                    <input type="number" id="daysBeforeDue" name="daysBeforeDue" value={localSettings.daysBeforeDue} onChange={handleSettingChange} min="1" max="15" className="mt-1 block w-full max-w-xs rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2" />
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                             <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">Ativar alertas de fatura atrasada</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="overdueEnabled" checked={localSettings.overdueEnabled} onChange={handleSettingChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        </div>
                    </fieldset>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-700">
                    <div className="flex justify-end">
                        <button onClick={handleSave} disabled={!isAdmin || isSaving} className="w-full sm:w-auto flex items-center justify-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-slate-500 disabled:cursor-not-allowed">
                            {isSaving ? <FaSpinner className="animate-spin mr-2"/> : null}
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                     {!isAdmin && <p className="text-right text-sm text-slate-400 mt-2">Apenas administradores podem alterar as configurações.</p>}
                </div>
            </div>
        </div>
    );
};

export default Settings;
