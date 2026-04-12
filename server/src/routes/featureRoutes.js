const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { LeaveRequest, Notice, MealPlan, BusStatus, Message, Student } = require('../models');

// Leave Requests
router.get('/leaves', async (req, res) => {
  try {
    const leaves = await LeaveRequest.findAll({ include: [Student] });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/leaves', async (req, res) => {
  try {
    const { start_date, end_date, reason, StudentId } = req.body;
    const leave = await LeaveRequest.create({
      id: uuidv4(),
      start_date,
      end_date,
      reason,
      StudentId
    });
    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/leaves/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Not found' });
    leave.status = status;
    await leave.save();
    res.json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notices
router.get('/notices', async (req, res) => {
  try {
    const notices = await Notice.findAll({ order: [['date', 'DESC']] });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notices', async (req, res) => {
  try {
    const { title, content } = req.body;
    const notice = await Notice.create({ id: uuidv4(), title, content });
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meal Plans
router.get('/meals', async (req, res) => {
  try {
    const meals = await MealPlan.findAll({ order: [['date', 'DESC']] });
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/meals', async (req, res) => {
  try {
    const { date, meal_details, is_eligible } = req.body;
    const meal = await MealPlan.create({ id: uuidv4(), date, meal_details, is_eligible });
    res.status(201).json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bus Status
router.get('/bus', async (req, res) => {
  try {
    const buses = await BusStatus.findAll();
    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bus', async (req, res) => {
  try {
    const { route_name, status, delay_minutes } = req.body;
    // Overwrite existing or create new for the route
    let bus = await BusStatus.findOne({ where: { route_name } });
    if (bus) {
      bus.status = status;
      bus.delay_minutes = delay_minutes;
      bus.updated_at = new Date();
      await bus.save();
    } else {
      bus = await BusStatus.create({ id: uuidv4(), route_name, status, delay_minutes });
    }
    res.json(bus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.findAll({ order: [['timestamp', 'ASC']] });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const { sender_id, sender_role, content } = req.body;
    const msg = await Message.create({ id: uuidv4(), sender_id, sender_role, content });
    res.status(201).json(msg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
