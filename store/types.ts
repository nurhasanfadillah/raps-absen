import type { Employee, AttendanceRecord, CashAdvance, PayrollReport, AuditLog } from '../types';

export interface AppContextType {
  employees: Employee[];
  attendance: AttendanceRecord[];
  cashAdvances: CashAdvance[];
  payrollReports: PayrollReport[];
  auditLogs: AuditLog[];
  isLoading: boolean;

  isAuthenticated: boolean;
  currentUser: string | null;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCredentials: (oldP: string, newU: string, newP: string) => Promise<void>;
  resetCredentials: (code: string) => Promise<boolean>;

  addEmployee: (emp: Employee) => Promise<void>;
  updateEmployee: (emp: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  markAttendance: (record: AttendanceRecord) => Promise<void>;
  getAttendanceByDate: (date: string) => AttendanceRecord[];

  addCashAdvance: (ca: CashAdvance) => Promise<void>;
  updateCashAdvance: (ca: CashAdvance) => Promise<void>;
  deleteCashAdvance: (id: string) => Promise<void>;
  markCashAdvancePaid: (id: string) => Promise<void>;

  generatePayroll: (start: string, end: string) => PayrollReport;
  savePayrollReport: (report: PayrollReport) => Promise<void>;
  deletePayrollReport: (id: string) => Promise<void>;
}
