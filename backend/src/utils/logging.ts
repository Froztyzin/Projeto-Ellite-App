import { supabase } from '../lib/supabaseClient';
import { LogActionType, Role } from '../types';

interface LogEntry {
  userName: string;
  userRole: Role;
  action: LogActionType;
  details: string;
}

export const addLog = async (entry: LogEntry): Promise<void> => {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_name: entry.userName,
      user_role: entry.userRole,
      action: entry.action,
      details: entry.details,
    });
    if (error) throw error;
  } catch (error) {
    console.error('Failed to write to audit log:', error);
  }
};