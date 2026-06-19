import type { Dispatch, SetStateAction } from 'react';
import type { Employee, CashAdvance, ActionType } from '../types';
import { supabase } from '../lib/supabase';

interface CashAdvanceActionDeps {
  employees: Employee[];
  cashAdvances: CashAdvance[];
  setCashAdvances: Dispatch<SetStateAction<CashAdvance[]>>;
  addAuditLog: (action: ActionType, entity: string, description: string) => Promise<void>;
}

export function createCashAdvanceActions(deps: CashAdvanceActionDeps) {
  const { employees, cashAdvances, setCashAdvances, addAuditLog } = deps;

  const addCashAdvance = async (ca: CashAdvance) => {
    const dbCA = {
      id: ca.id,
      employee_id: ca.employeeId,
      amount: ca.amount,
      date: ca.date,
      reason: ca.reason,
      is_paid: false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('cash_advances').insert(dbCA);
    if (error) throw new Error(error.message);

    const emp = employees.find((e) => e.id === ca.employeeId);
    await addAuditLog(
      'CREATE',
      'CashAdvance',
      `Added cash advance Rp ${ca.amount} for ${emp?.fullName}`
    );
    setCashAdvances((prev) => [...prev, { ...ca, createdAt: dbCA.created_at }]);
  };

  const updateCashAdvance = async (ca: CashAdvance) => {
    const existing = cashAdvances.find((c) => c.id === ca.id);
    if (!existing) throw new Error('Data kasbon tidak ditemukan.');

    const dbCA = {
      amount: ca.amount,
      date: ca.date,
      reason: ca.reason,
    };

    const { error } = await supabase.from('cash_advances').update(dbCA).eq('id', ca.id);
    if (error) throw new Error(error.message);

    await addAuditLog(
      'UPDATE',
      'CashAdvance',
      `Updated cash advance amount to Rp ${ca.amount} for ${ca.id}`
    );
    setCashAdvances((prev) => prev.map((c) => (c.id === ca.id ? ca : c)));
  };

  const deleteCashAdvance = async (id: string) => {
    const existing = cashAdvances.find((c) => c.id === id);
    if (!existing) throw new Error('Data kasbon tidak ditemukan.');

    const { error } = await supabase.from('cash_advances').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await addAuditLog('DELETE', 'CashAdvance', `Deleted cash advance request ${id}`);
    setCashAdvances((prev) => prev.filter((c) => c.id !== id));
  };

  const markCashAdvancePaid = async (id: string) => {
    const { error } = await supabase.from('cash_advances').update({ is_paid: true }).eq('id', id);
    if (error) throw new Error(error.message);

    const ca = cashAdvances.find((c) => c.id === id);
    const updated = { ...ca!, isPaid: true };
    await addAuditLog('UPDATE', 'CashAdvance', `Marked cash advance ${id} as Paid`);
    setCashAdvances((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  return { addCashAdvance, updateCashAdvance, deleteCashAdvance, markCashAdvancePaid };
}
