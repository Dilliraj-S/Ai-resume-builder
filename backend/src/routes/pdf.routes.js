const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pdf.controller');
const { deviceMiddleware } = require('../middleware/deviceMiddleware');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[PDF Validation] Errors:', errors.array());
  }
  next();
};

const pdfDownloadValidation = [
  body('resumeData').isObject(),
  body('templateId').optional().isString().trim().isLength({ max: 50 }),
  body('htmlContent').optional().isString(),
  body('resumeId').optional().isUUID(),
  body('filename').optional().isString().trim().isLength({ max: 200 }),
  validate,
];

router.use(deviceMiddleware);
router.use(pdfDownloadValidation);

router.post('/download', ctrl.downloadPDF);
router.post('/preview',  ctrl.previewPDF);

module.exports = router;
