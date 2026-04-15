import * as Crypto from "expo-crypto";
import { dbPromise } from "./schema";

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  date?: string;
  time?: string;
  status: "Present" | "Absent" | "Verified" | "Leave" | "Late" | "leave" | "present" | "absent";
  confidence?: number;
  className?: string;
  timeSlot?: string;
  subject?: string;
  sessionId?: string;
  method?: string;
}

export const attendanceRepo = {
  async startSession(className: string, teacherId: string, subject: string) {
    const db = await dbPromise;
    const id = Crypto.randomUUID();
    const date = new Date().toISOString().split("T")[0];

    await db.runAsync(
      "INSERT INTO attendance_sessions (id, class_name, teacher_id, subject, date) VALUES (?, ?, ?, ?, ?)",
      [id, className, teacherId, subject, date],
    );

    return id;
  },

  async getClassesForTeacher(teacherId: string) {
    const db = await dbPromise;
    // For rural context, we'll get distinct class names from the students table
    const rows = await db.getAllAsync<{ class_name: string }>(
      "SELECT DISTINCT class_name FROM students WHERE school_id IS NOT NULL OR 1=1 ORDER BY class_name ASC;"
    );
    return rows.map(r => ({ id: r.class_name, class_name: r.class_name }));
  },

  async getStudentsForClass(className: string) {
    const db = await dbPromise;
    const students = await db.getAllAsync<{
      id: string;
      name: string;
      roll_number: number;
    }>(
      "SELECT id, name, roll_number FROM students WHERE class_name = ? ORDER BY roll_number ASC",
      [className],
    );
    return students;
  },

  async saveBatchRecords(sessionId: string, records: AttendanceRecord[]) {
    const db = await dbPromise;

    try {
      await db.withTransactionAsync(async () => {
        for (const record of records) {
          const recordId = Crypto.randomUUID();
          await db.runAsync(
            "INSERT INTO attendance_records (id, session_id, student_id, status, method, subject, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [recordId, sessionId, record.studentId, record.status, record.method || "manual", record.subject || "", new Date().toISOString().split("T")[0]],
          );

          await db.runAsync(
            "INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)",
            ["attendance_records", recordId, "create", JSON.stringify({ ...record, id: recordId })],
          );
        }

        await db.runAsync(
          "UPDATE attendance_sessions SET ended_at = datetime('now', 'localtime') WHERE id = ?",
          [sessionId],
        );
      });
    } catch (e) {
      console.error("[DB] saveBatchRecords failed:", e);
      throw e;
    }
  },

  async getSessionSummary(sessionId: string) {
    const db = await dbPromise;
    const stats = await db.getAllAsync<{ status: string; count: number }>(
      "SELECT status, COUNT(*) as count FROM attendance_records WHERE session_id = ? GROUP BY status",
      [sessionId],
    );
    return stats;
  },

  async getAttendanceHistory() {
    const db = await dbPromise;
    return db.getAllAsync<{
      session_id: string;
      date: string;
      class_name: string;
      subject: string;
      present: number;
      absent: number;
      total: number;
    }>(
      `SELECT
         date,
         class_name,
         subject,
         SUM(CASE WHEN status IN ('present', 'Present', 'Verified') THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN status IN ('absent', 'Absent') THEN 1 ELSE 0 END) as absent,
         COUNT(id) as total
       FROM attendance_records
       GROUP BY date, class_name, subject
       ORDER BY date DESC;`,
      [],
    );
  },

  async getStudentAttendance(studentId: string) {
    const db = await dbPromise;
    return db.getAllAsync<{
      date: string;
      class_name: string;
      subject: string;
      status: string;
      method: string;
      marked_at: string;
    }>(
      `SELECT
         date,
         class_name,
         subject,
         status,
         method,
         marked_at
       FROM attendance_records
       WHERE student_id = ?
       ORDER BY date DESC, marked_at DESC;`,
      [studentId],
    );
  },

  async getClassAttendanceHistory(className: string) {
    const db = await dbPromise;
      return db.getAllAsync<{
      session_id: string;
      date: string;
      class_name: string;
      subject: string;
      present: number;
      absent: number;
      total: number;
    }>(
      `SELECT
         date,
         class_name,
         subject,
         SUM(CASE WHEN status IN ('present', 'Present', 'Verified') THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN status IN ('absent', 'Absent') THEN 1 ELSE 0 END) as absent,
         COUNT(id) as total
       FROM attendance_records
       WHERE class_name = ?
       GROUP BY date, subject
       ORDER BY date DESC;`,
      [className],
    );
  },

  async getClassAttendanceReport(className: string) {
    const db = await dbPromise;
    return db.getAllAsync<{
      id: string;
      name: string;
      roll_number: number;
      attendance_percent: number;
      present_count: number;
      total_count: number;
    }>(
      `SELECT
         s.id,
         s.name,
         s.roll_number,
         ROUND(
           CASE
             WHEN COUNT(ar.id) = 0 THEN 0
             ELSE 100.0 * SUM(CASE WHEN ar.status IN ('present','Present','Verified','leave','Leave') THEN 1 ELSE 0 END) / COUNT(ar.id)
           END, 0
         ) AS attendance_percent,
         SUM(CASE WHEN ar.status IN ('present','Present','Verified','leave','Leave') THEN 1 ELSE 0 END) AS present_count,
         COUNT(ar.id) AS total_count
       FROM students s
       LEFT JOIN attendance_records ar ON ar.student_id = s.id
       WHERE s.class_name = ?
       GROUP BY s.id, s.name, s.roll_number
       ORDER BY s.roll_number ASC;`,
      [className],
    );
  },

  async queueAbsentNotifications(
    sessionId: string,
    records: any[],
  ) {
    // Deprecated in favor of sendAttendanceNotifications but kept for stability
    const db = await dbPromise;
    try {
      await db.withTransactionAsync(async () => {
        for (const record of records) {
          const status = record.status?.toLowerCase();
          if (status !== "absent") continue;

          await db.runAsync(
            `INSERT INTO notifications (student_id, role, title_mr, body_mr)
             VALUES (?, 'parent', ?, ?);`,
            [
              record.studentId,
              "विद्यार्थी अनुपस्थित आहे",
              "आज तुमचा विद्यार्थी अनुपस्थित आहे. कृपया शाळेशी संपर्क करा.",
            ],
          );
        }
      });
    } catch (e) {
      console.error("[DB] queueAbsentNotifications failed:", e);
    }
  },

  async sendAttendanceNotifications(records: AttendanceRecord[]) {
    const db = await dbPromise;
    try {
      await db.withTransactionAsync(async () => {
        for (const record of records) {
          const isPresent = ["Present", "present", "Verified", "verified"].includes(record.status);
          const isAbsent = ["Absent", "absent"].includes(record.status);
          
          if (!isPresent && !isAbsent) continue;

          const title = isPresent ? "विद्यार्थी उपस्थित आहे" : "विद्यार्थी अनुपस्थित आहे";
          const statusText = isPresent ? "उपस्थित" : "अनुपस्थित";
          
          // Format time to 12-hour Marathi friendly format if possible, or just use as is
          const displayTime = record.time || new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' });
          
          const body = `आज आपला मुलगा/मुलगी [${record.subject || 'सामान्य'}] विषयाला [${displayTime}] वाजता ${statusText} आहे.`;

          await db.runAsync(
            `INSERT INTO notifications (student_id, role, title_mr, body_mr)
             VALUES (?, 'parent', ?, ?);`,
            [record.studentId, title, body],
          );
        }
      });
      console.log(`[Notifications] Queued ${records.length} attendance alerts.`);
    } catch (e) {
      console.error("[DB] sendAttendanceNotifications failed:", e);
    }
  },

  async getParentNotifications(studentId: string) {
    const db = await dbPromise;
    if (!studentId) return [];
    
    return db.getAllAsync<{
      id: number;
      title_mr: string;
      body_mr: string;
      created_at: string;
    }>(
      `SELECT id, title_mr, body_mr, created_at
       FROM notifications
       WHERE (student_id = ? OR student_id IS NULL) AND role = 'parent'
       ORDER BY created_at DESC;`,
      [studentId],
    );
  },

  async getParentContactsForStudentIds(studentIds: string[]) {
    if (studentIds.length === 0) return [];
    const db = await dbPromise;
    const placeholders = studentIds.map(() => "?").join(",");
    return db.getAllAsync<{
      student_id: string;
      student_name: string;
      parent_phone: string | null;
    }>(
      `SELECT id AS student_id, name AS student_name, parent_phone
       FROM students
       WHERE id IN (${placeholders});`,
      studentIds,
    );
  },

  async markSmsSentForStudentIds(sessionId: string, studentIds: string[]) {
    if (studentIds.length === 0) return;
    const db = await dbPromise;
    const placeholders = studentIds.map(() => "?").join(",");
    await db.runAsync(
      `UPDATE attendance_records
       SET sms_sent = 1
       WHERE session_id = ? AND student_id IN (${placeholders});`,
      [sessionId, ...studentIds],
    );
  },
  async getSchoolInfo() {
    const db = await dbPromise;
    return db.getFirstAsync<{
      name: string;
      udise_code: string;
      district: string;
      taluka: string;
    }>("SELECT name, udise_code, district, taluka FROM schools LIMIT 1;");
  },

  async getMonthlyClassAttendanceReport(className: string, yearMonth: string, subject?: string) {
    const db = await dbPromise;
    let query = `
      SELECT
         s.id,
         s.name,
         s.roll_number,
         ROUND(
           CASE
             WHEN COUNT(ar.id) = 0 THEN 0
             ELSE 100.0 * SUM(CASE WHEN ar.status IN ('present','Present','Verified','leave','Leave') THEN 1 ELSE 0 END) / COUNT(ar.id)
           END, 0
         ) AS attendance_percent,
         SUM(CASE WHEN ar.status IN ('present','Present','Verified','leave','Leave') THEN 1 ELSE 0 END) AS present_count,
         COUNT(ar.id) AS total_count
       FROM students s
       LEFT JOIN attendance_records ar ON ar.student_id = s.id
       LEFT JOIN attendance_sessions sess ON ar.session_id = sess.id AND sess.date LIKE ?
    `;

    const params: any[] = [`${yearMonth}%` ];

    if (subject) {
        query += " AND sess.subject = ? ";
        params.push(subject);
    }

    query += `
       WHERE s.class_name = ?
       GROUP BY s.id, s.name, s.roll_number
       ORDER BY s.roll_number ASC;
    `;
    params.push(className);

    return db.getAllAsync<{
      id: string;
      name: string;
      roll_number: number;
      attendance_percent: number;
      present_count: number;
      total_count: number;
    }>(query, params);
  },
  async getStudentsByParentPhone(phone: string) {
    const db = await dbPromise;
    return db.getAllAsync<{ id: string; name: string; class_name: string }>(
      "SELECT id, name, class_name FROM students WHERE parent_phone = ?;",
      [phone],
    );
  },
};
