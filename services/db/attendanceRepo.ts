import * as Crypto from "expo-crypto";
import { dbPromise } from "./schema";

export interface AttendanceRecord {
  student_id: string;
  status: "present" | "absent" | "leave" | "late";
  method: "face" | "voice" | "manual" | "approved_leave";
}

export const attendanceRepo = {
  async startSession(className: string, teacherId: string) {
    const db = await dbPromise;
    const id = Crypto.randomUUID();
    const date = new Date().toISOString().split("T")[0];

    await db.runAsync(
      "INSERT INTO attendance_sessions (id, class_name, teacher_id, date) VALUES (?, ?, ?, ?)",
      [id, className, teacherId, date],
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

    // Use a transaction for bulk insert
    await db.withTransactionAsync(async () => {
      for (const record of records) {
        await db.runAsync(
          "INSERT INTO attendance_records (session_id, student_id, status, method) VALUES (?, ?, ?, ?)",
          [sessionId, record.student_id, record.status, record.method],
        );

        // Add to sync queue for offline sync
        await db.runAsync(
          "INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)",
          ["attendance_records", sessionId, "create", JSON.stringify(record)],
        );
      }

      // Mark session as ended
      await db.runAsync(
        "UPDATE attendance_sessions SET ended_at = datetime('now', 'localtime') WHERE id = ?",
        [sessionId],
      );
    });
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
      present: number;
      absent: number;
      total: number;
    }>(
      `SELECT
         s.id as session_id,
         s.date,
         s.class_name,
         SUM(CASE WHEN ar.status IN ('present', 'Present', 'Verified') THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN ar.status IN ('absent', 'Absent') THEN 1 ELSE 0 END) as absent,
         COUNT(ar.id) as total
       FROM attendance_sessions s
       JOIN attendance_records ar ON ar.session_id = s.id
       INNER JOIN students st ON st.id = ar.student_id
       GROUP BY s.id
       ORDER BY s.date DESC;`,
      [],
    );
  },

  async getStudentAttendance(studentId: string) {
    const db = await dbPromise;
    return db.getAllAsync<{
      date: string;
      class_name: string;
      status: string;
      method: string;
      marked_at: string;
    }>(
      `SELECT
         s.date,
         s.class_name,
         ar.status,
         ar.method,
         ar.marked_at
       FROM attendance_records ar
       JOIN attendance_sessions s ON ar.session_id = s.id
       WHERE ar.student_id = ?
       ORDER BY s.date DESC, ar.marked_at DESC;`,
      [studentId],
    );
  },

  async getClassAttendanceHistory(className: string) {
    const db = await dbPromise;
    return db.getAllAsync<{
      session_id: string;
      date: string;
      class_name: string;
      present: number;
      absent: number;
      total: number;
    }>(
      `SELECT
         s.id as session_id,
         s.date,
         s.class_name,
         SUM(CASE WHEN ar.status IN ('present', 'Present', 'Verified') THEN 1 ELSE 0 END) as present,
         SUM(CASE WHEN ar.status IN ('absent', 'Absent') THEN 1 ELSE 0 END) as absent,
         COUNT(ar.id) as total
       FROM attendance_sessions s
       JOIN attendance_records ar ON ar.session_id = s.id
       WHERE s.class_name = ?
       GROUP BY s.id
       ORDER BY s.date DESC;`,
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
    records: AttendanceRecord[],
  ) {
    const db = await dbPromise;
    await db.withTransactionAsync(async () => {
      for (const record of records) {
        if (record.status !== "absent") continue;

        await db.runAsync(
          `INSERT INTO notifications (user_id, role, title_mr, body_mr)
           VALUES (?, 'parent', ?, ?);`,
          [
            record.student_id,
            "विद्यार्थी अनुपस्थित आहे",
            "आज तुमचा विद्यार्थी अनुपस्थित आहे. कृपया शाळेशी संपर्क करा.",
          ],
        );
      }
    });
  },

  async getParentNotifications() {
    const db = await dbPromise;
    return db.getAllAsync<{
      id: number;
      title_mr: string;
      body_mr: string;
      created_at: string;
    }>(
      `SELECT id, title_mr, body_mr, created_at
       FROM notifications
       WHERE role = 'parent'
       ORDER BY created_at DESC;`,
      [],
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
};
