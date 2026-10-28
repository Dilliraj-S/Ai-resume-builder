const axios = require('axios');
const logger = require('../utils/logger');

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || 'your_canva_client_id';
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || 'your_canva_client_secret';
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || 'http://localhost:3000/auth/canva/callback';
const CANVA_AUTH_URL = 'https://www.canva.com/api/oauth/token';
const CANVA_API_URL = 'https://api.canva.com/rest/v1';

class CanvaService {
  static getAuthUrl(state) {
    const scopes = [
      'design:read',
      'design:content:read',
      'design:content:write',
      'design:read',
      'template:read'
    ].join(' ');
    
    return `https://www.canva.com/api/oauth/authorize?client_id=${CANVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(CANVA_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`;
  }

  static async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(CANVA_AUTH_URL, {
        grant_type: 'authorization_code',
        client_id: CANVA_CLIENT_ID,
        client_secret: CANVA_CLIENT_SECRET,
        code: code,
        redirect_uri: CANVA_REDIRECT_URI
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      logger.info('Canva token exchanged successfully');
      return response.data;
    } catch (error) {
      logger.error('Canva token exchange error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async refreshToken(refreshToken) {
    try {
      const response = await axios.post(CANVA_AUTH_URL, {
        grant_type: 'refresh_token',
        client_id: CANVA_CLIENT_ID,
        client_secret: CANVA_CLIENT_SECRET,
        refresh_token: refreshToken
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      logger.error('Canva token refresh error:', error.message);
      throw error;
    }
  }

  static async getDesigns(accessToken, limit = 20) {
    try {
      const response = await axios.get(`${CANVA_API_URL}/designs`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: { limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Canva get designs error:', error.message);
      throw error;
    }
  }

  static async getDesign(accessToken, designId) {
    try {
      const response = await axios.get(`${CANVA_API_URL}/designs/${designId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      logger.error('Canva get design error:', error.message);
      throw error;
    }
  }

  static async createDesign(accessToken, title) {
    try {
      const response = await axios.post(`${CANVA_API_URL}/designs`, {
        title: title || 'Resume'
      }, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      logger.error('Canva create design error:', error.message);
      throw error;
    }
  }

  static async exportDesign(accessToken, designId, format = 'pdf') {
    try {
      const response = await axios.post(`${CANVA_API_URL}/exports`, {
        design_id: designId,
        format: format,
        pages: 'all'
      }, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      logger.error('Canva export design error:', error.message);
      throw error;
    }
  }

  static async getTemplates(accessToken, limit = 50) {
    try {
      const response = await axios.get(`${CANVA_API_URL}/templates`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: { limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Canva get templates error:', error.message);
      throw error;
    }
  }

  static async importDesign(accessToken, designId) {
    try {
      const response = await axios.get(`${CANVA_API_URL}/designs/${designId}/content`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      logger.error('Canva import design error:', error.message);
      throw error;
    }
  }
}

module.exports = CanvaService;