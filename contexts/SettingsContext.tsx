import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getSettings, saveSettings } from '../services/api/settings';
import { useToast } from './ToastContext';

interface GymSettings {
    remindersEnabled: boolean;
    daysBeforeDue: number;
    overdueEnabled: boolean;
    gymName: string;
    pixKey: string;
}

interface SettingsContextType {
  settings: GymSettings | null;
  updateSettings: (newSettings: Partial<GymSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: GymSettings = {
    remindersEnabled: true,
    daysBeforeDue: 3,
    overdueEnabled: true,
    gymName: "Elitte Corpus Academia",
    pixKey: "",
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const currentSettings = await getSettings();
      setSettings(currentSettings || defaultSettings);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setSettings(defaultSettings);
      addToast('Não foi possível carregar as configurações do sistema.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<GymSettings>) => {
    if (!settings) return;
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
      addToast('Configurações salvas com sucesso!', 'success');
    } catch (error) {
      console.error("Failed to save settings:", error);
      addToast('Erro ao salvar configurações.', 'error');
      throw error;
    }
  }, [settings, addToast]);


  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
