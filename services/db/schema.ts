import * as SQLite from 'expo-sqlite';

export const dbPromise = SQLite.openDatabaseAsync('hajeri.db');

export const initDB = async () => {
  const db = await dbPromise;

  // GLOBAL STABILITY MODE: Disable constraints that cause environment crashes
  await db.execAsync("PRAGMA foreign_keys = OFF;");
  await db.execAsync("PRAGMA journal_mode = WAL;"); // Improved concurrency

  // SURGICAL RECONSTRUCTION: Fix "DNA" of the table if corrupted from older versions
  try {
      const tableInfo = await db.getAllAsync<{ name: string, type: string, notnull: number }>("PRAGMA table_info(attendance_records);");
      const studentIdCol = tableInfo.find(c => c.name === 'student_id');
      
      // If student_id is NOT NULL (from old schema) or table needs sync, rebuild for stability
      if (studentIdCol && studentIdCol.notnull === 1) {
          console.log('[Schema] Corrupted table detected. Rebuilding attendance_records...');
          await db.execAsync(`
              ALTER TABLE attendance_records RENAME TO attendance_records_old;
              CREATE TABLE attendance_records (
                  id TEXT PRIMARY KEY,
                  session_id TEXT,
                  student_id TEXT,
                  date TEXT,
                  time TEXT,
                  status TEXT,
                  method TEXT,
                  marked_at TEXT DEFAULT (datetime('now', 'localtime')),
                  confidence REAL DEFAULT 1.0,
                  class_name TEXT,
                  time_slot TEXT
              );
              INSERT INTO attendance_records (id, session_id, student_id, date, time, status, method, marked_at, confidence, class_name, time_slot)
              SELECT id, session_id, student_id, date, time, status, method, marked_at, confidence, class_name, time_slot FROM attendance_records_old;
              DROP TABLE attendance_records_old;
          `);
          console.log('[Schema] Attendance Reconstruction Complete.');
      }
  } catch (e) {
      console.log('[Schema] Table healthy or not yet created.');
  }

  // Tables
  const schema = `
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      district TEXT,
      taluka TEXT,
      udise_code TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      school_id TEXT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      face_embedding TEXT,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    );

    -- Students
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      roll_number INTEGER,
      class_name TEXT,
      face_embedding TEXT
    );

    -- Attendance Sessions (Daily Snapshots)
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id TEXT PRIMARY KEY,
      teacher_id TEXT,
      class_name TEXT NOT NULL,
      date TEXT NOT NULL,
      time_slot TEXT,
      sync_status TEXT DEFAULT 'pending',
      marked_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );

    -- Attendance Records (Individual Status)
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      student_id TEXT,
      date TEXT,
      time TEXT,
      status TEXT,
      method TEXT,
      marked_at TEXT DEFAULT (datetime('now', 'localtime')),
      confidence REAL DEFAULT 1.0,
      class_name TEXT,
      time_slot TEXT
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_name TEXT NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      reason_code TEXT,
      reason_text TEXT,
      status TEXT CHECK(status IN ('pending','parent_approved','teacher_approved','rejected')),
      parent_approved_at TEXT,
      teacher_approved_at TEXT,
      rejected_by TEXT,
      rejected_reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS timetable_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_name TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      period_number INTEGER NOT NULL,
      subject TEXT NOT NULL,
      teacher_name TEXT,
      room TEXT
    );

    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      marks INTEGER NOT NULL,
      total_marks INTEGER NOT NULL,
      exam_type TEXT,
      date TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS bus_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_name TEXT NOT NULL UNIQUE,
      status TEXT CHECK(status IN ('on_time','delayed')) NOT NULL DEFAULT 'on_time',
      delay_minutes INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_records_student ON attendance_records (student_id);
    CREATE INDEX IF NOT EXISTS idx_students_class ON students (class_name);
  `;

  try {
    // 1. Create tables
    await db.execAsync(schema);

    // 2. Migration Doctor: Add missing columns to existing tables
    const migrations = [
      { table: 'teachers', column: 'pin', type: 'TEXT' },
      { table: 'teachers', column: 'face_data', type: 'TEXT' },
      { table: 'students', column: 'pin', type: 'TEXT' },
      { table: 'students', column: 'face_data', type: 'TEXT' },
      { table: 'students', column: 'parent_phone', type: 'TEXT' },
      { table: 'students', column: 'class_name', type: 'TEXT' },
      { table: 'students', column: 'roll_number', type: 'INTEGER' },
      { table: 'attendance_records', column: 'confidence', type: 'REAL' },
      { table: 'attendance_records', column: 'class_name', type: 'TEXT' },
      { table: 'attendance_records', column: 'time_slot', type: 'TEXT' },
      { table: 'attendance_records', column: 'date', type: 'TEXT' },
      { table: 'attendance_records', column: 'time', type: 'TEXT' },
      { table: 'attendance_records', column: 'session_id', type: 'TEXT' },
      { table: 'attendance_sessions', column: 'date', type: 'TEXT' },
      { table: 'students', column: 'class_id', type: 'TEXT DEFAULT "N/A"' },
    ];

    for (const m of migrations) {
      try {
          await db.execAsync(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type};`);
          console.log(`[Migration] Added ${m.column} to ${m.table}`);
      } catch (e) {
          // Column already exists, ignore
      }
    }

    // 3. Global Data Cleanup (Garbage Collector for "Raw Data" mode)
    // This removes legacy dummy data from earlier versions
    try {
        await db.execAsync(`
            DELETE FROM students WHERE id LIKE 'DUMMY-%' OR id LIKE 'STD-%' OR name LIKE '%Dummy%' or name LIKE '%Test%';
            DELETE FROM attendance_records WHERE student_id NOT IN (SELECT id FROM students) AND student_id NOT IN (SELECT id FROM teachers);
            DELETE FROM attendance_sessions WHERE teacher_id NOT IN (SELECT id FROM teachers);
        `);
        console.log('[Cleanup] Legacy dummy data purged.');
    } catch (e) {
        console.warn('[Cleanup] Minor issue during data purge (likely already clean)');
    }

    // 4. Seed Static Data
    const countResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM schools;');
    if (countResult?.count === 0) {
      await db.execAsync(`
        INSERT INTO schools (id, name, district, taluka, udise_code) 
        VALUES ('S001', 'Zilla Parishad Primary School', 'Latur', 'Latur', '27280100101');
      `);
      console.log('Static school data seeded');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};
