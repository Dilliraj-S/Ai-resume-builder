const express = require('express');
const { v4: uuidv4 } = require('uuid');
const CanvaService = require('../services/canva.service');
const { deviceMiddleware } = require('../middleware/deviceMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Demo mode flag - set to true to test without Canva API keys
const DEMO_MODE = true;

// Store auth states in memory (use Redis in production)
const authStates = new Map();

// Initiate OAuth flow
router.get('/auth', (req, res) => {
  if (DEMO_MODE) {
    // Return demo mode - user can still browse their templates
    return res.json({ 
      success: true, 
      demo: true,
      message: 'Canva integration in demo mode. Add API keys to enable full features.',
      authUrl: 'https://www.canva.com/templates/resumes/'
    });
  }
  
  try {
    const state = uuidv4();
    authStates.set(state, { createdAt: Date.now(), expiresIn: 600000 });
    const authUrl = CanvaService.getAuthUrl(state);
    res.json({ success: true, authUrl });
  } catch (error) {
    logger.error('Canva auth error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate Canva auth' });
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  if (DEMO_MODE) {
    return res.redirect('/dashboard?canva=demo');
  }
  
  try {
    const { code, state } = req.query;
    if (!authStates.has(state)) {
      return res.status(400).json({ success: false, error: 'Invalid state parameter' });
    }
    authStates.delete(state);
    const tokenData = await CanvaService.exchangeCodeForToken(code);
    res.redirect('/dashboard?canva=connected');
  } catch (error) {
    logger.error('Canva callback error:', error);
    res.redirect('/dashboard?canva=error');
  }
});

// Get user's Canva designs (returns demo data in demo mode)
router.get('/designs', deviceMiddleware, async (req, res) => {
  if (DEMO_MODE) {
    return res.json({
      success: true,
      demo: true,
      data: [],
      message: 'Connect API keys for full Canva integration'
    });
  }
  
  try {
    const canvaToken = req.user?.canva_access_token || req.device?.canva_access_token;
    if (!canvaToken) {
      return res.json({ success: true, data: [], message: 'Not connected to Canva' });
    }
    const designs = await CanvaService.getDesigns(canvaToken);
    res.json({ success: true, data: designs });
  } catch (error) {
    logger.error('Canva designs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Canva designs' });
  }
});

// Get templates from Canva
router.get('/templates', deviceMiddleware, async (req, res) => {
  if (DEMO_MODE) {
    return res.json({
      success: true,
      demo: true,
      data: [],
      message: 'Add API keys to access Canva templates'
    });
  }
  
  try {
    const canvaToken = req.user?.canva_access_token || req.device?.canva_access_token;
    if (!canvaToken) {
      return res.json({ success: true, data: [] });
    }
    const templates = await CanvaService.getTemplates(canvaToken);
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('Canva templates error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// Create new design in Canva (demo mode shows info)
router.post('/design', deviceMiddleware, async (req, res) => {
  if (DEMO_MODE) {
    return res.json({
      success: true,
      demo: true,
      message: 'Open Canva templates to create designs',
      url: 'https://www.canva.com/templates/resumes/'
    });
  }
  
  try {
    const { title, resumeData } = req.body;
    const canvaToken = req.user?.canva_access_token || req.device?.canva_access_token;
    if (!canvaToken) {
      return res.status(401).json({ success: false, error: 'Not connected to Canva' });
    }
    const design = await CanvaService.createDesign(canvaToken, title || 'My Resume');
    res.json({ success: true, data: design });
  } catch (error) {
    logger.error('Canva create design error:', error);
    res.status(500).json({ success: false, error: 'Failed to create design' });
  }
});

// Export resume to Canva (demo mode)
router.post('/export', deviceMiddleware, async (req, res) => {
  if (DEMO_MODE) {
    return res.json({
      success: true,
      demo: true,
      message: 'Opening Canva in new tab - use resume templates there',
      url: 'https://www.canva.com/templates/resumes/'
    });
  }
  
  try {
    const { resumeId, resumeData } = req.body;
    const canvaToken = req.user?.canva_access_token || req.device?.canva_access_token;
    if (!canvaToken) {
      return res.status(401).json({ success: false, error: 'Not connected to Canva' });
    }
    const design = await CanvaService.createDesign(canvaToken, `Resume - ${resumeId}`);
    res.json({ success: true, data: design });
  } catch (error) {
    logger.error('Canva export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export to Canva' });
  }
});

// Check connection status
router.get('/status', deviceMiddleware, (req, res) => {
  const canvaToken = req.user?.canva_access_token || req.device?.canva_access_token;
  res.json({ success: true, connected: !!canvaToken, demo: DEMO_MODE });
});

module.exports = router;