const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const logger = require('../utils/logger');

// JWT_SECRET validation - fail fast if missing in production
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('⚠️ JWT_SECRET not set - using temporary key (DO NOT USE IN PRODUCTION)');
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_BACKUP || 'resume-builder-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
  'throwaway.email', '10minutemail.com', 'trashmail.com', 'getnada.com',
  'yopmail.com', 'sharklasers.com', 'spam4.me', 'grr.la', 'maildrop.cc',
  'mailnesia.com', 'tempail.com', 'dispostable.com', 'fakeinbox.com',
  'mohmal.com', 'tmpmail.org', 'tmpmail.net', 'tempr.email',
  'emailondeck.com', 'mintemail.com', 'mailcatch.com', 'spamfree24.org',
  'mytrashmail.com', 'tempsky.com', 'tempemailaddress.com', 'email-temp.com',
  'mail-temporaire.fr', 'tempemail.xyz', 'spamgourmet.com', 'dropmail.me',
  'meltmail.com', 'spambox.us', 'mail-temp.com', '33mail.com'
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email) => EMAIL_REGEX.test(email);

const isDisposableEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && DISPOSABLE_DOMAINS.includes(domain);
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const refreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Refresh token - extend session without re-login
exports.refreshToken = async (req, res, next) => {
  try {
    // Current user is already verified by authMiddleware (if added)
    // But for explicit refresh, accept the token in body or header
    let token = req.body.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }
    
    // Verify current token (to ensure it's valid before refresh)
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await UserModel.getById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      
      // Generate new token
      const newToken = refreshToken(user);
      
      res.json({
        success: true,
        token: newToken,
        expiresIn: JWT_EXPIRES_IN,
      });
    } catch (jwtError) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Token refresh error:', error);
    next(error);
  }
};

// Register (simple - for future use)
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    
    if (isDisposableEmail(email)) {
      return res.status(400).json({ success: false, error: 'Temporary email addresses are not allowed. Please use a valid email.' });
    }
    
    const existing = await UserModel.getByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    
    const user = await UserModel.create({ email, name, password });
    const token = generateToken(user);
    
    await UserModel.updateLastLogin(user.id);
    
    res.status(201).json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }, token }
    });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }
    
    const user = await UserModel.getByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const valid = await UserModel.verifyPassword(user, password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    await UserModel.updateLastLogin(user.id);
    
    res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }, token }
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth - initiate (returns auth URL)
exports.googleAuth = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ 
      success: false, 
      error: 'Google login is not available. Please use email login.' 
    });
  }
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback')}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=select_account`;
  
  res.json({ success: true, data: { authUrl } });
};

// Google callback
exports.googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ success: false, error: 'No authorization code' });
    }
    
    // Exchange code for tokens
    const axios = require('axios');
    const { data: tokenData } = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      grant_type: 'authorization_code'
    });
    
    // Get user info
    const { data: userInfo } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    
    // Find or create user
    let user = await UserModel.getByGoogleId(userInfo.id);
    if (!user) {
      user = await UserModel.create({
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.id,
        avatar: userInfo.picture
      });
    }
    
    const token = generateToken(user);
    await UserModel.updateLastLogin(user.id);
    
    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
  }
};

// Get current user
exports.me = async (req, res, next) => {
  try {
    const user = await UserModel.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } }
    });
  } catch (error) {
    next(error);
  }
};

// Logout (client-side token removal)
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};