import axios from 'axios';
import { BASE_URL, API_TIMEOUT } from '../config/constants';
import { v4 as uuidv4 } from 'uuid';

const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('rb_device_id');
  if (!deviceId) {
    // Use proper UUID v4 from uuid package
    deviceId = uuidv4();
    localStorage.setItem('rb_device_id', deviceId);
  }
  return deviceId;
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('rb_session');
  if (sessionId) config.headers['x-session-id'] = sessionId;

  const deviceId = getOrCreateDeviceId();
  config.headers['x-device-id'] = deviceId;

  const token = localStorage.getItem('rb_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;

  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('API Error:', err.response?.status, err.response?.data);
    if (err.response?.status === 401) {
      localStorage.removeItem('rb_token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const resumeAPI = {
  // CRUD operations
  create: (payload) => api.post('/resumes', payload),
  get: (id) => api.get(`/resumes/${id}`),
  update: (id, payload) => api.put(`/resumes/${id}`, payload),
  delete: (id) => api.delete(`/resumes/${id}`),
  duplicate: (id) => api.post(`/resumes/${id}/duplicate`, {}),
  
  // Fetch resumes - user-based (requires login)
  getMyResumes: () => api.get('/resumes/my'),
  getBySession: (sessionId) => api.get(`/resumes/session/${sessionId}`),
  
  // ATS
  getATSScore: (id, resumeData) => api.post(`/resumes/${id}/ats-score`, { resumeData }),
  
  // Parse resume file
  parseResumeFile: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const token = localStorage.getItem('rb_token');
    const headers = { 'Content-Type': 'multipart/form-data' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await axios.post(`${BASE_URL}/resume-ai/parse-ai`, formData, {
      headers,
      timeout: 30000,
    });
    return response.data;
  },
};

export const aiAPI = {
  enhanceSummary: (payload) => api.post('/ai/enhance-summary', payload),
  enhanceExperience: (payload) => api.post('/ai/enhance-experience', payload),
  enhanceProject: (payload) => api.post('/ai/enhance-project', payload),
  enhanceInternship: (payload) => api.post('/ai/enhance-internship', payload),
  enhanceAchievement: (payload) => api.post('/ai/enhance-achievement', payload),
  suggestSkills: (payload) => api.post('/ai/suggest-skills', payload),
  fixGrammar: (payload) => api.post('/ai/fix-grammar', payload),
  getCredits: () => api.get('/ai/credits'),
};

export const pdfAPI = {
  download: async (payload) => {
    const token = localStorage.getItem('rb_token');
    const headers = {
      'Content-Type': 'application/json',
      'x-session-id': localStorage.getItem('rb_session') || '',
      'x-device-id': getOrCreateDeviceId(),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await axios.post(`${BASE_URL}/pdf/download`, payload, {
      responseType: 'blob',
      headers,
      timeout: 60000,
    });
    return response.data;
  },
};

export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
};

export const paymentAPI = {
  createOrder: (payload) => api.post('/payments/create-order', payload),
  verify: (payload) => api.post('/payments/verify', payload),
  getInfo: () => api.get('/payments/info'),
  verifyAndDownload: async (payload) => {
    const token = localStorage.getItem('rb_token');
    const headers = {
      'Content-Type': 'application/json',
      'x-session-id': localStorage.getItem('rb_session') || '',
      'x-device-id': getOrCreateDeviceId(),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await axios.post(`${BASE_URL}/payments/verify-download`, payload, {
      responseType: 'blob',
      headers,
      timeout: 60000,
    });
    return response.data;
  },
};

export const resumeParserAPI = {
  parse: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await axios.post(`${BASE_URL}/resume-ai/parse-ai`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return response.data;
  },
  analyze: async (resumeData, jobDescription) => {
    const token = localStorage.getItem('rb_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    return api.post('/resume-parser/analyze', { resumeData, jobDescription }, { headers });
  },
  analyzeResume: async (resumeData, jobDescription) => {
    const token = localStorage.getItem('rb_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const formattedData = {
      basicInfo: resumeData.basicInfo || {},
      summary: resumeData.summary || '',
      experience: resumeData.experience || [],
      internships: resumeData.internships || [],
      education: resumeData.education || [],
      projects: resumeData.projects || [],
      skills: resumeData.skills || {},
      certifications: resumeData.certifications || [],
      achievements: resumeData.achievements || [],
    };
    
    return api.post('/resume-parser/analyze', { resumeData: formattedData, jobDescription }, { headers });
  },
};

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  googleAuth: () => api.get('/auth/google'),
  refreshToken: (token) => api.post('/auth/refresh', { token }),
};

// Auto-refresh token before expiration
let tokenRefreshTimer = null;
export const startTokenRefresh = (token, callback) => {
  // Clear existing timer
  if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
  
  // Refresh token 1 hour before expiry (assuming 7 day expiry = 604800 seconds)
  const refreshTime = (7 * 24 * 60 * 60 * 1000) - (60 * 60 * 1000); // 6 hours before expiry
  const safeTime = Math.max(refreshTime, 60 * 1000); // At least 1 minute
  
  tokenRefreshTimer = setTimeout(async () => {
    try {
      const currentToken = localStorage.getItem('rb_token');
      if (currentToken) {
        const response = await authAPI.refreshToken(currentToken);
        if (response.success && response.token) {
          localStorage.setItem('rb_token', response.token);
          if (callback) callback(response.token);
          // Start new timer
          startTokenRefresh(response.token, callback);
        }
      }
    } catch (e) {
      console.warn('Token refresh failed:', e.message);
    }
  }, safeTime);
};

export default api;
