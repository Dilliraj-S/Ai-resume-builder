import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { resumeAPI } from '../services/api';

const defaultResumeData = {
  basicInfo: { fullName: '', email: '', phone: '', linkedin: '', github: '', portfolio: '' },
  summary: '',
  profileType: 'fresher',
  hasInternship: false,
  experience: [],
  internships: [],
  education: [],
  projects: [],
  skills: {
    frontend: [], backend: [], database: [], tools: [], business: [], finance: [], marketing: [], softskills: [],
  },
  certifications: [],
  achievements: [],
  customHeadings: {},
};

// Create store with server persistence
const useResumeStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────
  // Current resume
  resumeId: null,
  resumeTitle: 'My Resume',
  resumeData: defaultResumeData,
  selectedTemplate: 'modern',
  selectedTemplateMeta: null,
  
  // Resume list (all resumes for this device)
  resumeList: [],
  isLoadingResumes: false,
  
  // UI state
  activeSection: 'basicInfo',
  atsScore: 0,
  atsFeedback: [],
  isSaving: false,
  isGeneratingPDF: false,
  isDirty: false,
  error: null,
  
  // Styling
  fontSize: 11,
  fontFamily: 'Inter',
  
  // Plan & Credits
  userPlan: { plan: 'free', atsChecksUsed: 0, atsChecksLimit: 3, downloadsUsed: 0, downloadsLimit: 0, downloadsRemaining: 0 },
  showUpsellModal: false,
  upsellReason: '',

  // ─── Setters ────────────────────────────────────────────
  setResumeId: (id) => set({ resumeId: id }),
  setResumeData: (data) => set({ resumeData: data, isDirty: true }),

  // ─── Resume List Actions ───────────────────────────────────
  loadResumes: async (data) => {
    if (data) {
      set({ resumeList: data, isLoadingResumes: false });
      return data;
    }
    set({ isLoadingResumes: true, error: null });
    try {
      const response = await resumeAPI.getMyResumes();
      set({ 
        resumeList: response.data || [],
        isLoadingResumes: false 
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to load resumes:', error);
      set({ error: 'Failed to load resumes', isLoadingResumes: false });
      return [];
    }
  },

  createNewResume: async (title = 'My Resume', atsScore = null, templateId = 'modern-1', resumeData = null) => {
    set({ isSaving: true, error: null });
    try {
      const finalResumeData = resumeData || defaultResumeData;
      const payload = {
        title,
        templateId: templateId || 'modern-1',
        resumeData: finalResumeData,
      };
      
      if (atsScore) {
        payload.atsScore = atsScore;
      }
      
      console.log('[resumeStore] Creating resume with:', payload);
      const response = await resumeAPI.create(payload);
      console.log('[resumeStore] API response:', response);
      console.log('[resumeStore] API response.data:', response.data);
      console.log('[resumeStore] API response.data.resume:', response.data?.resume);
      
      const newResume = response.data?.resume;
      console.log('[resumeStore] Created resume:', newResume);
      
      set((s) => ({
        resumeList: [newResume, ...s.resumeList],
        resumeId: newResume.id,
        resumeTitle: newResume.title,
        resumeData: finalResumeData,
        selectedTemplate: newResume.template_id,
        isDirty: false,
        isSaving: false,
      }));
      
      return newResume;
    } catch (error) {
      console.error('Failed to create resume:', error);
      set({ error: 'Failed to create resume', isSaving: false });
      return null;
    }
  },

  loadResume: async (resumeId) => {
    set({ isSaving: true, error: null });
    try {
      const response = await resumeAPI.get(resumeId);
      const resume = response.data;
      
      if (!resume) {
        set({ error: 'Resume not found', isSaving: false });
        return false;
      }

      // Parse resume_data if it's a string
      const resumeData = typeof resume.resume_data === 'string' 
        ? JSON.parse(resume.resume_data) 
        : resume.resume_data;

      set({
        resumeId: resume.id,
        resumeTitle: resume.title,
        resumeData: { ...defaultResumeData, ...resumeData },
        selectedTemplate: resume.template_id || 'modern-1',
        atsScore: resume.ats_score || 0,
        isDirty: false,
        isSaving: false,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to load resume:', error);
      set({ error: 'Failed to load resume', isSaving: false });
      return false;
    }
  },

  saveResume: async () => {
    const { resumeId, resumeTitle, resumeData, selectedTemplate } = get();
    if (!resumeId) return false;
    
    set({ isSaving: true, error: null });
    try {
      const response = await resumeAPI.update(resumeId, {
        title: resumeTitle,
        templateId: selectedTemplate,
        resumeData,
      });
      
      set((s) => ({
        resumeList: s.resumeList.map(r => 
          r.id === resumeId 
            ? { ...r, title: resumeTitle, template_id: selectedTemplate, updated_at: new Date().toISOString() }
            : r
        ),
        isDirty: false,
        isSaving: false,
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to save resume:', error);
      set({ error: 'Failed to save resume', isSaving: false });
      return false;
    }
  },

  deleteResume: async (resumeId) => {
    try {
      await resumeAPI.delete(resumeId);
      set((s) => ({
        resumeList: s.resumeList.filter(r => r.id !== resumeId),
        // If deleted current resume, reset to default
        resumeId: s.resumeId === resumeId ? null : s.resumeId,
        resumeData: s.resumeId === resumeId ? defaultResumeData : s.resumeData,
        resumeTitle: s.resumeId === resumeId ? 'My Resume' : s.resumeTitle,
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete resume:', error);
      return false;
    }
  },

  duplicateResume: async (resumeId) => {
    try {
      const response = await resumeAPI.duplicate(resumeId);
      const newResume = response.data;
      
      set((s) => ({
        resumeList: [newResume, ...s.resumeList],
      }));
      
      return newResume;
    } catch (error) {
      console.error('Failed to duplicate resume:', error);
      return null;
    }
  },

  renameResume: (title) => set({ resumeTitle: title, isDirty: true }),

  // Bulk set resume data (for importing from PDF)
  setResumeData: (data) => set((s) => ({
    resumeData: { ...s.resumeData, ...data },
    isDirty: true,
  })),

  // ─── Actions ─────────────────────────────────────────────────
  setActiveSection: (section) => set({ activeSection: section }),

  updateBasicInfo: (fields) => set((s) => ({
    resumeData: { ...s.resumeData, basicInfo: { ...s.resumeData.basicInfo, ...fields } },
    isDirty: true,
  })),

  setSummary: (text) => set((s) => ({
    resumeData: { ...s.resumeData, summary: text }, isDirty: true,
  })),

  setProfileType: (type) => set((s) => ({
    resumeData: { ...s.resumeData, profileType: type }, isDirty: true,
  })),

  setHasInternship: (val) => set((s) => ({
    resumeData: { ...s.resumeData, hasInternship: val }, isDirty: true,
  })),

  // Experience
  addExperience: () => set((s) => ({
    resumeData: {
      ...s.resumeData,
      experience: [...s.resumeData.experience, {
        id: uuidv4(), jobTitle: '', company: '', startDate: '', endDate: '',
        currentlyWorking: false, industry: '', description: '',
      }],
    }, isDirty: true,
  })),

  updateExperience: (id, fields) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      experience: s.resumeData.experience.map(e => e.id === id ? { ...e, ...fields } : e),
    }, isDirty: true,
  })),

  removeExperience: (id) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      experience: s.resumeData.experience.filter(e => e.id !== id),
    }, isDirty: true,
  })),

  // Internship
  addInternship: () => set((s) => ({
    resumeData: {
      ...s.resumeData,
      internships: [...s.resumeData.internships, {
        id: uuidv4(), role: '', company: '', startDate: '', endDate: '', description: '',
        currentlyWorking: false,
      }],
    }, isDirty: true,
  })),

  updateInternship: (id, fields) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      internships: s.resumeData.internships.map(i => i.id === id ? { ...i, ...fields } : i),
    }, isDirty: true,
  })),

  removeInternship: (id) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      internships: s.resumeData.internships.filter(i => i.id !== id),
    }, isDirty: true,
  })),

  // Education
  addEducation: () => set((s) => ({
    resumeData: {
      ...s.resumeData,
      education: [...s.resumeData.education, {
        id: uuidv4(), degree: '', institution: '', startDate: '', endDate: '', cgpa: '', location: '',
      }],
    }, isDirty: true,
  })),

  updateEducation: (id, fields) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      education: s.resumeData.education.map(e => e.id === id ? { ...e, ...fields } : e),
    }, isDirty: true,
  })),

  removeEducation: (id) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      education: s.resumeData.education.filter(e => e.id !== id),
    }, isDirty: true,
  })),

  // Projects
  addProject: () => set((s) => ({
    resumeData: {
      ...s.resumeData,
      projects: [...s.resumeData.projects, {
        id: uuidv4(), title: '', description: '', techStack: [], link: '',
      }],
    }, isDirty: true,
  })),

  updateProject: (id, fields) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      projects: s.resumeData.projects.map(p => p.id === id ? { ...p, ...fields } : p),
    }, isDirty: true,
  })),

  removeProject: (id) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      projects: s.resumeData.projects.filter(p => p.id !== id),
    }, isDirty: true,
  })),

  // Skills
  updateSkills: (category, skills) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      skills: { ...s.resumeData.skills, [category]: skills },
    }, isDirty: true,
  })),

  // Certifications
  addCertification: () => set((s) => ({
    resumeData: {
      ...s.resumeData,
      certifications: [...s.resumeData.certifications, { id: uuidv4(), name: '', issuer: '', date: '' }],
    }, isDirty: true,
  })),

  updateCertification: (id, fields) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      certifications: s.resumeData.certifications.map(c => c.id === id ? { ...c, ...fields } : c),
    }, isDirty: true,
  })),

  removeCertification: (id) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      certifications: s.resumeData.certifications.filter(c => c.id !== id),
    }, isDirty: true,
  })),

  // Achievements
  addAchievement: () => set((s) => ({
    resumeData: {
      ...s.resumeData,
      achievements: [...s.resumeData.achievements, { id: uuidv4(), title: '', description: '' }],
    }, isDirty: true,
  })),

  updateAchievement: (id, fields) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      achievements: s.resumeData.achievements.map(a => a.id === id ? { ...a, ...fields } : a),
    }, isDirty: true,
  })),

  removeAchievement: (id) => set((s) => ({
    resumeData: {
      ...s.resumeData,
      achievements: s.resumeData.achievements.filter(a => a.id !== id),
    }, isDirty: true,
  })),

  // Template
  setTemplate: (template) => {
    const id = typeof template === 'string' ? template : template.id;
    set({ 
      selectedTemplate: id, 
      selectedTemplateMeta: typeof template === 'string' ? null : template,
      isDirty: true 
    });
  },

  // ATS Score
  setAtsScore: (score, feedback) => set({ atsScore: score, atsFeedback: feedback }),

  // Update resume ATS score
  updateResumeAtsScore: async (resumeId, atsScore, atsData) => {
    try {
      await resumeAPI.update(resumeId, { atsScore, atsData: JSON.stringify(atsData) });
      set((s) => ({
        resumeList: s.resumeList.map(r => 
          r.id === resumeId 
            ? { ...r, ats_score: atsScore, ats_data: JSON.stringify(atsData), updated_at: new Date().toISOString() }
            : r
        ),
      }));
      return true;
    } catch (error) {
      console.error('Failed to update ATS score:', error);
      return false;
    }
  },

  // PDF Generation
  setGeneratingPDF: (val) => set({ isGeneratingPDF: val }),

  // Font
  setFontSize: (size) => set({ fontSize: size }),
  setFontFamily: (family) => set({ fontFamily: family }),

  // Reset current resume (keeps list)
  resetResume: () => set({
    resumeData: defaultResumeData,
    atsScore: 0,
    atsFeedback: [],
    isDirty: false,
  }),

  // Clear everything (for logout-like behavior)
  clearAll: () => set({
    resumeId: null,
    resumeTitle: 'My Resume',
    resumeData: defaultResumeData,
    resumeList: [],
    isDirty: false,
    error: null,
  }),

  // Plan & Credits
  setUserPlan: (plan) => set({ userPlan: plan }),
  setCredits: (credits) => set((s) => ({ userPlan: { ...s.userPlan, credits } })),
  showUpsell: (reason = 'payment') => set({ showUpsellModal: true, upsellReason: reason }),
  hideUpsell: () => set({ showUpsellModal: false }),

  // Check if all sections completed
  isAllSectionsCompleted: () => {
    const d = get().resumeData;
    const hasBasic = d.basicInfo?.fullName && d.basicInfo?.email;
    const hasSummary = !!d.summary;
    const hasExperience = d.experience?.length > 0 || d.profileType === 'fresher';
    const hasEducation = d.education?.length > 0;
    const hasProjects = d.projects?.length > 0 || d.profileType === 'experienced';
    const hasSkills = Object.values(d.skills || {}).some(arr => arr?.length > 0);
    const hasCertifications = d.certifications?.length > 0 || d.profileType === 'fresher';
    const hasAchievements = d.achievements?.length > 0 || d.profileType === 'experienced';
    return hasBasic && hasSummary && hasExperience && hasEducation && hasProjects && hasSkills && hasCertifications && hasAchievements;
  },
}));

export default useResumeStore;