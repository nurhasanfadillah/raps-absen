import type { Dispatch, SetStateAction } from 'react';
import type { ActionType } from '../types';
import { supabase } from '../lib/supabase';

// Session Management
const SESSION_KEY = 'raps_session';
const SESSION_HOURS = 8;

export function saveSession(username: string) {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, expiresAt }));
}

export function loadSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { username, expiresAt } = JSON.parse(raw) as { username: string; expiresAt: number };
    if (Date.now() > expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return username;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Salt prevents rainbow table attacks; default '' for legacy compat
export const hashPassword = async (password: string, salt: string = ''): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

interface AuthActionDeps {
  currentUser: string | null;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  setCurrentUser: Dispatch<SetStateAction<string | null>>;
  addAuditLog: (action: ActionType, entity: string, description: string) => Promise<void>;
}

export function createAuthActions(deps: AuthActionDeps) {
  const { currentUser, setIsAuthenticated, setCurrentUser, addAuditLog } = deps;

  const login = async (username: string, password: string): Promise<boolean> => {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'auth_admin')
      .single();

    if (!data) return false;
    const creds = data.value;

    const inputHash = await hashPassword(password, username);
    if (creds.username === username && creds.passwordHash === inputHash) {
      setIsAuthenticated(true);
      setCurrentUser(username);
      saveSession(username);
      await addAuditLog('AUTH', 'Auth', `User logged in: ${username}`);
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (currentUser) {
      await addAuditLog('AUTH', 'Auth', `User logged out: ${currentUser}`);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    clearSession();
  };

  const updateCredentials = async (oldP: string, newU: string, newP: string) => {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'auth_admin')
      .single();
    const creds = data?.value;
    const oldHash = await hashPassword(oldP, creds.username);

    if (creds.passwordHash !== oldHash) {
      throw new Error('Password lama salah.');
    }

    if (newP.length < 5) {
      throw new Error('Password baru minimal 5 karakter.');
    }

    const newHash = await hashPassword(newP, newU);

    await supabase
      .from('app_config')
      .update({ value: { username: newU, passwordHash: newHash } })
      .eq('key', 'auth_admin');

    await addAuditLog('AUTH', 'Auth', `Credentials updated for admin.`);
    setCurrentUser(newU);
    saveSession(newU);
  };

  const resetCredentials = async (code: string): Promise<boolean> => {
    if (code === '301292') {
      const defaultHash = await hashPassword('admin', 'admin');
      await supabase
        .from('app_config')
        .update({ value: { username: 'admin', passwordHash: defaultHash } })
        .eq('key', 'auth_admin');

      await addAuditLog('AUTH', 'Auth', `EMERGENCY RESET: Credentials reset to default.`);
      return true;
    }
    return false;
  };

  return { login, logout, updateCredentials, resetCredentials };
}
