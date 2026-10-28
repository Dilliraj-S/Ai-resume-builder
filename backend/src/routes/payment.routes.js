const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const { deviceMiddleware } = require('../middleware/deviceMiddleware');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

router.use((req, res, next) => {
  logger.info('Payment route hit:', req.method, req.path, 'headers:', req.headers['x-device-id']);
  next();
});

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

const paymentValidations = {
  createOrder: [
    body('plan_type').isIn(['single', 'pro']).withMessage('Invalid plan type'),
    validate,
  ],
  verifyPayment: [
    body('razorpay_order_id').notEmpty().withMessage('Order ID required'),
    body('razorpay_payment_id').notEmpty().withMessage('Payment ID required'),
    body('razorpay_signature').notEmpty().withMessage('Signature required'),
    body('plan_type').isIn(['single', 'pro']).withMessage('Invalid plan type'),
    validate,
  ],
};

// Webhook - NO device middleware (Razorpay sends from their server)
// Must be defined BEFORE deviceMiddleware is applied
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook);

// All other payment routes require device middleware
router.use(deviceMiddleware);

router.post('/create-order', paymentValidations.createOrder, ctrl.createOrder);
router.post('/verify', paymentValidations.verifyPayment, ctrl.verifyPayment);
router.post('/verify-download', ctrl.verifyAndDownload);
router.get('/info', ctrl.getPlanInfo);

module.exports = router;
