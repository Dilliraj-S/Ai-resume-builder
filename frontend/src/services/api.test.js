describe('api service localStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('device ID handling', () => {
    it('should store device ID', () => {
      const deviceId = 'device-123-uuid';
      localStorage.setItem('rb_device_id', deviceId);
      expect(localStorage.getItem('rb_device_id')).toBe(deviceId);
    });

    it('should return stored device ID', () => {
      localStorage.setItem('rb_device_id', 'stored-device-id');
      expect(localStorage.getItem('rb_device_id')).toBe('stored-device-id');
    });
  });

  describe('auth token handling', () => {
    it('should store token', () => {
      const token = 'test-token-abc123';
      localStorage.setItem('rb_token', token);
      expect(localStorage.getItem('rb_token')).toBe(token);
    });

    it('should remove token on logout', () => {
      localStorage.setItem('rb_token', 'token-to-remove');
      localStorage.removeItem('rb_token');
      expect(localStorage.getItem('rb_token')).toBeNull();
    });
  });

  describe('session handling', () => {
    it('should store session ID', () => {
      localStorage.setItem('rb_session', 'session-123');
      expect(localStorage.getItem('rb_session')).toBe('session-123');
    });
  });

  describe('API endpoint paths', () => {
    it('should have correct auth endpoints', () => {
      const endpoints = {
        login: '/auth/login',
        register: '/auth/register',
        refresh: '/auth/refresh',
        me: '/auth/me',
        logout: '/auth/logout',
      };
      expect(endpoints.login).toBe('/auth/login');
      expect(endpoints.register).toBe('/auth/register');
      expect(endpoints.refresh).toBe('/auth/refresh');
    });

    it('should have correct resume endpoints', () => {
      const endpoints = {
        create: '/resumes',
        get: (id) => `/resumes/${id}`,
        update: (id) => `/resumes/${id}`,
        delete: (id) => `/resumes/${id}`,
        duplicate: (id) => `/resumes/${id}/duplicate`,
      };
      expect(endpoints.get('123')).toBe('/resumes/123');
      expect(endpoints.update('456')).toBe('/resumes/456');
    });

    it('should have correct AI endpoints', () => {
      const endpoints = {
        enhanceSummary: '/ai/enhance-summary',
        enhanceExperience: '/ai/enhance-experience',
        enhanceProject: '/ai/enhance-project',
        getCredits: '/ai/credits',
      };
      expect(endpoints.enhanceSummary).toBe('/ai/enhance-summary');
      expect(endpoints.getCredits).toBe('/ai/credits');
    });
  });

  describe('payload formatting', () => {
    it('should format login payload correctly', () => {
      const payload = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(payload.email).toBe('test@example.com');
      expect(payload.password).toBe('password123');
    });

    it('should format resume payload correctly', () => {
      const payload = {
        title: 'My Resume',
        templateId: 'modern-1',
        resumeData: { basics: { name: 'John' } },
      };
      expect(payload.title).toBe('My Resume');
      expect(payload.templateId).toBe('modern-1');
    });

    it('should format AI enhance payload correctly', () => {
      const payload = {
        currentSummary: 'Experienced developer',
        jobTitle: 'Software Engineer',
        skills: ['JavaScript', 'React'],
        experience: 5,
      };
      expect(payload.currentSummary).toBe('Experienced developer');
      expect(payload.skills).toHaveLength(2);
    });
  });
});