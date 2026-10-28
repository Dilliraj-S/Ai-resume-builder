const { 
  resumeSchema, 
  createResumeSchema, 
  updateResumeSchema,
  paymentOrderSchema,
  paymentVerifySchema,
  loginSchema,
  registerSchema,
  aiEnhanceSchema,
  validate,
} = require('../../src/utils/validation');

describe('validation schemas', () => {
  describe('resumeSchema', () => {
    it('should validate optional fields', () => {
      const result = resumeSchema.safeParse({
        title: 'My Resume',
        templateId: 'modern-1',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = resumeSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('createResumeSchema', () => {
    it('should use defaults when fields missing', () => {
      const result = createResumeSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('My Resume');
      expect(result.data.templateId).toBe('modern-1');
    });
  });

  describe('updateResumeSchema', () => {
    it('should validate atsScore range', () => {
      const result = updateResumeSchema.safeParse({ atsScore: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject atsScore over 100', () => {
      const result = updateResumeSchema.safeParse({ atsScore: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject negative atsScore', () => {
      const result = updateResumeSchema.safeParse({ atsScore: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('paymentOrderSchema', () => {
    it('should accept valid plan types', () => {
      expect(paymentOrderSchema.safeParse({ plan_type: 'single' }).success).toBe(true);
      expect(paymentOrderSchema.safeParse({ plan_type: 'pro' }).success).toBe(true);
    });

    it('should reject invalid plan types', () => {
      const result = paymentOrderSchema.safeParse({ plan_type: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('paymentVerifySchema', () => {
    it('should require all razorpay fields', () => {
      const result = paymentVerifySchema.safeParse({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
        plan_type: 'pro',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing fields', () => {
      const result = paymentVerifySchema.safeParse({
        razorpay_order_id: 'order_123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should require name, email, password', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const result = registerSchema.safeParse({
        email: 'john@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('aiEnhanceSchema', () => {
    it('should accept valid AI enhancement request', () => {
      const result = aiEnhanceSchema.safeParse({
        currentSummary: 'Experienced developer',
        jobTitle: 'Software Engineer',
        skills: ['JavaScript', 'React'],
        experience: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = aiEnhanceSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for resumeId', () => {
      const result = aiEnhanceSchema.safeParse({ resumeId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should enforce max array lengths', () => {
      const result = aiEnhanceSchema.safeParse({
        skills: Array(51).fill('skill'),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validate middleware', () => {
    it('should call next() on valid data', () => {
      const middleware = validate(createResumeSchema);
      const req = { body: { title: 'Test' } };
      const res = {};
      const next = jest.fn();
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.validated).toBeDefined();
    });

    it('should return 400 on invalid data', () => {
      const middleware = validate(loginSchema);
      const req = { body: { email: 'invalid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Validation failed' })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});