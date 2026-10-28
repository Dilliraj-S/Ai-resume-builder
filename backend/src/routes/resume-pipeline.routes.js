const express = require('express');
const multer = require('multer');
const { buildSchema } = require('../services/resumePipeline.service');
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

router.post('/parse-pipeline', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    logger.info('Pipeline: Starting resume reconstruction', { 
      originalName: req.file.originalname,
      mimetype: req.file.mimetype 
    });

    const result = await buildSchema(req.file);

    if (!result.success) {
      return res.status(400).json(result);
    }

    const { data } = result;

    logger.info('Pipeline: Final structured output', {
      name: data.name,
      title: data.title,
      expCount: data.experience?.length || 0,
      eduCount: data.education?.length || 0,
      projCount: data.projects?.length || 0,
      skillsCount: Object.values(data.skills || {}).flat().length || 0,
      certCount: data.certifications?.length || 0
    });

    res.json({
      success: true,
      data: {
        name: data.name,
        title: data.title,
        contact: data.contact,
        summary: data.summary,
        experience: data.experience,
        education: data.education,
        projects: data.projects,
        skills: data.skills,
        certifications: data.certifications
      }
    });

  } catch (error) {
    logger.error('Pipeline error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process resume',
      message: error.message 
    });
  }
});

module.exports = router;