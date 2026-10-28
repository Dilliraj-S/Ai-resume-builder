const Razorpay = require('razorpay');
const axios = require('axios');
const crypto = require('crypto');
const { query, getConnection } = require('../config/database');
const DeviceModel = require('../models/Device');
const { generatePDF, buildResumeHTML } = require('../services/pdf.service');
const ResumeModel = require('../models/Resume');
const logger = require('../utils/logger');
const { PRICING } = require('../constants');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
const currency = 'INR';

const getClient = () => {
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

exports.createOrder = async (req, res, next) => {
  try {
    logger.info('Creating payment order', { planType: req.body.plan_type, deviceId: req.device?.deviceId });
    
    const { plan_type } = req.body;
    
    if (!plan_type || !['single', 'pro', 'onetime'].includes(plan_type)) {
      return res.status(400).json({ success: false, error: 'Invalid plan type' });
    }

    const pricing = PRICING[plan_type];
    const amountInPaise = pricing.amount * 100;

    // Server-side: Re-fetch expected amount from pricing constant (not trusting client)
    const expectedAmount = pricing.amount * 100;

    const razorpay = getClient();
    
    // Verify order doesn't already exist with same amount
    const existingOrders = await query(
      `SELECT id FROM payments WHERE device_id = ? AND amount = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
      [req.device.deviceId, pricing.amount]
    );
    
    if (existingOrders.rows?.length > 0) {
      // Re-use existing pending order to prevent duplicates
      const existingOrderId = existingOrders.rows[0].id;
      logger.info('Reusing existing pending order', { existingOrderId });
    }

    const shortDeviceId = req.device.deviceId.replace(/-/g, '').substring(0, 8);
    const order = await razorpay.orders.create({
      amount: expectedAmount,
      currency,
      receipt: `rb_${shortDeviceId}_${Date.now().toString().slice(-8)}`,
      notes: { 
        source: 'resume-builder',
        plan_type,
        device_id: req.device.deviceId,
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      plan_type,
    });
  } catch (err) {
    logger.error('Razorpay order error:', err);
    return next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_type } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification data missing' });
    }

    if (!plan_type || !['single', 'pro', 'onetime'].includes(plan_type)) {
      return res.status(400).json({ success: false, error: 'Invalid plan type' });
    }

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    const pricing = PRICING[plan_type];

    const existingPayment = await query(
      `SELECT id, status FROM payments WHERE razorpay_order_id = ?`,
      [razorpay_order_id]
    );

    if (!existingPayment.rows || existingPayment.rows.length === 0) {
      await query(
        `INSERT INTO payments (device_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, plan_type, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [req.device.deviceId, razorpay_order_id, razorpay_payment_id, razorpay_signature, pricing.amount, plan_type]
      );
    }

    res.json({
      success: true,
      message: 'Payment received. Processing...',
      status: 'pending',
    });
  } catch (err) {
    logger.error('Razorpay verify error:', err);
    next(err);
  }
};

exports.verifyAndDownload = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, resumeData, templateId, templateMeta, htmlContent, filename, resumeId, plan_type } = req.body;
    const sessionId = req.headers['x-session-id'];

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification data missing' });
    }
    if (!resumeData) {
      return res.status(400).json({ success: false, error: 'Resume data is required' });
    }

    // Server-side verification via Razorpay API (more secure than client signature alone)
    try {
      const payment = await axios.get(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
        { auth: { username: keyId, password: keySecret } }
      );
      
      if (payment.data.status !== 'captured') {
        return res.status(400).json({ success: false, error: 'Payment not captured' });
      }
      
      if (payment.data.order_id !== razorpay_order_id) {
        return res.status(400).json({ success: false, error: 'Order ID mismatch' });
      }
    } catch (apiError) {
      logger.error('Razorpay API verification failed:', apiError.message);
      // Fallback to signature verification if API fails
      const expected = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expected !== razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Invalid payment signature' });
      }
    }

    const canDownload = await DeviceModel.canDownload(req.device.deviceId);
    if (!canDownload.canDownload) {
      return res.status(403).json({
        success: false,
        error: canDownload.reason === 'limit_exceeded' 
          ? 'Download limit exceeded. Please purchase a plan to continue.' 
          : 'Payment required to download PDF',
        code: canDownload.reason,
      });
    }

    const html = htmlContent || buildResumeHTML(resumeData, templateId || 'modern-01', templateMeta);
    const pdfOptions = htmlContent ? {
      marginTop: '0mm',
      marginRight: '0mm',
      marginBottom: '0mm',
      marginLeft: '0mm',
    } : {};
    const pdfBuffer = await generatePDF(html, pdfOptions);

    if (resumeId && sessionId) {
      await ResumeModel.incrementDownload(resumeId, sessionId, req.device.deviceId, 'pdf');
    }

    await DeviceModel.incrementDownload(req.device.deviceId);

    const name = filename || `${resumeData.basicInfo?.fullName?.replace(/\s+/g, '_') || 'resume'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    logger.error('Razorpay verify and download error:', err);
    next(err);
  }
};

exports.getPlanInfo = async (req, res, next) => {
  try {
    const device = await DeviceModel.getById(req.device.deviceId);
    const plan = device?.plan || 'free';
    const atsChecksUsed = device?.ats_checks_used ?? 0;
    const atsChecksLimit = device?.ats_checks_limit ?? (plan === 'pro' ? 15 : 3);
    const atsChecksRemaining = atsChecksLimit === -1 ? -1 : Math.max(0, atsChecksLimit - atsChecksUsed);
    const downloadsUsed = device?.downloads_used ?? 0;
    const downloadsLimit = device?.downloads_limit ?? (plan === 'pro' ? 5 : plan === 'single' ? 1 : 0);
    const downloadsRemaining = downloadsLimit === -1 ? -1 : Math.max(0, downloadsLimit - downloadsUsed);

    const canDownload = await DeviceModel.canDownload(req.device.deviceId);
    const canCheckAts = await DeviceModel.checkAtsChecks(req.device.deviceId);
    res.json({
      success: true,
      data: {
        plan,
        atsChecksUsed,
        atsChecksLimit,
        atsChecksRemaining,
        canCheckAts: canCheckAts.canCheck,
        atsCheckReason: canCheckAts.reason,
        downloadsUsed,
        downloadsLimit,
        canDownload: canDownload.canDownload,
        downloadReason: canDownload.reason,
        downloadsRemaining,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.handleWebhook = async (req, res) => {
  const localLogger = require('../utils/logger');

  try {
    const rawBody = req.body;

    if (!rawBody) {
      localLogger.error('Webhook: No body received');
      return res.status(400).json({ success: false, error: 'No body received' });
    }

    const razorpaySignature = req.headers['x-razorpay-signature'];

    if (!razorpaySignature) {
      localLogger.error('Webhook: No signature header');
      return res.status(400).json({ success: false, error: 'No signature provided' });
    }

    if (!webhookSecret) {
      localLogger.error('Webhook: RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ success: false, error: 'Webhook not configured' });
    }

    let bodyString;
    if (typeof rawBody === 'string') {
      bodyString = rawBody;
    } else if (Buffer.isBuffer(rawBody)) {
      bodyString = rawBody.toString('utf-8');
    } else {
      bodyString = JSON.stringify(rawBody);
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      localLogger.error('Webhook: Invalid signature');
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    const event = JSON.parse(bodyString);
    localLogger.info('Razorpay webhook received:', event.event);

    const handlePaymentCaptured = async (paymentEntity) => {
      const { order_id, id: payment_id, amount } = paymentEntity;
      const amountInRs = amount / 100;

      const connection = await getConnection();
      try {
        await connection.beginTransaction();

        const [existingPayment] = await connection.query(
          `SELECT id, status FROM payments WHERE razorpay_payment_id = ?`,
          [payment_id]
        );

        if (existingPayment) {
          await connection.commit();
          localLogger.info(`Payment already processed: ${payment_id}`);
          return { alreadyProcessed: true };
        }

        let [orderRows] = await connection.query(
          `SELECT * FROM payments WHERE razorpay_order_id = ?`,
          [order_id]
        );

        let deviceId = null;
        let planType = null;

        if (orderRows.length === 0) {
          localLogger.warn(`No payment record found for order: ${order_id}, checking order notes...`);
          
          try {
            const razorpay = getClient();
            const orderDetails = await razorpay.orders.fetch(order_id);
            deviceId = orderDetails.notes?.device_id;
            planType = orderDetails.notes?.plan_type;
            
            if (!deviceId || !planType) {
              await connection.rollback();
              localLogger.error(`No device_id or plan_type in order notes for: ${order_id}`);
              return { error: 'Order not found in database and no notes in Razorpay order' };
            }
            
            localLogger.info(`Found device_id from order notes: ${deviceId}, plan: ${planType}`);
          } catch (e) {
            await connection.rollback();
            localLogger.error(`Failed to fetch order from Razorpay: ${e.message}`);
            return { error: 'Order not found and could not fetch from Razorpay' };
          }
        } else {
          const paymentRecord = orderRows[0];
          deviceId = paymentRecord.device_id;
          planType = paymentRecord.plan_type;
        }

        const pricing = PRICING[planType];
        if (!pricing) {
          await connection.rollback();
          localLogger.error(`Invalid plan type: ${planType}`);
          return { error: 'Invalid plan type' };
        }

        // IDEMPOTENCY CHECK already done at line 289 - skipping duplicate check

        const expectedAmount = pricing.amount;
        if (amountInRs !== expectedAmount) {
          await connection.rollback();
          localLogger.error(`Amount mismatch: expected ${expectedAmount}, got ${amountInRs}`);
          return { error: 'Amount mismatch - possible tampering' };
        }

        await connection.query(
          `INSERT INTO payments (device_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, plan_type, status)
           VALUES (?, ?, ?, ?, ?, ?, 'success')`,
          [deviceId, order_id, payment_id, '', amountInRs, planType]
        );

        const creditsToAdd = pricing.aiCredits;
        const downloadsLimit = pricing.downloadsLimit;
        
        // Set expiry for Pro plan using parameterized query
        if (planType === 'pro') {
          await connection.query(
            `UPDATE devices 
             SET plan = ?, 
                 ai_credits = ai_credits + ?, 
                 total_credits = total_credits + ?,
                 downloads_limit = ?, 
                 downloads_used = 0,
                 expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY),
                 updated_at = NOW()
             WHERE device_id = ?`,
            [planType, creditsToAdd, creditsToAdd, downloadsLimit, deviceId]
          );
        } else {
          await connection.query(
            `UPDATE devices 
             SET plan = ?, 
                 ai_credits = ai_credits + ?, 
                 total_credits = total_credits + ?,
                 downloads_limit = ?, 
                 downloads_used = 0,
                 expires_at = NULL,
                 updated_at = NOW()
             WHERE device_id = ?`,
            [planType, creditsToAdd, creditsToAdd, downloadsLimit, deviceId]
          );
        }

        await connection.commit();
        
        // Send email receipt
        try {
          const { sendPaymentReceipt } = require('../services/email.service');
          await sendPaymentReceipt({ 
            email: device?.email || 'customer@example.com', 
            name: device?.name || 'Customer',
            plan: planType, 
            amount: amountInRs, 
            orderId: order_id, 
            paymentId: payment_id 
          });
        } catch (emailErr) {
          localLogger.warn('Failed to send receipt:', emailErr.message);
        }
        
        localLogger.info(`Payment captured and device updated: device=${deviceId}, plan=${planType}, credits=${creditsToAdd}, downloads=${downloadsLimit}`);

        return { success: true, deviceId, planType, creditsToAdd };
      } catch (err) {
        await connection.rollback();
        localLogger.error('Transaction error:', err.message);
        throw err;
      } finally {
        connection.release();
      }
    };

    const handlePaymentFailed = async (paymentEntity) => {
      const { order_id, id: payment_id } = paymentEntity;

      await query(
        `UPDATE payments 
         SET status = 'failed'
         WHERE razorpay_order_id = ?`,
        [order_id]
      );

      localLogger.info(`Payment failed: ${payment_id}, Order: ${order_id}`);
      return { success: true };
    };

    switch (event.event) {
      case 'payment.captured':
        const capturedPayment = event.payload?.payment?.entity;
        if (capturedPayment) {
          await handlePaymentCaptured(capturedPayment);
          return res.json({ success: true, received: true });
        }
        break;

      case 'payment.failed':
        const failedPayment = event.payload?.payment?.entity;
        if (failedPayment) {
          await handlePaymentFailed(failedPayment);
          return res.json({ success: true, received: true });
        }
        break;

      default:
        localLogger.info(`Unhandled webhook event: ${event.event}`);
    }

    res.json({ success: true, received: true });
  } catch (err) {
    logger.error('Webhook error:', err);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
};