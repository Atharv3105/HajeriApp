import * as SQLite from "expo-sqlite";

export type Student = {
  id: string;
  name: string;
  className: string;
  rollNumber: number;
  parentPhone?: string;
  faceData: string;
  pin?: string;
};

export type Teacher = {
  id: string;
  name: string;
  phone: string;
  pin: string;
  faceData?: string;
};

export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  time: string;
  status: "Present" | "Absent" | "Verified";
  confidence: number;
  className: string;
  timeSlot: string;
};

const dbPromise = SQLite.openDatabaseAsync("attendance.db");

// ... (seedStudents remains for now, but we'll stop using it if the user wants "De-dummy")

export const initDB = async () => {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      className TEXT NOT NULL,
      rollNumber INTEGER NOT NULL,
      parentPhone TEXT,
      faceData TEXT,
      pin TEXT
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      faceData TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT NOT NULL,
      confidence REAL,
      className TEXT,
      timeSlot TEXT,
      FOREIGN KEY (studentId) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      studentId TEXT,
      FOREIGN KEY (studentId) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      subject TEXT NOT NULL,
      marks INTEGER NOT NULL,
      totalMarks INTEGER NOT NULL,
      examType TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students(id)
    );
  `);

  // Migration for existing tables
  try {
    await db.execAsync("ALTER TABLE students ADD COLUMN pin TEXT;");
  } catch(e) {}
  try {
    await db.execAsync("ALTER TABLE attendance ADD COLUMN className TEXT;");
  } catch(e) {}
  try {
    await db.execAsync("ALTER TABLE attendance ADD COLUMN timeSlot TEXT;");
  } catch(e) {}

  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM students;",
  );
  // Manual seeding removed as requested. User will add students manually.
};

// --- Student Methods ---

export const getStudents = async (): Promise<Student[]> => {
  const db = await dbPromise;
  return db.getAllAsync<Student>(
    "SELECT * FROM students ORDER BY rollNumber ASC;",
  );
};

export const getStudentsByClass = async (className: string): Promise<Student[]> => {
  const db = await dbPromise;
  return db.getAllAsync<Student>(
    "SELECT * FROM students WHERE className = ? ORDER BY rollNumber ASC;",
    [className]
  );
};

export const getStudentById = async (id: string): Promise<Student | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<Student>("SELECT * FROM students WHERE id = ?;", [
    id,
  ]);
};

export const findStudentByPIN = async (pin: string): Promise<Student | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<Student>("SELECT * FROM students WHERE pin = ?;", [
    pin,
  ]);
};

export const findStudentByNameAndRoll = async (name: string, rollNumber: number): Promise<Student | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<Student>(
    "SELECT * FROM students WHERE name = ? AND rollNumber = ?;",
    [name, rollNumber]
  );
};

export const addStudent = async (student: Student) => {
  const db = await dbPromise;
  await db.runAsync(
    "INSERT INTO students (id, name, className, rollNumber, parentPhone, faceData, pin) VALUES (?, ?, ?, ?, ?, ?, ?);",
    [
      student.id,
      student.name,
      student.className,
      student.rollNumber,
      student.parentPhone || null,
      student.faceData,
      student.pin || null,
    ],
  );
};

export const updateStudent = async (student: Student) => {
  const db = await dbPromise;
  await db.runAsync(
    "UPDATE students SET name = ?, className = ?, rollNumber = ?, parentPhone = ?, faceData = ?, pin = ? WHERE id = ?;",
    [
      student.name,
      student.className,
      student.rollNumber,
      student.parentPhone || null,
      student.faceData,
      student.pin || null,
      student.id,
    ],
  );
};

export const deleteStudent = async (id: string) => {
  const db = await dbPromise;
  await db.runAsync("DELETE FROM students WHERE id = ?;", [id]);
};

// --- Teacher Methods ---

export const getTeachers = async (): Promise<Teacher[]> => {
  const db = await dbPromise;
  return db.getAllAsync<Teacher>("SELECT * FROM teachers;");
};

export const addTeacher = async (teacher: Teacher) => {
  const db = await dbPromise;
  await db.runAsync(
    "INSERT INTO teachers (id, name, phone, pin, faceData) VALUES (?, ?, ?, ?, ?);",
    [teacher.id, teacher.name, teacher.phone, teacher.pin, teacher.faceData || null]
  );
};

export const findTeacherByPhone = async (phone: string): Promise<Teacher | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<Teacher>("SELECT * FROM teachers WHERE phone = ?;", [phone]);
};

export const getTeacherById = async (id: string): Promise<Teacher | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<Teacher>("SELECT * FROM teachers WHERE id = ?;", [id]);
};

// --- Parent Methods ---

export const addParent = async (parent: { id: string; name: string; phone: string; pin: string; studentId?: string }) => {
  const db = await dbPromise;
  await db.runAsync(
    "INSERT INTO parents (id, name, phone, pin, studentId) VALUES (?, ?, ?, ?, ?);",
    [parent.id, parent.name, parent.phone, parent.pin, parent.studentId || null]
  );
};

export const findParentByPhone = async (phone: string): Promise<any | null> => {
  const db = await dbPromise;
  return db.getFirstAsync<any>("SELECT * FROM parents WHERE phone = ?;", [phone]);
};

export const findStudentsByParentPhone = async (phone: string): Promise<Student[]> => {
  const db = await dbPromise;
  return db.getAllAsync<Student>("SELECT * FROM students WHERE parentPhone = ?;", [phone]);
};

// --- Grade Methods ---

export const addGrade = async (grade: { id: string; studentId: string; subject: string; marks: number; totalMarks: number; examType: string; date: string }) => {
  const db = await dbPromise;
  await db.runAsync(
    "INSERT INTO grades (id, studentId, subject, marks, totalMarks, examType, date) VALUES (?, ?, ?, ?, ?, ?, ?);",
    [grade.id, grade.studentId, grade.subject, grade.marks, grade.totalMarks, grade.examType, grade.date]
  );
};

export const getGradesForStudent = async (studentId: string) => {
  const db = await dbPromise;
  return db.getAllAsync<any>("SELECT * FROM grades WHERE studentId = ? ORDER BY date DESC;", [studentId]);
};

// --- Attendance Methods ---

export const getAttendance = async (
  date: string,
): Promise<AttendanceRecord[]> => {
  const db = await dbPromise;
  return db.getAllAsync<AttendanceRecord>(
    "SELECT * FROM attendance WHERE date = ?;",
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
    `SELECT date, className, timeSlot,
            SUM(CASE WHEN status = 'Present' OR status = 'Verified' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
            COUNT(*) as total
     FROM attendance
     GROUP BY date, className, timeSlot
     ORDER BY date DESC, timeSlot DESC;`,
  );
  return rows;
};

export const saveAttendanceRecord = async (record: AttendanceRecord) => {
  const db = await dbPromise;
  await db.runAsync(
    "INSERT OR REPLACE INTO attendance (id, studentId, date, time, status, confidence, className, timeSlot) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
    [
      record.id,
      record.studentId,
      record.date,
      record.time,
      record.status,
      record.confidence,
      record.className,
      record.timeSlot,
    ],
  );
};

export const bulkSaveAttendance = async (records: AttendanceRecord[]) => {
  const db = await dbPromise;
  await db.execAsync("BEGIN TRANSACTION;");
  try {
    const query = "INSERT OR REPLACE INTO attendance (id, studentId, date, time, status, confidence, className, timeSlot) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    for (const record of records) {
      await db.runAsync(query, [
        record.id,
        record.studentId,
        record.date,
        record.time,
        record.status,
        record.confidence,
        record.className,
        record.timeSlot,
      ]);
    }
    await db.execAsync("COMMIT;");
  } catch (e) {
    await db.execAsync("ROLLBACK;");
    throw e;
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
