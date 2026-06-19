import type { Dispatch, SetStateAction } from 'react';
import type { Employee, AttendanceRecord, CashAdvance, PayrollReport, ActionType } from '../types';
import { supabase } from '../lib/supabase';

interface EmployeeActionDeps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  cashAdvances: CashAdvance[];
  payrollReports: PayrollReport[];
  setEmployees: Dispatch<SetStateAction<Employee[]>>;
  addAuditLog: (action: ActionType, entity: string, description: string) => Promise<void>;
}

export function createEmployeeActions(deps: EmployeeActionDeps) {
  const { employees, attendance, cashAdvances, payrollReports, setEmployees, addAuditLog } = deps;

  const addEmployee = async (emp: Employee) => {
    const dbEmp = {
      id: emp.id,
      full_name: emp.fullName,
      role: emp.role,
      base_salary: emp.baseSalary,
      overtime_rate: emp.overtimeRate,
      join_date: emp.joinDate,
      status: emp.status,
      phone: emp.phone,
      email: emp.email,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('employees').insert(dbEmp);
    if (error) throw new Error(error.message);

    await addAuditLog('CREATE', 'Employee', `Added new employee: ${emp.fullName}`);
    setEmployees((prev) => [...prev, { ...emp, createdAt: dbEmp.created_at }]);
  };

  const updateEmployee = async (emp: Employee) => {
    const dbEmp = {
      full_name: emp.fullName,
      role: emp.role,
      base_salary: emp.baseSalary,
      overtime_rate: emp.overtimeRate,
      join_date: emp.joinDate,
      status: emp.status,
      phone: emp.phone,
      email: emp.email,
    };

    const { error } = await supabase.from('employees').update(dbEmp).eq('id', emp.id);
    if (error) throw new Error(error.message);

    await addAuditLog('UPDATE', 'Employee', `Updated employee details: ${emp.fullName}`);
    setEmployees((prev) => prev.map((e) => (e.id === emp.id ? emp : e)));
  };

  const deleteEmployee = async (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;

    const hasAttendance = attendance.some((a) => a.employeeId === id);
    const hasCashAdvance = cashAdvances.some((c) => c.employeeId === id);
    const hasPayrollHistory = payrollReports.some(
      (p) => !p.isDeleted && p.items.some((i) => i.employeeId === id)
    );

    if (hasAttendance || hasCashAdvance || hasPayrollHistory) {
      const errorMsg =
        'Karyawan memiliki riwayat transaksi. Hard Delete ditolak. Silahkan ubah status menjadi Non-Aktif.';
      await addAuditLog(
        'SYSTEM',
        'Employee',
        `Failed attempt to delete employee ${emp.fullName}: Linked data exists.`
      );
      throw new Error(errorMsg);
    }

    const { error } = await supabase
      .from('employees')
      .update({ deleted_at: new Date().toISOString(), status: 'Inactive' })
      .eq('id', id);
    if (error) throw new Error(error.message);

    await addAuditLog('DELETE', 'Employee', `Soft deleted employee: ${emp.fullName}`);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  return { addEmployee, updateEmployee, deleteEmployee };
}
