const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { parseResume } = require('../services/resumeParser.service');
const { postProcessResume, validateFormattedResume } = require('../services/resumeFormatter.service');
const logger = require('../utils/logger');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'), false);
    }
  }
});

router.post('/parse-structured', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    logger.info('Parsing resume (structured):', { 
      originalName: req.file.originalname,
      mimetype: req.file.mimetype 
    });

    const result = await parseResume(req.file);
    
    const formattedResume = postProcessResume(result.parsed);
    
    const validation = validateFormattedResume(formattedResume);
    
    const strictFormatted = {
      basicInfo: formattedResume.basicInfo,
      summary: formattedResume.summary,
      experience: formattedResume.experience,
      internships: formattedResume.internships,
      education: formattedResume.education,
      projects: formattedResume.projects,
      skills: formattedResume.skills,
      certifications: formattedResume.certifications,
      achievements: formattedResume.achievements
    };
    
    if (!strictFormatted.summary || strictFormatted.summary.length < 10) {
      logger.warn('Summary not properly formatted, regenerating...');
      const allSkills = Object.values(strictFormatted.skills || {}).flat();
      const expRole = strictFormatted.experience?.[0]?.role || '';
      strictFormatted.summary = `${expRole} with hands-on experience. Proficient in ${allSkills.slice(0, 5).join(', ')}.`;
    }
    
    for (const exp of (strictFormatted.experience || [])) {
      if (!exp.endDate || exp.endDate === '') exp.endDate = 'Present';
      exp.bullets = exp.bullets || [];
    }
    
    for (const edu of (strictFormatted.education || [])) {
      const isStandaloneMonth = (str) => {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        return months.includes(str?.toLowerCase?.().trim());
      };
      if (isStandaloneMonth(edu.startDate)) edu.startDate = '';
      if (isStandaloneMonth(edu.endDate)) edu.endDate = '';
    }
    
    for (const proj of (strictFormatted.projects || [])) {
      if (!proj.type || proj.type === 'Web') proj.type = 'Web Application';
      else if (proj.type.toLowerCase() === 'mobile') proj.type = 'Mobile Application';
    }

    logger.info('FINAL FORMATTED OUTPUT:', JSON.stringify(strictFormatted, null, 2));
    
    logger.info('Parsed resume (structured):', {
      name: strictFormatted.basicInfo?.fullName,
      email: strictFormatted.basicInfo?.email,
      expCount: strictFormatted.experience?.length || 0,
      eduCount: strictFormatted.education?.length || 0,
      projectsCount: strictFormatted.projects?.length || 0,
      skillsCount: Object.values(strictFormatted.skills || {}).flat().length || 0,
      warnings: validation.warnings,
      issues: validation.issues
    });

    res.json({
      success: true,
      data: {
        parsedResume: strictFormatted,
        validation: {
          isValid: validation.isValid,
          hasWarnings: validation.hasWarnings,
          warnings: validation.warnings,
          issues: validation.issues
        }
      }
    });

  } catch (error) {
    logger.error('Resume parse error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to parse resume',
      message: error.message 
    });
  }
});

module.exports = router;