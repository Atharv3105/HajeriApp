const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

router.post('/push', syncController.pushSync);

module.exports = router;
