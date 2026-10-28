const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/resume.controller');
const { deviceMiddleware } = require('../middleware/deviceMiddleware');
const { resumeValidations } = require('../middleware/validators');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(deviceMiddleware);
router.use(authMiddleware);

// CRUD operations - IMPORTANT: specific routes before param routes
router.get('/my', ctrl.getUserResumes);
router.post('/', resumeValidations.create, ctrl.createResume);
router.get('/:id', resumeValidations.getById, ctrl.getResume);
router.put('/:id', resumeValidations.update, ctrl.updateResume);
router.delete('/:id', resumeValidations.delete, ctrl.deleteResume);
router.post('/:id/duplicate', resumeValidations.duplicate, ctrl.duplicateResume);

// ATS Scoring
router.post('/:id/ats-score', resumeValidations.atsScore, ctrl.getATSScore);

// Legacy endpoints
router.get('/session/:sessionId', ctrl.getSessionResumes);

module.exports = router;
