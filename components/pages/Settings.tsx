import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaListAlt, FaDownload, FaUpload, FaExclamationTriangle, FaSpinner, FaPiggyBank } from 'react-icons/fa';
import { getPaymentSettings, savePaymentSettings, getGeneralSettings, saveGeneralSettings } from '../../services/api/settings';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import { useToast } from '../../contexts/ToastContext';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === Role.ADMIN;
    const { addToast } = useToast();
    
    // Combined state for all settings
    const [settings, setSettings] = useState({
        remindersEnabled: true,
        daysBeforeDue: 3,
        overdueEnabled: true,
        useEmail: true,
        useWhatsapp: true,
        gymName: "Elitte Corpus Academia",
        gymCnpj: "00.000.000/0001-00",
        lateFee: "2",
        interestRate: "0.1",
        pixKey: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    
     useEffect(() => {
        const loadSettings = async () => {
            const general = await getGeneralSettings();
            const payment = await getPaymentSettings();
            setSettings(prev => ({ ...prev, ...general, ...payment }));
        };
        loadSettings();
    }, []);


    const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { pixKey, ...generalSettings } = settings;
            await saveGeneralSettings(generalSettings);
            await savePaymentSettings({ pixKey });
            addToast('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            addToast('Erro ao salvar configurações.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

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
                           <p className="text-sm text-slate-400 mt-1">Crie, edite e gerencie os planos oferecidos aos alunos.</p>
                       </Link>
                    </div>
                </div>

                 {isAdmin && (
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2 flex items-center">
                            <FaPiggyBank className="mr-3 text-primary-400"/>
                            Configurações de Pagamento via PIX
                        </h2>
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                             <label htmlFor="pixKey" className="block text-sm font-medium text-slate-300">Chave PIX da Empresa</label>
                             <input type="text" id="pixKey" name="pixKey" value={settings.pixKey} onChange={handleSettingChange} className="mt-1 block w-full md:w-2/3 rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2" placeholder="CNPJ, E-mail, Telefone, etc."/>
                             <p className="text-xs text-slate-400 mt-2">Esta chave será usada para gerar as cobranças PIX para os alunos. Deixe em branco para usar chaves aleatórias de teste.</p>
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2">Notificações</h2>
                    <fieldset disabled={!isAdmin} className="space-y-6 disabled:opacity-70">
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">Ativar lembretes de vencimento</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="remindersEnabled" checked={settings.remindersEnabled} onChange={handleSettingChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                            {settings.remindersEnabled && (
                                <div className="pl-4 border-l-2 border-slate-500">
                                    <label htmlFor="daysBeforeDue" className="block text-sm font-medium text-slate-300">Enviar lembrete (dias antes)</label>
                                    <input type="number" id="daysBeforeDue" name="daysBeforeDue" value={settings.daysBeforeDue} onChange={handleSettingChange} className="mt-1 block w-full max-w-xs rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2" />
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                             <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">Ativar alertas de fatura atrasada</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="overdueEnabled" checked={settings.overdueEnabled} onChange={handleSettingChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        </div>
                        <div>
                             <p className="text-sm font-medium text-slate-300 mb-2">Canais de envio</p>
                             <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input type="checkbox" name="useEmail" checked={settings.useEmail} onChange={handleSettingChange} className="h-4 w-4 rounded border-slate-500 bg-slate-600 text-primary-600 focus:ring-primary-500" />
                                    <span className="ml-2 text-sm text-slate-400">Email</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" name="useWhatsapp" checked={settings.useWhatsapp} onChange={handleSettingChange} className="h-4 w-4 rounded border-slate-500 bg-slate-600 text-primary-600 focus:ring-primary-500" />
                                    <span className="ml-2 text-sm text-slate-400">WhatsApp</span>
                                </label>
                             </div>
                        </div>
                    </fieldset>
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2">Geral</h2>
                    <fieldset disabled={!isAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-6 disabled:opacity-70">
                        <div>
                            <label htmlFor="gymName" className="block text-sm font-medium text-slate-300">Nome da Academia</label>
                            <input type="text" id="gymName" name="gymName" value={settings.gymName} onChange={handleSettingChange} className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm p-2" />
                        </div>
                        <div>
                            <label htmlFor="gymCnpj" className="block text-sm font-medium text-slate-300">CNPJ</label>
                            <input type="text" id="gymCnpj" name="gymCnpj" value={settings.gymCnpj} onChange={handleSettingChange} className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm p-2" />
                        </div>
                    </fieldset>
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2">Faturamento</h2>
                    <fieldset disabled={!isAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-6 disabled:opacity-70">
                        <div>
                            <label htmlFor="lateFee" className="block text-sm font-medium text-slate-300">Multa por Atraso (%)</label>
                            <input type="number" id="lateFee" name="lateFee" value={settings.lateFee} onChange={handleSettingChange} className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm p-2" />
                        </div>
                        <div>
                            <label htmlFor="interestRate" className="block text-sm font-medium text-slate-300">Juros por Dia (%)</label>
                            <input type="number" step="0.1" id="interestRate" name="interestRate" value={settings.interestRate} onChange={handleSettingChange} className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm p-2" />
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
                </div>
            </div>
        </div>
    );
};

export default Settings;