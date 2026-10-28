const { query } = require('../config/database');
const { sendPlanExpiryReminder } = require('./email.service');
const logger = require('../utils/logger');

// Sentry for cron error alerting
const captureCronError = (error, context) => {
  try {
    const Sentry = require('@sentry/node');
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, { extra: context });
    }
  } catch (e) {
    // Sentry not available
  }
};

const resetExpiredPlans = async () => {
  try {
    logger.info('Cron: Checking for expired plans...');
    
    const expired = await query(
      `SELECT d.*, u.email, u.name as user_name 
       FROM devices d 
       LEFT JOIN users u ON u.id = d.user_id 
       WHERE d.expires_at IS NOT NULL 
         AND d.expires_at < NOW() 
         AND d.plan != 'free'`
    );

    if (!expired.rows?.length) {
      logger.info('Cron: No expired plans found');
      return { processed: 0 };
    }

    logger.info(`Cron: Found ${expired.rows.length} expired plans`);

    for (const device of expired.rows) {
      const deviceId = device.device_id;
      
      await query(
        `UPDATE devices 
         SET plan = 'free', 
             ai_credits = 5, 
             total_credits = 5,
             ats_checks_used = 0,
             ats_checks_limit = 3,
             downloads_used = 0,
             downloads_limit = 0,
             expires_at = NULL,
             updated_at = NOW()
         WHERE device_id = ?`,
        [deviceId]
      );

      logger.info('Cron: Reset expired plan', { deviceId, oldPlan: device.plan });

      if (device.email) {
        await sendPlanExpiryReminder({
          email: device.email,
          name: device.user_name,
          plan: device.plan,
          daysRemaining: 0,
        });
      }
    }

    return { processed: expired.rows.length };
  } catch (error) {
    logger.error('Cron: Error resetting expired plans:', error.message);
    captureCronError(error, { task: 'resetExpiredPlans' });
    return { error: error.message };
  }
};

const checkExpiringPlans = async (daysThreshold = 7) => {
  try {
    const expiring = await query(
      `SELECT d.*, u.email, u.name as user_name 
       FROM devices d 
       LEFT JOIN users u ON u.id = d.user_id 
       WHERE d.expires_at IS NOT NULL 
         AND d.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
         AND d.plan != 'free'`,
      [daysThreshold]
    );

    if (!expiring.rows?.length) {
      return { notified: 0 };
    }

    for (const device of expiring.rows) {
      const daysRemaining = Math.ceil(
        (new Date(device.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (device.email && daysRemaining <= 3) {
        await sendPlanExpiryReminder({
          email: device.email,
          name: device.user_name,
          plan: device.plan,
          daysRemaining,
        });
      }
    }

    return { notified: expiring.rows.length };
  } catch (error) {
    logger.error('Cron: Error checking expiring plans:', error.message);
    return { error: error.message };
  }
};

const startCronJobs = (app) => {
  try {
    const nodeCron = require('node-cron');
    
    logger.info('Cron: Scheduling jobs...');
    
    nodeCron.schedule('0 6 * * *', async () => {
      logger.info('Cron: Running daily plan check...');
      await resetExpiredPlans();
      await checkExpiringPlans();
    });

    logger.info('Cron: Jobs scheduled - runs daily at 6 AM');
    return { started: true };
  } catch (error) {
    logger.warn('Cron: node-cron not installed - skipping scheduled jobs');
    logger.info('Cron: To enable, run: npm install node-cron');
    return { started: false, error: error.message };
  }
};

module.exports = {
  resetExpiredPlans,
  checkExpiringPlans,
  startCronJobs,
};