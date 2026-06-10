
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Employee, AttendanceRecord, CashAdvance, PayrollReport, AuditLog, AuthCreds } from '../types';

interface RapsDB extends DBSchema {
  employees: {
    key: string;
    value: Employee;
    indexes: { 'by-status': string };
  };
  attendance: {
    key: string;
    value: AttendanceRecord;
    indexes: { 'by-date': string; 'by-employee': string };
  };
  cash_advances: {
    key: string;
    value: CashAdvance;
    indexes: { 'by-employee': string; 'by-paid': string };
  };
  payroll_reports: {
    key: string;
    value: PayrollReport;
  };
  audit_logs: {
    key: string;
    value: AuditLog;
    indexes: { 'by-timestamp': string };
  };
  auth: {
    key: string;
    value: AuthCreds;
  };
}

const DB_NAME = 'raps-db-v1';
const DB_VERSION = 2; // Incremented for auth store

export const initDB = async (): Promise<IDBPDatabase<RapsDB>> => {
  return openDB<RapsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Employees Store
      if (!db.objectStoreNames.contains('employees')) {
        const empStore = db.createObjectStore('employees', { keyPath: 'id' });
        empStore.createIndex('by-status', 'status');
      }

      // Attendance Store
      if (!db.objectStoreNames.contains('attendance')) {
        const attStore = db.createObjectStore('attendance', { keyPath: 'id' });
        attStore.createIndex('by-date', 'date');
        attStore.createIndex('by-employee', 'employeeId');
      }

      // Cash Advances Store
      if (!db.objectStoreNames.contains('cash_advances')) {
        const caStore = db.createObjectStore('cash_advances', { keyPath: 'id' });
        caStore.createIndex('by-employee', 'employeeId');
        caStore.createIndex('by-paid', 'isPaid');
      }

      // Payroll Reports Store
      if (!db.objectStoreNames.contains('payroll_reports')) {
        db.createObjectStore('payroll_reports', { keyPath: 'id' });
      }

      // Audit Logs Store
      if (!db.objectStoreNames.contains('audit_logs')) {
        const logStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
        logStore.createIndex('by-timestamp', 'timestamp');
      }

      // Auth Store
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth', { keyPath: 'id' });
      }
    },
  });
};

// Helper to hash password for seeding
const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Seed Data helper (only runs if employees empty)
export const seedDatabase = async (db: IDBPDatabase<RapsDB>) => {
  // Seed Auth if missing
  const auth = await db.get('auth', 'admin');
  if (!auth) {
    const passwordHash = await hashPassword('admin');
    await db.put('auth', {
      id: 'admin',
      username: 'admin',
      passwordHash: passwordHash
    });
  }

  const count = await db.count('employees');
  if (count === 0) {
    const employees: Employee[] = [
      { id: 'E001', fullName: 'Sarah Connor', role: 'Manager', baseSalary: 400000, overtimeRate: 75000, joinDate: '2023-01-15', status: 'Active', phone: '08123456789', email: 'sarah@redone.co.id', createdAt: new Date().toISOString() },
      { id: 'E002', fullName: 'John Wick', role: 'Staff', baseSalary: 250000, overtimeRate: 50000, joinDate: '2023-03-10', status: 'Active', phone: '08198765432', email: 'john@redone.co.id', createdAt: new Date().toISOString() },
      { id: 'E003', fullName: 'Tony Stark', role: 'Intern', baseSalary: 150000, overtimeRate: 30000, joinDate: '2024-01-01', status: 'Active', phone: '08112233445', email: 'tony@redone.co.id', createdAt: new Date().toISOString() },
    ];
    
    const tx = db.transaction('employees', 'readwrite');
    await Promise.all(employees.map(emp => tx.store.add(emp)));
    await tx.done;

    // Seed logs
    await db.add('audit_logs', {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SYSTEM',
      entity: 'Employee',
      description: 'System initialized with seed data',
      user: 'System'
    });
  }
};
