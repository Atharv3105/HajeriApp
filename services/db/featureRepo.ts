import { dbPromise } from "./schema";

export const featureRepo = {
  async getBusStatus() {
    const db = await dbPromise;
    return db.getAllAsync<{
      id: number;
      route_name: string;
      status: "on_time" | "delayed";
      delay_minutes: number;
      updated_at: string;
    }>(
      "SELECT id, route_name, status, delay_minutes, updated_at FROM bus_status ORDER BY route_name ASC",
      [],
    );
  },

  async updateBusStatus(
    routeName: string,
    status: "on_time" | "delayed",
    delayMinutes: number,
  ) {
    const db = await dbPromise;
    await db.runAsync(
      `INSERT INTO bus_status (route_name, status, delay_minutes, updated_at)
       VALUES (?, ?, ?, datetime('now', 'localtime'))
       ON CONFLICT(route_name)
       DO UPDATE SET status=excluded.status, delay_minutes=excluded.delay_minutes, updated_at=datetime('now', 'localtime')`,
      [routeName, status, delayMinutes],
    );
  },

  async getMeals() {
    const db = await dbPromise;
    return db.getAllAsync<{
      id: number;
      date: string;
      meal_details: string;
      is_eligible: number;
      created_at: string;
    }>(
      "SELECT id, date, meal_details, is_eligible, created_at FROM meal_plans ORDER BY date DESC, id DESC",
      [],
    );
  },

  async addMeal(date: string, mealDetails: string, isEligible = true) {
    const db = await dbPromise;
    await db.runAsync(
      "INSERT INTO meal_plans (date, meal_details, is_eligible) VALUES (?, ?, ?)",
      [date, mealDetails, isEligible ? 1 : 0],
    );
  },

  async getNotices() {
    const db = await dbPromise;
    return db.getAllAsync<{
      id: number;
      title: string;
      content: string;
      created_at: string;
    }>(
      "SELECT id, title, content, created_at FROM notices ORDER BY created_at DESC, id DESC",
      [],
    );
  },

  async addNotice(title: string, content: string) {
    const db = await dbPromise;
    await db.runAsync("INSERT INTO notices (title, content) VALUES (?, ?)", [
      title,
      content,
    ]);
  },

  async getMessages() {
    const db = await dbPromise;
    return db.getAllAsync<{
      id: number;
      sender_id: string;
      sender_role: "teacher" | "parent";
      content: string;
      timestamp: string;
    }>(
      "SELECT id, sender_id, sender_role, content, timestamp FROM messages ORDER BY datetime(timestamp) ASC, id ASC",
      [],
    );
  },

  async addMessage(
    senderId: string,
    senderRole: "teacher" | "parent",
    content: string,
  ) {
    const db = await dbPromise;
    await db.runAsync(
      "INSERT INTO messages (sender_id, sender_role, content) VALUES (?, ?, ?)",
      [senderId, senderRole, content],
    );
  },

  async getTimetableForClass(className: string) {
    const db = await dbPromise;
    return db.getAllAsync<{
      id: number;
      class_name: string;
      day_of_week: string;
      period_number: number;
      subject: string;
      teacher_name: string | null;
      room: string | null;
    }>(
      `SELECT id, class_name, day_of_week, period_number, subject, teacher_name, room
       FROM timetable_entries
       WHERE class_name = ?
       ORDER BY CASE day_of_week
         WHEN 'Monday' THEN 1
         WHEN 'Tuesday' THEN 2
         WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4
         WHEN 'Friday' THEN 5
         WHEN 'Saturday' THEN 6
         ELSE 7 END, period_number ASC`,
      [className],
    );
  },

  async addTimetableEntry(entry: {
    className: string;
    dayOfWeek: string;
    periodNumber: number;
    subject: string;
    teacherName?: string;
    room?: string;
  }) {
    const db = await dbPromise;
    await db.runAsync(
      `INSERT INTO timetable_entries (class_name, day_of_week, period_number, subject, teacher_name, room)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entry.className, entry.dayOfWeek, entry.periodNumber, entry.subject, entry.teacherName || null, entry.room || null]
    );
  },

  async deleteTimetableEntry(id: number) {
    const db = await dbPromise;
    await db.runAsync("DELETE FROM timetable_entries WHERE id = ?", [id]);
  },
};

