const mockDevice = {
  id: 'test-device-id-123',
  deviceId: 'test-device-id-123',
  userId: 'test-user-id',
  plan: 'pro',
  ai_credits: 10,
  total_credits: 20,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  password: '$2a$10$hashedpasswordplaceholder',
  googleId: null,
  lastLogin: new Date(),
};

const createMockReq = (overrides = {}) => ({
  body: {},
  query: {},
  params: {},
  headers: {
    'x-device-id': 'test-device-id-123',
  },
  device: {
    deviceId: 'test-device-id-123',
  },
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  ...overrides,
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

module.exports = {
  mockDevice,
  mockUser,
  createMockReq,
  createMockRes,
};