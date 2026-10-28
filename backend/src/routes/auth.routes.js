const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// Google OAuth only - no email/password to prevent spam
router.get('/google', ctrl.googleAuth);
router.get('/google/callback', ctrl.googleCallback);

// Refresh token - extends session
router.post('/refresh', ctrl.refreshToken);

// Protected routes
router.get('/me', authMiddleware, ctrl.me);
router.post('/logout', ctrl.logout);

module.exports = router;