const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ai.controller');
const { deviceMiddleware } = require('../middleware/deviceMiddleware');

router.use(deviceMiddleware);

router.post('/enhance-summary',     ctrl.enhanceSummary);
router.post('/enhance-experience',  ctrl.enhanceExperience);
router.post('/enhance-project',     ctrl.enhanceProject);
router.post('/enhance-internship',  ctrl.enhanceInternship);
router.post('/enhance-achievement', ctrl.enhanceAchievement);
router.post('/suggest-skills',      ctrl.suggestSkills);
router.post('/fix-grammar',         ctrl.fixGrammar);
router.get('/credits',              ctrl.getCredits);

module.exports = router;
