const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn('Email not configured - SMTP credentials missing');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendWithRetry = async (transporter, mailOptions, maxRetries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      lastError = error;
      logger.warn(`Email attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt)); // 1s, 2s, 3s delay
      }
    }
  }
  throw lastError;
};

const sendPaymentReceipt = async ({ email, name, plan, amount, orderId, paymentId }) => {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn('Email receipt skipped - not configured');
    return { skipped: true };
  }

  const planNames = {
    single: 'Starter Plan',
    pro: 'Pro Plan',
  };

  const mailOptions = {
    from: `"Resume Builder" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Payment Receipt - Resume Builder ${planNames[plan] || plan}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Payment Receipt</h2>
        
        <p>Hi ${name || 'there'},</p>
        
        <p>Thank you for your purchase! Here are your receipt details:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">Plan</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${planNames[plan] || plan}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">Amount Paid</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">₹${amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">Order ID</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${orderId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">Payment ID</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${paymentId}</td>
          </tr>
          <tr>
            <td style="padding: 8px;">Date</td>
            <td style="padding: 8px;">${new Date().toLocaleDateString('en-IN')}</td>
          </tr>
        </table>
        
        <p style="color: #666; font-size: 14px;">
          Your plan is now active! You can access all premium features in your resume builder.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Need help? Reply to this email or contact support.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          Resume Builder - Build professional resumes in minutes
        </p>
      </div>
    `,
  };

  try {
    const info = await sendWithRetry(transporter, mailOptions);
    logger.info('Payment receipt sent', { email, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send payment receipt:', error.message);
    return { success: false, error: error.message };
  }
};

const sendPlanExpiryReminder = async ({ email, name, plan, daysRemaining }) => {
  const transporter = createTransporter();
  if (!transporter) return { skipped: true };

  const planNames = { pro: 'Pro Plan' };

  const mailOptions = {
    from: `"Resume Builder" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your ${planNames[plan]} expires in ${daysRemaining} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Plan Expiry Reminder</h2>
        
        <p>Hi ${name || 'there'},</p>
        
        <p>Your <strong>${planNames[plan]}</strong> will expire in <strong>${daysRemaining} days</strong>.</p>
        
        <p>Renew now to keep your unlimited downloads and AI credits!</p>
        
        <a href="${process.env.FRONTEND_URL}/builder" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Resume Builder
        </a>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          Resume Builder
        </p>
      </div>
    `,
  };

  try {
    const info = await sendWithRetry(transporter, mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send expiry reminder:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPaymentReceipt,
  sendPlanExpiryReminder,
};