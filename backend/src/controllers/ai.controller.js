const groqService = require('../services/groq.service');
const DeviceModel = require('../models/Device');
const ResumeModel = require('../models/Resume');
const logger = require('../utils/logger');

const logUsage = async (req, feature, tokensUsed) => {
  try {
    await ResumeModel.logAiUsage({
      resumeId: req.body.resumeId || null,
      sessionId: req.headers['x-session-id'] || null,
      deviceId: req.device?.deviceId || null,
      feature,
      tokensUsed,
    });
  } catch (e) {
    logger.warn('Failed to log AI usage:', e.message);
  }
};

const processWithCredits = async (req, res, next, aiAction) => {
  let creditsBefore = 0;
  try {
    creditsBefore = await DeviceModel.checkCredits(req.device.deviceId);

    if (creditsBefore <= 0) {
      return res.status(403).json({
        success: false,
        error: 'No AI credits remaining',
        code: 'NO_CREDITS',
        credits: 0,
      });
    }

    // Deduct credit BEFORE calling AI to prevent race condition
    const deducted = await DeviceModel.deductCredit(req.device.deviceId);
    if (!deducted) {
      return res.status(500).json({
        success: false,
        error: 'Failed to deduct credits',
      });
    }

    const result = await aiAction();

    // Log successful usage
    await logUsage(req, result.feature || 'general', result.tokensUsed || 0);

    res.json({
      success: true,
      data: { 
        content: result.content,
        parsed: result.parsed,
      },
      credits: {
        remaining: Math.max(0, creditsBefore - 1),
      },
    });
  } catch (error) {
    // Refund credit if AI call failed
    if (creditsBefore > 0) {
      await DeviceModel.addCredit(req.device.deviceId, 1);
      logger.info('Refunded 1 credit due to AI failure:', error.message);
    }
    next(error);
  }
};

exports.enhanceSummary = async (req, res, next) => {
  try {
    const { currentSummary, jobTitle, skills, experience } = req.body;
    if (!currentSummary || !currentSummary.trim()) {
      return res.status(400).json({ error: 'Please enter your summary first.' });
    }

    await processWithCredits(req, res, next, async () => {
      return await groqService.enhanceSummary({ currentSummary, jobTitle, skills, experience });
    });
  } catch (error) {
    next(error);
  }
};

exports.enhanceExperience = async (req, res, next) => {
  try {
    const { role, company, description, industry } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Please enter your experience description first.' });
    }

    await processWithCredits(req, res, next, async () => {
      return await groqService.enhanceExperience({ role, company, description, industry });
    });
  } catch (error) {
    next(error);
  }
};

exports.enhanceProject = async (req, res, next) => {
  try {
    const { title, description, techStack } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Please enter your project description first.' });
    }

    await processWithCredits(req, res, next, async () => {
      return await groqService.enhanceProject({ title, description, techStack });
    });
  } catch (error) {
    next(error);
  }
};

exports.enhanceInternship = async (req, res, next) => {
  try {
    const { role, company, description } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Please enter your internship description first.' });
    }

    await processWithCredits(req, res, next, async () => {
      return await groqService.enhanceInternship({ role, company, description });
    });
  } catch (error) {
    next(error);
  }
};

exports.enhanceAchievement = async (req, res, next) => {
  try {
    const { achievement } = req.body;
    if (!achievement || !achievement.trim()) {
      return res.status(400).json({ error: 'Please enter your achievement text first.' });
    }

    await processWithCredits(req, res, next, async () => {
      return await groqService.enhanceAchievement({ achievement });
    });
  } catch (error) {
    next(error);
  }
};

exports.suggestSkills = async (req, res, next) => {
  try {
    const { jobTitle, currentSkills, experience } = req.body;

    await processWithCredits(req, res, next, async () => {
      return await groqService.suggestSkills({ jobTitle, currentSkills, experience });
    });
  } catch (error) {
    next(error);
  }
};

exports.fixGrammar = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Please enter text to fix grammar.' });
    }

    await processWithCredits(req, res, next, async () => {
      return await groqService.fixGrammar({ text });
    });
  } catch (error) {
    next(error);
  }
};

exports.getCredits = async (req, res, next) => {
  try {
    const device = await DeviceModel.getById(req.device.deviceId);
    res.json({
      success: true,
      data: {
        credits: device?.ai_credits || 0,
        plan: device?.plan || 'free',
        totalCredits: device?.total_credits || 5,
      },
    });
  } catch (error) {
    next(error);
  }
};
