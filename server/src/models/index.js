const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Use SQLite for local development if DATABASE_URL is not provided
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false,
    });

const School = sequelize.define('School', {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  udise_code: { type: DataTypes.STRING, unique: true },
});

const Teacher = sequelize.define('Teacher', {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, unique: true },
  pin_hash: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'teacher' },
  face_embedding: { type: DataTypes.TEXT }, 
});

const Student = sequelize.define('Student', {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  class_name: { type: DataTypes.STRING },
  roll_number: { type: DataTypes.INTEGER },
  parent_phone: { type: DataTypes.STRING },
  pin_hash: { type: DataTypes.STRING },
  face_embedding: { type: DataTypes.TEXT }, // JSON string of the 128-dimensional array
});

const AttendanceSession = sequelize.define('AttendanceSession', {
  id: { type: DataTypes.UUID, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  sync_status: { type: DataTypes.STRING, defaultValue: 'synced' },
});

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  status: { type: DataTypes.ENUM('present', 'absent', 'leave', 'late'), allowNull: false },
  method: { type: DataTypes.ENUM('face', 'voice', 'manual', 'approved_leave') },
  marked_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

const LeaveRequest = sequelize.define('LeaveRequest', {
  id: { type: DataTypes.UUID, primaryKey: true },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY, allowNull: false },
  reason: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
});

const Notice = sequelize.define('Notice', {
  id: { type: DataTypes.UUID, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
});

const MealPlan = sequelize.define('MealPlan', {
  id: { type: DataTypes.UUID, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  meal_details: { type: DataTypes.STRING, allowNull: false },
  is_eligible: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const BusStatus = sequelize.define('BusStatus', {
  id: { type: DataTypes.UUID, primaryKey: true },
  route_name: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('on_time', 'delayed', 'cancelled'), defaultValue: 'on_time' },
  delay_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

const Message = sequelize.define('Message', {
  id: { type: DataTypes.UUID, primaryKey: true },
  sender_id: { type: DataTypes.STRING, allowNull: false }, // Could be teacher or parent ID
  sender_role: { type: DataTypes.STRING, allowNull: false }, // 'teacher', 'parent'
  content: { type: DataTypes.TEXT, allowNull: false },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// Associations
Teacher.belongsTo(School);
Student.belongsTo(School);
AttendanceSession.belongsTo(School);
AttendanceRecord.belongsTo(AttendanceSession);
AttendanceRecord.belongsTo(Student);

LeaveRequest.belongsTo(Student);
Notice.belongsTo(School);
MealPlan.belongsTo(School);
BusStatus.belongsTo(School);

module.exports = {
  sequelize,
  School,
  Teacher,
  Student,
  AttendanceSession,
  AttendanceRecord,
  LeaveRequest,
  Notice,
  MealPlan,
  BusStatus,
  Message,
};
