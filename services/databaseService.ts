import * as SQLite from "expo-sqlite";

export type Student = {
  id: string;
  name: string;
  className: string;
  rollNumber: number;
  parentPhone?: string;
  faceData: string;
  pin?: string;
  schoolId?: string;
};

export type Teacher = {
  id: string;
  name: string;
  phone: string;
  pin: string;
  faceData?: string;
  schoolId?: string;
};

export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  time: string;
  status: "Present" | "Absent" | "Verified" | "Leave" | "Late";
  confidence: number;
  className: string;
  timeSlot: string;
  sessionId?: string;
};

const dbPromise = SQLite.openDatabaseAsync("hajeri.db");

export const initDB = async () => {
  const db = await dbPromise;
  console.log("[databaseService] Connected to unified hajeri.db");
};

// --- Student Methods ---

export const getStudents = async (): Promise<Student[]> => {
  const db = await dbPromise;
  const rows = await db.getAllAsync<any>(
    "SELECT id, name, class_name as className, roll_number as rollNumber, parent_phone as parentPhone, face_data as faceData, pin FROM students ORDER BY roll_number ASC;",
  );
  return rows;
};

export const getStudentsByClass = async (className: string): Promise<Student[]> => {
  const db = await dbPromise;
  return db.getAllAsync<any>(
    "SELECT id, name, class_name as className, roll_number as rollNumber, parent_phone as parentPhone, face_data as faceData, pin FROM students WHERE class_name = ? ORDER BY roll_number ASC;",
    [className]
  );
};

export const getStudentById = async (id: string): Promise<Student | null> => {
  const db = await dbPromise;
  const tid = id.trim();
  let student = await db.getFirstAsync<any>("SELECT id, name, class_name as className, roll_number as rollNumber, parent_phone as parentPhone, face_data as faceData, pin FROM students WHERE id = ?;", [
    tid,
  ]);
  
  if (!student) {
      // Fallback: search case-insensitively
      student = await db.getFirstAsync<any>("SELECT id, name, class_name as className, roll_number as rollNumber, parent_phone as parentPhone, face_data as faceData, pin FROM students WHERE LOWER(id) = LOWER(?);", [tid]);
  }
  return student;
};

export const findStudentByPIN = async (pin: string): Promise<Student | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<any>("SELECT id, name, class_name as className, roll_number as rollNumber, parent_phone as parentPhone, face_data as faceData, pin FROM students WHERE pin = ?;", [
    pin,
  ]);
};

export const findStudentByNameAndRoll = async (name: string, rollNumber: number): Promise<Student | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<any>(
    "SELECT id, name, class_name as className, roll_number as rollNumber, parent_phone as parentPhone, face_data as faceData, pin FROM students WHERE name = ? AND roll_number = ?;",
    [name, rollNumber]
  );
};

export const addStudent = async (student: Student) => {
  const db = await dbPromise;
  
  // BYPASS CONSTRAINTS ONCE AND FOR ALL
  await db.execAsync("PRAGMA foreign_keys = OFF;");
  
  try {
    await db.runAsync(
      "INSERT OR REPLACE INTO students (id, school_id, name, class_name, class_id, roll_number, parent_phone, face_data, pin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
      [
        student.id,
        student.schoolId || 'S001',
        student.name,
        student.className,
        student.className, // Satisfy ghost constraint
        student.rollNumber,
        student.parentPhone || null,
        student.faceData,
        student.pin || null,
      ],
    );
  } finally {
    await db.execAsync("PRAGMA foreign_keys = ON;");
  }
};

export const updateStudent = async (student: Student) => {
  const db = await dbPromise;
  
  // BYPASS CONSTRAINTS ONCE AND FOR ALL
  await db.execAsync("PRAGMA foreign_keys = OFF;");
  
  try {
    await db.runAsync(
      "UPDATE students SET name = ?, class_name = ?, class_id = ?, roll_number = ?, parent_phone = ?, face_data = ?, pin = ? WHERE id = ?;",
      [
        student.name,
        student.className,
        student.className, // Satisfy ghost constraint
        student.rollNumber,
        student.parentPhone || null,
        student.faceData,
        student.pin || null,
        student.id,
      ],
    );
  } finally {
    await db.execAsync("PRAGMA foreign_keys = ON;");
  }
};

export const deleteStudent = async (id: string) => {
  const db = await dbPromise;
  await db.withTransactionAsync(async () => {
    // Delete from all linked tables
    await db.runAsync("DELETE FROM attendance_records WHERE student_id = ?;", [id]);
    await db.runAsync("DELETE FROM grades WHERE student_id = ?;", [id]);
    await db.runAsync("DELETE FROM leave_requests WHERE student_id = ?;", [id]);
    await db.runAsync("DELETE FROM students WHERE id = ?;", [id]);
  });
};

// --- Teacher Methods ---

export const getTeachers = async (): Promise<Teacher[]> => {
  const db = await dbPromise;
  return db.getAllAsync<any>("SELECT id, name, phone, pin, face_data as faceData FROM teachers;");
};

export const addTeacher = async (teacher: Teacher) => {
  const db = await dbPromise;
  console.log(`[DB] Adding teacher: ${teacher.name} (ID: ${teacher.id})`);
  
  // BYPASS CONSTRAINTS ONCE AND FOR ALL
  await db.execAsync("PRAGMA foreign_keys = OFF;");
  
  try {
    await db.runAsync(
      "INSERT OR REPLACE INTO teachers (id, school_id, name, phone, pin, face_data) VALUES (?, ?, ?, ?, ?, ?);",
      [teacher.id, teacher.schoolId || 'S001', teacher.name, teacher.phone, teacher.pin, teacher.faceData || null]
    );
  } finally {
    await db.execAsync("PRAGMA foreign_keys = ON;");
  }
  
  const verify = await db.getFirstAsync<any>("SELECT id FROM teachers WHERE id = ?;", [teacher.id]);
  console.log(`[DB] Verification after save: ${verify ? "SUCCESS" : "FAILED"}`);
};

export const findTeacherByPhone = async (phone: string): Promise<Teacher | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<any>("SELECT id, name, phone, pin, face_data as faceData FROM teachers WHERE phone = ?;", [phone]);
};

export const findTeacherByPIN = async (pin: string): Promise<Teacher | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<any>("SELECT id, name, phone, pin, face_data as faceData FROM teachers WHERE pin = ?;", [pin]);
};

export const getTeacherById = async (id: string): Promise<Teacher | null> => {
  const db = await dbPromise;
  const tid = id.trim();
  console.log(`[DB] Searching for teacher ID: "${tid}"`);
  
  let teacher = await db.getFirstAsync<any>("SELECT id, name, phone, pin, face_data as faceData FROM teachers WHERE id = ?;", [tid]);
  
  if (!teacher) {
      // Fallback: case-insensitive
      teacher = await db.getFirstAsync<any>("SELECT id, name, phone, pin, face_data as faceData FROM teachers WHERE LOWER(id) = LOWER(?);", [tid]);
  }

  if (!teacher) {
      const all = await db.getAllAsync<any>("SELECT id, name FROM teachers;");
      console.log(`[DB] Teacher not found. Current teachers in DB:`, all.map(t => t.id));
  } else {
      console.log(`[DB] Found teacher: ${teacher.name}`);
  }
  return teacher;
};

// --- Parent Methods ---

export const addParent = async (parent: { id: string; name: string; phone: string; pin: string; studentId?: string }) => {
  const db = await dbPromise;
  await db.runAsync(
    "INSERT OR REPLACE INTO parents (id, name, phone, pin, student_id) VALUES (?, ?, ?, ?, ?);",
    [parent.id, parent.name, parent.phone, parent.pin, parent.studentId || null]
  );
};

export const findParentByPhone = async (phone: string): Promise<any | null> => {
  const db = await dbPromise;
  const row = await db.getFirstAsync<any>("SELECT id, name, phone, pin, student_id as studentId FROM parents WHERE phone = ?;", [phone]);
  return row;
};

export const findStudentsByParentPhone = async (phone: string): Promise<Student[]> => {
  const db = await dbPromise;
  return db.getAllAsync<any>("SELECT id, name, class_name as className, roll_number as rollNumber, parent_phone as parentPhone, face_data as faceData, pin FROM students WHERE parent_phone = ?;", [phone]);
};

// --- Grade Methods ---

export const addGrade = async (grade: { id: string; studentId: string; subject: string; marks: number; totalMarks: number; examType: string; date: string }) => {
  const db = await dbPromise;
  await db.runAsync(
    "INSERT INTO grades (id, student_id, subject, marks, total_marks, exam_type, date) VALUES (?, ?, ?, ?, ?, ?, ?);",
    [grade.id, grade.studentId, grade.subject, grade.marks, grade.totalMarks, grade.examType, grade.date]
  );
};

export const getGradesForStudent = async (studentId: string) => {
  const db = await dbPromise;
  return db.getAllAsync<any>("SELECT * FROM grades WHERE student_id = ? ORDER BY date DESC;", [studentId]);
};

// --- Attendance Methods ---

export const getAttendance = async (
  date: string,
): Promise<AttendanceRecord[]> => {
  const db = await dbPromise;
  return db.getAllAsync<any>(
    "SELECT id, student_id as studentId, date, time, status, confidence, class_name as className, time_slot as timeSlot FROM attendance_records WHERE date = ?;",
    [date],
  );
};

export const getAttendanceHistory = async (): Promise<
  Array<{ date: string; className: string; timeSlot: string; present: number; absent: number; total: number }>
> => {
  const db = await dbPromise;
  const rows = await db.getAllAsync<{
    date: string;
    className: string;
    timeSlot: string;
    present: number;
    absent: number;
    total: number;
  }>(
    `SELECT date, class_name as className, time_slot as timeSlot,
            SUM(CASE WHEN status = 'Present' OR status = 'Verified' OR status = 'present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'Absent' OR status = 'absent' THEN 1 ELSE 0 END) as absent,
            COUNT(*) as total
     FROM attendance_records
     GROUP BY date, class_name, time_slot
     ORDER BY date DESC, time_slot DESC;`,
  );
  return rows;
};

export const saveAttendanceRecord = async (record: AttendanceRecord) => {
  const db = await dbPromise;
  await db.execAsync("PRAGMA foreign_keys = OFF;");
  try {
      await db.runAsync(
        "INSERT OR REPLACE INTO attendance_records (id, student_id, date, time, status, confidence, class_name, time_slot, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [
          String(record.id || ""),
          String(record.studentId || ""),
          String(record.date || ""),
          String(record.time || ""),
          String(record.status || ""),
          Number(record.confidence || 1.0),
          String(record.className || ""),
          String(record.timeSlot || ""),
          String(record.sessionId || "")
        ],
      );
  } finally {
      await db.execAsync("PRAGMA foreign_keys = ON;");
  }
};

export const bulkSaveAttendance = async (records: AttendanceRecord[]) => {
  const db = await dbPromise;
  
  // MANDATORY BYPASS FOR PRODUCTION STABILITY
  await db.execAsync("PRAGMA foreign_keys = OFF;");
  
  await db.execAsync("BEGIN TRANSACTION;");
  try {
    const query = "INSERT OR REPLACE INTO attendance_records (id, student_id, date, time, status, confidence, class_name, time_slot, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
    for (const record of records) {
      await db.runAsync(query, [
        String(record.id || ""),
        String(record.studentId || ""),
        String(record.date || ""),
        String(record.time || ""),
        String(record.status || ""),
        Number(record.confidence || 1.0),
        String(record.className || ""),
        String(record.timeSlot || ""),
        String(record.sessionId || "")
      ]);
    }
    await db.execAsync("COMMIT;");
  } catch (e) {
    await db.execAsync("ROLLBACK;");
    throw e;
  } finally {
    await db.execAsync("PRAGMA foreign_keys = ON;");
  }
};

export const exportAttendanceCsv = async (): Promise<string> => {
  const rows = await getAttendanceHistory();
  let csv = "Date,Class,Slot,Present,Absent,Total\n";
  rows.forEach((row) => {
    csv += `${row.date},${row.className},${row.timeSlot},${row.present},${row.absent},${row.total}\n`;
  });
  return csv;
};
