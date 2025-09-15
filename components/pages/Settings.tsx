import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaListAlt, FaDownload, FaUpload, FaExclamationTriangle, FaSpinner, FaPiggyBank } from 'react-icons/fa';
import { exportDatabase, importDatabase, getPaymentSettings, savePaymentSettings, getGeneralSettings, saveGeneralSettings } from '../../services/api/settings';
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
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const database = await exportDatabase();
            const jsonString = JSON.stringify(database, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const today = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `gym_finance_backup_${today}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addToast('Backup exportado com sucesso!', 'success');
        } catch (error) {
            console.error("Failed to export database:", error);
            addToast('Falha ao exportar o backup.', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            addToast('Por favor, selecione um arquivo para importar.', 'error');
            return;
        }

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (event.target && typeof event.target.result === 'string') {
                    const data = JSON.parse(event.target.result);
                    await importDatabase(data);
                    addToast('Dados importados com sucesso! A página será recarregada.', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            } catch (error) {
                 console.error("Failed to import database:", error);
                 const errorMessage = (error instanceof Error) ? error.message : 'Arquivo inválido ou corrompido.';
                 addToast(`Falha na importação: ${errorMessage}`, 'error');
            } finally {
                setIsImporting(false);
            }
        };
        reader.onerror = () => {
             addToast('Erro ao ler o arquivo.', 'error');
             setIsImporting(false);
        };
        reader.readAsText(selectedFile);
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

                {isAdmin && (
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-2">Backup e Restauração</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-slate-700/50 rounded-lg border border-slate-600">
                                <h3 className="font-semibold text-slate-100 mb-3 flex items-center"><FaDownload className="mr-3 text-primary-500" /> Exportar Dados</h3>
                                <p className="text-sm text-slate-400 mb-4">Crie um backup de todos os dados do sistema em um arquivo <code>.json</code>.</p>
                                <button onClick={handleExport} disabled={isExporting} className="w-full sm:w-auto flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400">
                                    {isExporting ? <FaSpinner className="animate-spin mr-2" /> : <FaDownload className="mr-2" />}
                                    {isExporting ? 'Exportando...' : 'Exportar Backup'}
                                </button>
                            </div>
                            <div className="p-6 bg-slate-700/50 rounded-lg border border-slate-600">
                                <h3 className="font-semibold text-slate-100 mb-3 flex items-center"><FaUpload className="mr-3 text-primary-500" /> Importar Dados</h3>
                                <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm">
                                    <p className="font-bold flex items-center"><FaExclamationTriangle className="mr-2" /> Atenção!</p>
                                    <p className="mt-1">Importar um arquivo irá <strong>substituir permanentemente</strong> todos os dados existentes.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <input type="file" accept=".json" onChange={handleFileChange} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-900/50 file:text-primary-300 hover:file:bg-primary-900"/>
                                    <button onClick={handleImport} disabled={isImporting || !selectedFile} className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isImporting ? <FaSpinner className="animate-spin mr-2" /> : <FaUpload className="mr-2" />}
                                        {isImporting ? 'Importando...' : 'Importar'}
                                    </button>
                                </div>
                            </div>
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