const jwt = require('jsonwebtoken');

jest.mock('../../src/models/User', () => ({
  getById: jest.fn(),
  getByEmail: jest.fn(),
  create: jest.fn(),
  verifyPassword: jest.fn(),
  updateLastLogin: jest.fn(),
}));

const UserModel = require('../../src/models/User');
const authController = require('../../src/controllers/auth.controller');

describe('authController', () => {
  const TEST_JWT_SECRET = 'test-jwt-secret';
  
  beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT functions', () => {
    const generateToken = (user) => {
      return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        TEST_JWT_SECRET,
        { expiresIn: '7d' }
      );
    };

    it('should generate valid JWT token', () => {
      const user = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      const token = generateToken(user);
      
      expect(token).toBeDefined();
      
      const decoded = jwt.verify(token, TEST_JWT_SECRET);
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
    });

    it('should reject invalid token', () => {
      expect(() => {
        jwt.verify('invalid-token', TEST_JWT_SECRET);
      }).toThrow();
    });
  });

  describe('login', () => {
    it('should return 400 if email missing', async () => {
      const req = { body: { password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Email and password are required' })
      );
    });

    it('should return 400 if password missing', async () => {
      const req = { body: { email: 'test@example.com' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not found', async () => {
      UserModel.getByEmail.mockResolvedValue(null);
      
      const req = { body: { email: 'notfound@example.com', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Invalid credentials' })
      );
    });

    it('should return 401 if password invalid', async () => {
      UserModel.getByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashedpassword',
      });
      UserModel.verifyPassword.mockResolvedValue(false);
      
      const req = { body: { email: 'test@example.com', password: 'wrongpassword' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return token on successful login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        avatar: null,
      };
      UserModel.getByEmail.mockResolvedValue(mockUser);
      UserModel.verifyPassword.mockResolvedValue(true);
      UserModel.updateLastLogin.mockResolvedValue();
      
      const req = { body: { email: 'test@example.com', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.login(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: expect.any(String) }),
        })
      );
    });
  });

  describe('register', () => {
    it('should return 400 if required fields missing', async () => {
      const req = { body: { email: 'test@example.com' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.register(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if email invalid', async () => {
      const req = { body: { email: 'invalid-email', name: 'Test', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.register(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Please enter a valid email address' })
      );
    });

    it('should return 400 if email already exists', async () => {
      UserModel.getByEmail.mockResolvedValue({ id: 'existing-user' });
      
      const req = { body: { email: 'exists@example.com', name: 'Test', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.register(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Email already registered' })
      );
    });

    it('should create user and return token on success', async () => {
      UserModel.getByEmail.mockResolvedValue(null);
      UserModel.create.mockResolvedValue({
        id: 'new-user-1',
        email: 'new@example.com',
        name: 'New User',
        avatar: null,
      });
      UserModel.updateLastLogin.mockResolvedValue();
      
      const req = { body: { email: 'new@example.com', name: 'New User', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.register(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: expect.any(String) }),
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('should return 400 if token missing', async () => {
      const req = { body: {}, headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.refreshToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Token required' })
      );
    });

    it('should return 401 if token invalid', async () => {
      const req = { body: { token: 'invalid-token' }, headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.refreshToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return new token on valid refresh', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };
      
      UserModel.getById.mockResolvedValue(mockUser);
      UserModel.getByEmail.mockResolvedValue(mockUser);
      UserModel.create.mockResolvedValue(mockUser);
      UserModel.updateLastLogin.mockResolvedValue();
      
      const loginReq = { body: { email: 'test@example.com', password: 'password123' } };
      const loginRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.login(loginReq, loginRes);
      const token = loginRes.json.mock.calls[0][0].data.token;
      
      const refreshReq = { body: { token }, headers: {} };
      const refreshRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      await authController.refreshToken(refreshReq, refreshRes);
      
      expect(refreshRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        })
      );
    });
  });
});