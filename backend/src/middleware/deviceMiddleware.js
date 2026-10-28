const DeviceModel = require('../models/Device');
const logger = require('../utils/logger');
const { verifySignedDeviceId } = require('../utils/deviceSigner');

const deviceMiddleware = async (req, res, next) => {
  try {
    let deviceId = req.headers['x-device-id'];
    
    // Check if deviceId is signed or plain UUID
    if (deviceId) {
      const verified = verifySignedDeviceId(deviceId);
      if (verified.valid) {
        // Signed device ID - use the verified UUID
        deviceId = verified.deviceId;
        logger.debug('Device ID verified (signed)', { deviceId });
      } else if (verified.reason === 'parse_error' || verified.reason === 'invalid_signature') {
        // Plain UUID (legacy) - accept it for backwards compatibility
        logger.debug('Device ID accepted (legacy plain UUID)', { deviceId });
      } else if (verified.reason === 'expired') {
        // Expired signed ID - treat as new device
        const simpleUuid = deviceId.split('.')[0];
        if (simpleUuid && /^[0-9a-f-]{36}$/.test(simpleUuid)) {
          deviceId = simpleUuid;
          logger.debug('Device ID renewed from expired signed ID', { deviceId });
        } else {
          return res.status(401).json({
            success: false,
            error: 'Invalid device token. Please refresh the page.',
            code: 'INVALID_DEVICE_TOKEN',
          });
        }
      }
    }

    logger.debug('Device middleware:', { path: req.path, deviceId: deviceId ? 'present' : 'missing' });

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID required',
        code: 'DEVICE_ID_REQUIRED',
      });
    }

    const device = await DeviceModel.createOrGet(deviceId);

    if (!device) {
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize device',
      });
    }

    req.device = {
      deviceId: device.device_id,
      plan: device.plan,
      aiCredits: device.ai_credits,
      totalCredits: device.total_credits,
    };

    logger.debug('Device middleware set req.device:', { deviceId: device.device_id });
    next();
  } catch (error) {
    logger.error('Device middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Device validation failed',
    });
  }
};

const checkCredits = async (req, res, next) => {
  try {
    const credits = await DeviceModel.checkCredits(req.device.deviceId);

    if (credits <= 0) {
      return res.status(403).json({
        success: false,
        error: 'No AI credits remaining',
        code: 'NO_CREDITS',
        credits: 0,
      });
    }

    req.device.credits = credits;
    next();
  } catch (error) {
    logger.error('Check credits error:', error);
    return res.status(500).json({
      success: false,
      error: 'Credit check failed',
    });
  }
};

const checkPlan = (requiredPlans = ['single', 'pro']) => {
  return (req, res, next) => {
    if (!requiredPlans.includes(req.device.plan)) {
      return res.status(403).json({
        success: false,
        error: 'Payment required for this feature',
        code: 'PAYMENT_REQUIRED',
        currentPlan: req.device.plan,
        requiredPlans,
      });
    }
    next();
  };
};

module.exports = { deviceMiddleware, checkCredits, checkPlan };
