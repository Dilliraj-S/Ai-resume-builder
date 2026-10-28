const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analytics.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

// All analytics routes require authentication
router.get('/stats',     authMiddleware, ctrl.getStats);
router.get('/daily',    authMiddleware, ctrl.getAnalytics);

module.exports = router;
