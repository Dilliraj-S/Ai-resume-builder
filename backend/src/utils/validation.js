const { z } = require('zod');

const resumeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  templateId: z.string().min(1).max(50).optional(),
  resumeData: z.record(z.any()).optional(),
});

const createResumeSchema = z.object({
  title: z.string().min(1).max(100).default('My Resume'),
  templateId: z.string().min(1).max(50).default('modern-1'),
  resumeData: z.record(z.any()).default({}),
});

const updateResumeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  templateId: z.string().min(1).max(50).optional(),
  resumeData: z.record(z.any()).optional(),
  atsScore: z.number().min(0).max(100).optional(),
  atsFeedback: z.array(z.any()).optional(),
});

const paymentOrderSchema = z.object({
  plan_type: z.enum(['single', 'pro']),
});

const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  plan_type: z.enum(['single', 'pro']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

const aiEnhanceSchema = z.object({
  resumeId: z.string().uuid().optional(),
  currentSummary: z.string().max(5000).optional(),
  jobTitle: z.string().max(100).optional(),
  skills: z.array(z.string()).max(50).optional(),
  experience: z.number().min(0).max(50).optional(),
  role: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  description: z.string().max(10000).optional(),
  industry: z.string().max(50).optional(),
  title: z.string().max(200).optional(),
  techStack: z.array(z.string()).max(30).optional(),
  achievement: z.string().max(5000).optional(),
  text: z.string().max(10000).optional(),
});

const validate = (schema) => (req, res, next) => {
  try {
    req.validated = schema.parse(req.body);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const issues = error.issues || [];
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: issues.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
    next(error);
  }
};

const validateQuery = (schema) => (req, res, next) => {
  try {
    req.validated = schema.parse(req.query);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
    next(error);
  }
};

module.exports = {
  resumeSchema,
  createResumeSchema,
  updateResumeSchema,
  paymentOrderSchema,
  paymentVerifySchema,
  loginSchema,
  registerSchema,
  aiEnhanceSchema,
  validate,
  validateQuery,
};