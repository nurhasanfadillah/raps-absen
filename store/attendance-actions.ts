import type { Dispatch, SetStateAction } from 'react';
import type { AttendanceRecord, ActionType } from '../types';
import { supabase } from '../lib/supabase';

interface AttendanceActionDeps {
  attendance: AttendanceRecord[];
  setAttendance: Dispatch<SetStateAction<AttendanceRecord[]>>;
  addAuditLog: (action: ActionType, entity: string, description: string) => Promise<void>;
}

export function createAttendanceActions(deps: AttendanceActionDeps) {
  const { attendance, setAttendance, addAuditLog } = deps;

  const markAttendance = async (record: AttendanceRecord) => {
    const existing = attendance.find(
      (a) => a.employeeId === record.employeeId && a.date === record.date
    );
    const action = existing ? 'UPDATE' : 'CREATE';

    const dbRecord = {
      id: record.id,
      employee_id: record.employeeId,
      date: record.date,
      status: record.status,
      check_in_time: record.checkInTime || null,
      check_out_time: record.checkOutTime || null,
      overtime_hours: record.overtimeHours || 0,
      notes: record.notes,
    };

    const { error } = await supabase.from('attendance').upsert(dbRecord);
    if (error) throw new Error(error.message);

    setAttendance((prev) => {
      const filtered = prev.filter(
        (a) => !(a.employeeId === record.employeeId && a.date === record.date)
      );
      return [...filtered, record];
    });

    if (action === 'CREATE') {
      await addAuditLog(
        'CREATE',
        'Attendance',
        `Marked attendance for ${record.employeeId} on ${record.date}: ${record.status}`
      );
    }
  };

  const getAttendanceByDate = (date: string) => {
    return attendance.filter((a) => a.date === date);
  };

  return { markAttendance, getAttendanceByDate };
}
