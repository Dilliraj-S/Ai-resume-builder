const ResumeModel = require('../models/Resume');
const DeviceModel = require('../models/Device');
const { scoreResume } = require('../services/ats.service');
const { sanitizeResumeData } = require('../utils/sanitizer');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

exports.createResume = async (req, res, next) => {
  try {
    const { title, templateId, resumeData, atsScore, atsFeedback } = req.body;
    const sessionId = req.headers['x-session-id'] || uuidv4();
    const deviceId = req.device?.deviceId || null;
    const userId = req.user?.id || null;
    
    // Sanitize resume data before storing
    const safeResumeData = sanitizeResumeData(resumeData);

    logger.info('Creating resume:', { title, atsScore, atsFeedback, userId });
    
    let resume = await ResumeModel.createResume({
      userId,
      sessionId,
      deviceId,
      title,
      templateId,
      resumeData: safeResumeData,
      atsScore,
    });

    // Also store feedback
    if (atsScore && atsFeedback) {
      await ResumeModel.updateResume(resume.id, { atsScore, atsFeedback });
      resume = await ResumeModel.getResumeById(resume.id);
    }

    res.status(201).json({
      success: true,
      data: { resume, sessionId },
    });
  } catch (error) {
    next(error);
  }
};

exports.getResume = async (req, res, next) => {
  try {
    const resume = await ResumeModel.getResumeById(req.params.id);
    if (!resume) return res.status(404).json({ success: false, error: 'Resume not found' });
    res.json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
};

exports.updateResume = async (req, res, next) => {
  try {
    const { title, templateId, resumeData } = req.body;

    let atsScore = 0;
    let atsFeedback = [];
    if (resumeData) {
      const atsResult = scoreResume(resumeData);
      atsScore = atsResult.score;
      atsFeedback = atsResult.suggestions;
    }

    // Sanitize resume data before updating
    const safeResumeData = sanitizeResumeData(resumeData);

    const resume = await ResumeModel.updateResume(req.params.id, {
      title, templateId, resumeData: safeResumeData, atsScore, atsFeedback,
    });

    if (!resume) return res.status(404).json({ success: false, error: 'Resume not found' });

    res.json({
      success: true,
      data: { resume, atsScore, atsFeedback },
    });
  } catch (error) {
    next(error);
  }
};

exports.getATSScore = async (req, res, next) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const options = jobDescription ? { jobDescription } : {};
    const result = scoreResume(resumeData, options);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getSessionResumes = async (req, res, next) => {
  try {
    const resumes = await ResumeModel.getResumesBySession(req.params.sessionId);
    res.json({ success: true, data: resumes });
  } catch (error) {
    next(error);
  }
};

exports.getDeviceResumes = async (req, res, next) => {
  try {
    const resumes = await ResumeModel.getResumesByDevice(req.device.deviceId);
    res.json({ success: true, data: resumes });
  } catch (error) {
    next(error);
  }
};

exports.getUserResumes = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const deviceId = req.device?.deviceId;
    
    let resumes = [];
    
    // Get user resumes if logged in
    if (userId) {
      resumes = await ResumeModel.getResumesByUserId(userId);
    }
    
    // Also get device resumes
    if (deviceId) {
      const deviceResumes = await ResumeModel.getResumesByDevice(deviceId);
      // Add device resumes that aren't in user resumes
      for (const dr of deviceResumes) {
        if (!resumes.some(r => r.id === dr.id)) {
          resumes.push(dr);
        }
      }
    }
    
    res.json({ success: true, data: resumes });
  } catch (error) {
    next(error);
  }
};

exports.deleteResume = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const deleted = await ResumeModel.deleteResumeById(resumeId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Resume not found or not authorized' });
    }
    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.duplicateResume = async (req, res, next) => {
  try {
    const sourceResume = await ResumeModel.getResumeById(req.params.id);
    if (!sourceResume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const duplicated = await ResumeModel.createResume({
      deviceId: req.device.deviceId,
      title: `${sourceResume.title} (Copy)`,
      templateId: sourceResume.template_id,
      resumeData: sourceResume.resume_data,
    });

    res.status(201).json({ success: true, data: duplicated });
  } catch (error) {
    next(error);
  }
};
