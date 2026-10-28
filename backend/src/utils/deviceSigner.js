const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// DEVICE_SIGN_SECRET validation - fail fast if missing in production
if (!process.env.DEVICE_SIGN_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DEVICE_SIGN_SECRET environment variable is required in production');
  }
  console.warn('⚠️ DEVICE_SIGN_SECRET not set - using temporary key (DO NOT USE IN PRODUCTION)');
}

const DEVICE_SIGN_SECRET = process.env.DEVICE_SIGN_SECRET || 'temp-sign-key-' + Date.now();

const signDeviceId = (deviceId) => {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', DEVICE_SIGN_SECRET)
    .update(`${deviceId}:${timestamp}`)
    .digest('hex');
  
  return `${deviceId}.${timestamp}.${signature.substring(0, 16)}`;
};

const verifySignedDeviceId = (signedId) => {
  try {
    const parts = signedId.split('.');
    if (parts.length !== 3) return { valid: false, deviceId: null };
    
    const [deviceId, timestamp, signature] = parts;
    const age = Date.now() - parseInt(timestamp);
    
    if (age > 7 * 24 * 60 * 60 * 1000) {
      return { valid: false, deviceId: null, reason: 'expired' };
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', DEVICE_SIGN_SECRET)
      .update(`${deviceId}:${timestamp}`)
      .digest('hex')
      .substring(0, 16);
    
    if (signature !== expectedSignature) {
      return { valid: false, deviceId: null, reason: 'invalid_signature' };
    }
    
    return { valid: true, deviceId };
  } catch (e) {
    return { valid: false, deviceId: null, reason: 'parse_error' };
  }
};

const generateSecureDeviceId = () => {
  return signDeviceId(uuidv4());
};

module.exports = {
  signDeviceId,
  verifySignedDeviceId,
  generateSecureDeviceId,
};