import type { Dispatch, SetStateAction } from 'react';
import type { ActionType, AuditLog } from '../types';
import { supabase } from '../lib/supabase';

interface AuditActionDeps {
  currentUser: string | null;
  setAuditLogs: Dispatch<SetStateAction<AuditLog[]>>;
}

export function createAuditActions(deps: AuditActionDeps) {
  const { currentUser, setAuditLogs } = deps;

  const addAuditLog = async (action: ActionType, entity: string, description: string) => {
    const log = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      description,
      user_name: currentUser || 'System',
    };

    await supabase.from('audit_logs').insert(log);
    setAuditLogs((prev) => [{ ...log, user: log.user_name } as AuditLog, ...prev]);
  };

  return { addAuditLog };
}
