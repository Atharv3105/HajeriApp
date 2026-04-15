import { create } from 'zustand';
import { AttendanceRecord } from '@/services/db/attendanceRepo';

interface Student {
  id: string;
  name: string;
  roll_number: number;
}

interface AttendanceState {
  sessionId: string | null;
  classId: string | null;
  students: Student[];
  records: Map<string, AttendanceRecord>;
  
  setSession: (sessionId: string, classId: string, students: Student[]) => void;
  markStudent: (studentId: string, status: AttendanceRecord['status'], method: AttendanceRecord['method']) => void;
  clearSession: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  sessionId: null,
  classId: null,
  students: [],
  records: new Map(),

  setSession: (sessionId, classId, students) => {
    set({ sessionId, classId, students, records: new Map() });
  },

  markStudent: (studentId, status, method) => {
    const newRecords = new Map(get().records);
    newRecords.set(studentId, { studentId: studentId, status, method } as any);
    set({ records: newRecords });
  },

  clearSession: () => {
    set({ sessionId: null, classId: null, students: [], records: new Map() });
  }
}));
