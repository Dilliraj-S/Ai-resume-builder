const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

const resumeValidations = {
  create: [
    body('name').optional().isString().trim().isLength({ max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim().matches(/^[\d\s\-+()]*$/).isLength({ max: 20 }),
    body('title').optional().isString().trim().isLength({ max: 200 }),
    body('templateId').optional().isString().trim().isLength({ max: 50 }),
    body('resumeData').optional().isObject(),
    validate,
  ],
  update: [
    param('id').isUUID(),
    body('title').optional().isString().trim().isLength({ max: 200 }),
    body('templateId').optional().isString().trim().isLength({ max: 50 }),
    body('resumeData').optional().isObject(),
    validate,
  ],
  getById: [
    param('id').isUUID(),
    validate,
  ],
  delete: [
    param('id').isUUID(),
    validate,
  ],
  duplicate: [
    param('id').isUUID(),
    validate,
  ],
  atsScore: [
    param('id').optional().isUUID(),
    body('resumeData').isObject(),
    body('jobDescription').optional().isString().trim().isLength({ max: 10000 }),
    validate,
  ],
  getBySession: [
    param('sessionId').isUUID(),
    validate,
  ],
};

const aiValidations = {
  enhanceSummary: [
    body('currentSummary').optional().isString().trim().isLength({ max: 2000 }),
    body('jobTitle').optional().isString().trim().isLength({ max: 100 }),
    body('skills').optional().isArray(),
    body('experience').optional().isString().trim().isLength({ max: 2000 }),
    validate,
  ],
  enhanceExperience: [
    body('role').optional().isString().trim().isLength({ max: 100 }),
    body('company').optional().isString().trim().isLength({ max: 100 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    body('industry').optional().isString().trim().isLength({ max: 100 }),
    validate,
  ],
  enhanceProject: [
    body('title').optional().isString().trim().isLength({ max: 100 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    body('techStack').optional().isArray(),
    validate,
  ],
  enhanceInternship: [
    body('role').optional().isString().trim().isLength({ max: 100 }),
    body('company').optional().isString().trim().isLength({ max: 100 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    validate,
  ],
  enhanceAchievement: [
    body('achievement').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  suggestSkills: [
    body('jobTitle').optional().isString().trim().isLength({ max: 100 }),
    body('currentSkills').optional().isArray(),
    body('experience').optional().isString().trim().isLength({ max: 50 }),
    validate,
  ],
  fixGrammar: [
    body('text').isString().trim().notEmpty().isLength({ max: 5000 }),
    validate,
  ],
};

const pdfValidations = {
  download: [
    body('resumeData').isObject(),
    body('templateId').optional().isString().trim().isLength({ max: 50 }),
    body('htmlContent').optional().isString(),
    body('resumeId').optional().isUUID(),
    body('filename').optional().isString().trim().isLength({ max: 200 }),
    validate,
  ],
  preview: [
    body('resumeData').isObject(),
    body('templateId').isString().trim().notEmpty().isLength({ max: 50 }),
    validate,
  ],
};

const paymentValidations = {
  createOrder: [
    body('amount').isInt({ min: 1 }),
    body('currency').optional().isString().trim().isLength({ max: 10 }),
    validate,
  ],
  verifyAndDownload: [
    body('razorpay_payment_id').isString().trim().notEmpty(),
    body('razorpay_order_id').isString().trim().notEmpty(),
    body('razorpay_signature').isString().trim().notEmpty(),
    body('resumeData').isObject(),
    body('templateId').isString().trim().notEmpty(),
    validate,
  ],
};

module.exports = {
  resumeValidations,
  aiValidations,
  pdfValidations,
  paymentValidations,
  validate,
};
