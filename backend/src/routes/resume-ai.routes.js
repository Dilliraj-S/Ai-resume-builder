const express = require('express');
const multer = require('multer');
const { parseResume } = require('../services/resumeParserAI.service');
const logger = require('../utils/logger');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, TXT allowed'), false);
  }
});

router.post('/parse-ai', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    logger.info('AI Parser: Starting', { 
      originalName: req.file.originalname,
      mimetype: req.file.mimetype 
    });

    const result = await parseResume(req.file);

    logger.info('AI Parser: Success', {
      name: result.raw?.name,
      expCount: result.parsedResume?.experience?.length || 0,
      eduCount: result.parsedResume?.education?.length || 0,
      projCount: result.parsedResume?.projects?.length || 0,
      skillsCount: Object.values(result.parsedResume?.skills || {}).flat().length || 0,
      certCount: result.parsedResume?.certifications?.length || 0
    });

    res.json({
      success: true,
      data: {
        parsedResume: result.parsedResume,
        raw: result.raw,
        validation: result.validation
      }
    });

  } catch (error) {
    logger.error('AI Parser error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to parse resume',
      message: error.message 
    });
  }
});

module.exports = router;