const { sanitizeString, sanitizeObject, sanitizeResumeData } = require('../../src/utils/sanitizer');

describe('sanitizer', () => {
  describe('sanitizeString', () => {
    it('should return empty string for null input', () => {
      expect(sanitizeString(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(sanitizeString(undefined)).toBe('');
    });

    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>';
      expect(sanitizeString(input)).not.toContain('<script');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      expect(sanitizeString(input)).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = '<button onclick="alert(1)">Click</button>';
      expect(sanitizeString(input)).not.toContain('onclick=');
    });

    it('should escape iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      expect(sanitizeString(input)).toContain('&lt;iframe');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(10000);
      expect(sanitizeString(longString, 100)).toHaveLength(100);
    });

    it('should preserve normal text', () => {
      const input = 'Hello World! This is normal text.';
      expect(sanitizeString(input)).toBe(input);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values', () => {
      const input = {
        name: '<script>alert(1)</script>',
        bio: 'Normal bio',
      };
      const result = sanitizeObject(input);
      
      expect(result.name).not.toContain('<script');
      expect(result.bio).toBe('Normal bio');
    });

    it('should handle nested objects', () => {
      const input = {
        profile: {
          name: '<script>alert(1)</script>',
        },
      };
      const result = sanitizeObject(input);
      
      expect(result.profile.name).not.toContain('<script');
    });

    it('should handle arrays of strings', () => {
      const input = {
        skills: ['<script>alert(1)</script>', 'JavaScript', '<img onerror=1>'],
      };
      const result = sanitizeObject(input);
      
      expect(result.skills[0]).not.toContain('<script');
      expect(result.skills[1]).toBe('JavaScript');
      expect(result.skills[2]).not.toContain('onerror');
    });
  });

  describe('sanitizeResumeData', () => {
    it('should sanitize resume data object', () => {
      const input = {
        title: 'My Resume',
        resumeData: {
          basics: {
            name: '<script>alert(1)</script>',
          },
        },
      };
      const result = sanitizeResumeData(input);
      
      expect(result.resumeData.basics.name).not.toContain('<script');
    });

    it('should allow htmlContent through without sanitization', () => {
      const input = {
        htmlContent: '<script>alert(1)</script>',
      };
      const result = sanitizeResumeData(input);
      
      expect(result.htmlContent).toBe(input.htmlContent);
    });
  });
});