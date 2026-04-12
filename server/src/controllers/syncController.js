const { AttendanceRecord, AttendanceSession, Student, sequelize } = require('../models');

exports.pushSync = async (req, res) => {
  const { records } = req.body;
  const transaction = await sequelize.transaction();

  try {
    for (const record of records) {
      const payload = JSON.parse(record.payload);

      if (record.table_name === 'attendance_records') {
        // Find or create session
        const [session] = await AttendanceSession.findOrCreate({
          where: { id: record.record_id },
          defaults: { date: new Date(), SchoolId: payload.schoolId },
          transaction,
        });

        // Create record
        await AttendanceRecord.create({
          AttendanceSessionId: session.id,
          StudentId: payload.student_id,
          status: payload.status,
          method: payload.method,
          marked_at: payload.marked_at,
        }, { transaction });

        // Logic for SMS can be added here (Bull queue push)
      }
    }

    await transaction.commit();
    res.status(200).json({ success: true, accepted: records.length });
  } catch (error) {
    await transaction.rollback();
    console.error('Sync Error:', error);
    res.status(500).json({ success: false, message: 'Sync failed' });
  }
};
