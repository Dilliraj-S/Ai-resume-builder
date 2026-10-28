const crypto = require('crypto');

const sanitizeString = (input, maxLength = 5000) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)
    .replace(/<script/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/<iframe/gi, '&lt;iframe')
    .replace(/<object/gi, '&lt;object')
    .replace(/<embed/gi, '&lt;embed')
    .replace(/data:/gi, 'data:')
    .trim();
};

const sanitizeObject = (obj, maxLength = 5000) => {
  if (!obj || typeof obj !== 'object') return {};
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, maxLength);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item, maxLength) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, maxLength);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const sanitizeResumeData = (data) => {
  if (!data || typeof data !== 'object') return {};
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (key === 'resumeData' && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, 10000);
    } else if (key === 'htmlContent') {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, 5000);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item, 2000) : 
        typeof item === 'object' ? sanitizeObject(item, 2000) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, 5000);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeResumeData,
};