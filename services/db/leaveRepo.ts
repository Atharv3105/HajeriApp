import * as Crypto from "expo-crypto";
import { dbPromise } from "./schema";

export type LeaveStatus =
  | "pending"
  | "parent_approved"
  | "teacher_approved"
  | "rejected";

export const leaveRepo = {
  async getPendingForClass(className: string) {
    const db = await dbPromise;
    return db.getAllAsync<{
      id: string;
      student_id: string;
      student_name: string;
      reason_text: string | null;
      from_date: string;
      to_date: string;
      status: LeaveStatus;
      created_at: string;
    }>(
      `SELECT lr.id, lr.student_id, s.name as student_name, lr.reason_text, lr.from_date, lr.to_date, lr.status, lr.created_at
       FROM leave_requests lr
       JOIN students s ON s.id = lr.student_id
       WHERE lr.class_name = ? AND lr.status IN ('pending', 'parent_approved')
       ORDER BY lr.created_at DESC`,
      [className],
    );
  },

  async getPendingForStudent(studentId: string) {
    const db = await dbPromise;
    return db.getAllAsync<{
      id: string;
      student_id: string;
      student_name: string;
      reason_text: string | null;
      from_date: string;
      to_date: string;
      status: LeaveStatus;
      created_at: string;
    }>(
      `SELECT lr.id, lr.student_id, s.name as student_name, lr.reason_text, lr.from_date, lr.to_date, lr.status, lr.created_at
       FROM leave_requests lr
       JOIN students s ON s.id = lr.student_id
       WHERE lr.student_id = ? AND lr.status = 'pending'
       ORDER BY lr.created_at DESC`,
      [studentId],
    );
  },

  async submitRequest(
    studentId: string,
    className: string,
    fromDate: string,
    toDate: string,
    reasonCode: string,
    reasonText: string,
  ) {
    const db = await dbPromise;
    const id = Crypto.randomUUID();

    await db.runAsync(
      "INSERT INTO leave_requests (id, student_id, class_name, class_id, from_date, to_date, reason_code, reason_text, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        studentId,
        className,
        className, // class_id
        fromDate,
        toDate,
        reasonCode,
        reasonText,
        "pending",
      ],
    );

    // Add to sync queue
    await db.runAsync(
      "INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)",
      [
        "leave_requests",
        id,
        "create",
        JSON.stringify({ studentId, fromDate, toDate, reasonCode }),
      ],
    );

    return id;
  },

  async parentApprove(leaveId: string, customReason?: string) {
    const db = await dbPromise;
    const now = new Date().toISOString();

    if (customReason) {
      await db.runAsync(
        "UPDATE leave_requests SET status = ?, parent_approved_at = ?, reason_text = ? WHERE id = ?",
        ["parent_approved", now, customReason, leaveId],
      );
    } else {
      await db.runAsync(
        "UPDATE leave_requests SET status = ?, parent_approved_at = ? WHERE id = ?",
        ["parent_approved", now, leaveId],
      );
    }

    await db.runAsync(
      "INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)",
      [
        "leave_requests",
        leaveId,
        "update",
        JSON.stringify({ status: "parent_approved", reason_text: customReason }),
      ],
    );
  },

  async teacherApprove(leaveId: string) {
    const db = await dbPromise;
    const now = new Date().toISOString();

    // Use transaction to ensure attendance records are updated
    await db.withTransactionAsync(async () => {
      // 1. Get the leave details
      const leave = await db.getFirstAsync<{
        student_id: string;
        from_date: string;
        to_date: string;
      }>(
        "SELECT student_id, from_date, to_date FROM leave_requests WHERE id = ?",
        [leaveId],
      );

      if (!leave) return;

      // 2. Update status
      await db.runAsync(
        "UPDATE leave_requests SET status = ?, teacher_approved_at = ? WHERE id = ?",
        ["teacher_approved", now, leaveId],
      );

      // 3. Mark attendance_records as 'leave' for each date in range (simplified logic)
      // In a real app, this would iterate dates.
      await db.runAsync(
        "UPDATE attendance_records SET status = 'leave', method = 'approved_leave' WHERE student_id = ? AND marked_at BETWEEN ? AND ?",
        [leave.student_id, leave.from_date, leave.to_date],
      );

      await db.runAsync(
        "INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)",
        [
          "leave_requests",
          leaveId,
          "update",
          JSON.stringify({ status: "teacher_approved" }),
        ],
      );
    });
  },

  async reject(leaveId: string, reason: string, by: "parent" | "teacher") {
    const db = await dbPromise;

    await db.runAsync(
      "UPDATE leave_requests SET status = ?, rejected_by = ?, rejected_reason = ? WHERE id = ?",
      ["rejected", by, reason, leaveId],
    );
  },

  async getApprovedLeaveStudentIds(className: string, date: string): Promise<string[]> {
    const db = await dbPromise;
    const rows = await db.getAllAsync<{ student_id: string }>(
      `SELECT student_id FROM leave_requests 
       WHERE class_name = ? 
       AND status = 'teacher_approved' 
       AND ? BETWEEN from_date AND to_date`,
      [className, date],
    );
    return rows.map((r) => r.student_id);
  },
};
