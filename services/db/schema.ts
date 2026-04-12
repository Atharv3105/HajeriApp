import * as SQLite from 'expo-sqlite';

export const dbPromise = SQLite.openDatabaseAsync('hajeri.db');

export const initDB = async () => {
  const db = await dbPromise;

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Define tables in a single batch script for efficiency
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
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      face_embedding BLOB,
      pin_hash TEXT,
      role TEXT DEFAULT 'teacher',
      FOREIGN KEY (school_id) REFERENCES schools(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      teacher_id TEXT,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      name TEXT NOT NULL,
      roll_number INTEGER NOT NULL,
      face_embedding BLOB,
      voice_embedding BLOB,
      parent_phone TEXT,
      scholarship_eligible BOOLEAN DEFAULT 1,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      UNIQUE(class_id, roll_number)
    );

    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      date TEXT NOT NULL,
      started_at TEXT DEFAULT (datetime('now', 'localtime')),
      ended_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('present','absent','leave','late')),
      method TEXT CHECK(method IN ('face','voice','manual','approved_leave')),
      marked_at TEXT DEFAULT (datetime('now', 'localtime')),
      sms_sent BOOLEAN DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
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
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      role TEXT,
      title_mr TEXT,
      body_mr TEXT,
      read BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload JSON,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS bus_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_name TEXT NOT NULL UNIQUE,
      status TEXT CHECK(status IN ('on_time','delayed')) NOT NULL DEFAULT 'on_time',
      delay_minutes INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_details TEXT NOT NULL,
      is_eligible BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id TEXT NOT NULL,
      sender_role TEXT CHECK(sender_role IN ('teacher','parent')) NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS timetable_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      period_number INTEGER NOT NULL,
      subject TEXT NOT NULL,
      teacher_name TEXT,
      room TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records (session_id);
    CREATE INDEX IF NOT EXISTS idx_sync_created ON sync_queue (created_at);
    CREATE INDEX IF NOT EXISTS idx_students_class ON students (class_id);
    CREATE INDEX IF NOT EXISTS idx_timetable_class_day ON timetable_entries (class_id, day_of_week, period_number);
  `;

  try {
    await db.execAsync(schema);
    
    // Check if we need to insert mock data (if schools is empty)
    const countResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM schools;');
    if (countResult?.count === 0) {
      await db.execAsync(`
        INSERT INTO schools (id, name, district, taluka, udise_code) 
        VALUES ('S001', 'Zilla Parishad Primary School', 'Latur', 'Latur', '27280100101');
        
        INSERT INTO teachers (id, school_id, name, phone, pin_hash, role)
        VALUES ('T001', 'S001', 'Arjun Patil', '9876543210', '1234', 'teacher');
        
        INSERT INTO classes (id, school_id, grade, section, teacher_id)
        VALUES ('C001', 'S001', '4th', 'A', 'T001');
        
        INSERT INTO students (id, school_id, class_id, name, roll_number, parent_phone)
        VALUES 
          ('ST001', 'S001', 'C001', 'Akshara Patil', 1, '9876543211'),
          ('ST002', 'S001', 'C001', 'Rahul Deshmukh', 2, '9876543212'),
          ('ST003', 'S001', 'C001', 'Siddharth More', 3, '9876543213'),
          ('ST004', 'S001', 'C001', 'Priya Shinde', 4, '9876543214'),
          ('ST005', 'S001', 'C001', 'Vivek Pawar', 5, '9876543215');
      `);
      console.log('Mock data seeded successfully');
    }

    const featureCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM bus_status;",
    );
    if ((featureCount?.count || 0) === 0) {
      await db.execAsync(`
        INSERT INTO bus_status (route_name, status, delay_minutes)
        VALUES
          ('Route 1', 'on_time', 0),
          ('Route 2', 'delayed', 10);

        INSERT INTO meal_plans (date, meal_details, is_eligible)
        VALUES
          (date('now', 'localtime'), 'Khichdi and banana', 1),
          (date('now', 'localtime', '-1 day'), 'Dal rice and egg', 1);

        INSERT INTO notices (title, content)
        VALUES
          ('Parent Meeting', 'Parent meeting scheduled on Saturday at 11:00 AM.'),
          ('Sports Day', 'Sports practice starts from next Monday.');

        INSERT INTO messages (sender_id, sender_role, content)
        VALUES
          ('T001', 'teacher', 'Please ensure regular attendance this week.'),
          ('P001', 'parent', 'Noted sir, thank you for the update.');

        INSERT INTO timetable_entries (class_id, day_of_week, period_number, subject, teacher_name, room)
        VALUES
          ('C001', 'Monday', 1, 'Marathi', 'Arjun Patil', 'Room 4A'),
          ('C001', 'Monday', 2, 'Mathematics', 'Arjun Patil', 'Room 4A'),
          ('C001', 'Monday', 3, 'Science', 'Arjun Patil', 'Room 4A'),
          ('C001', 'Tuesday', 1, 'English', 'Arjun Patil', 'Room 4A'),
          ('C001', 'Tuesday', 2, 'Mathematics', 'Arjun Patil', 'Room 4A'),
          ('C001', 'Tuesday', 3, 'EVS', 'Arjun Patil', 'Room 4A');
      `);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};
