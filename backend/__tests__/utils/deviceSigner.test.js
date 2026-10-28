const { signDeviceId, verifySignedDeviceId, generateSecureDeviceId } = require('../../src/utils/deviceSigner');

describe('deviceSigner', () => {
  const TEST_SECRET = 'test-sign-secret';
  
  beforeAll(() => {
    process.env.DEVICE_SIGN_SECRET = TEST_SECRET;
  });

  describe('signDeviceId', () => {
    it('should sign a device ID with timestamp and signature', () => {
      const deviceId = 'device-123';
      const signed = signDeviceId(deviceId);
      
      expect(signed).toContain(deviceId);
      expect(signed.split('.')).toHaveLength(3);
    });

    it('should produce different signatures for different timestamps', () => {
      const deviceId = 'device-123';
      const signed1 = signDeviceId(deviceId);
      
      return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
        const signed2 = signDeviceId(deviceId);
        expect(signed1).not.toBe(signed2);
      });
    });
  });

  describe('verifySignedDeviceId', () => {
    it('should verify a valid signed device ID', () => {
      const deviceId = 'device-123';
      const signed = signDeviceId(deviceId);
      
      const result = verifySignedDeviceId(signed);
      
      expect(result.valid).toBe(true);
      expect(result.deviceId).toBe(deviceId);
    });

    it('should reject tampered signature', () => {
      const signed = signDeviceId('device-123');
      const tampered = signed.slice(0, -2) + 'xx';
      
      const result = verifySignedDeviceId(tampered);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_signature');
    });

    it('should reject malformed signed ID', () => {
      const result = verifySignedDeviceId('invalid-format');
      
      expect(result.valid).toBe(false);
      expect(result.deviceId).toBeNull();
    });

    it('should reject expired signed ID (older than 7 days)', () => {
      const expiredDeviceId = 'device-123';
      const expired = `${expiredDeviceId}.${Date.now() - 8 * 24 * 60 * 60 * 1000}.abc123def456`;
      
      const result = verifySignedDeviceId(expired);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
    });
  });

  describe('generateSecureDeviceId', () => {
    it('should generate a valid signed device ID', () => {
      const signed = generateSecureDeviceId();
      
      const result = verifySignedDeviceId(signed);
      
      expect(result.valid).toBe(true);
      expect(result.deviceId).toBeDefined();
    });
  });
});