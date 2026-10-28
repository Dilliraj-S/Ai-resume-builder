import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, FileText, Upload, Layout, Trash2, Copy, Download, Plus, 
  X, LogOut, Star, CheckCircle, Sparkles, Moon, Sun
} from 'lucide-react';
import resumeStore from '../store/resumeStore';
import themeStore from '../store/themeStore';
import { authAPI, resumeAPI, analyticsAPI, resumeParserAPI } from '../services/api';
import { pdfAPI } from '../services/api';
import ResumeUpload from '../components/home/ResumeUpload';
import { TEMPLATES } from '../components/templates/templateData';
import PreviewSkeleton from '../components/preview/PreviewSkeleton';
import toast from 'react-hot-toast';

const useResumeStore = resumeStore;
const useThemeStore = themeStore;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { resumeList, loadResumes, createNewResume, setResumeId, setResumeData, loadResume } = useResumeStore();
  const { darkMode, toggleDarkMode } = useThemeStore();
  
  const [activeSection, setActiveSection] = useState('recent');
  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  const colors = darkMode ? {
    bg: '#0f172a', surface: '#1e293b', text: '#f1f5f9', textMuted: '#94a3b8',
    border: '#334155', accent: '#6366f1'
  } : {
    bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b',
    border: '#e2e8f0', accent: '#6366f1'
  };

  useEffect(() => {
    const token = localStorage.getItem('rb_token');
    if (!token) {
      navigate('/?login=true');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, resumesRes] = await Promise.all([
        authAPI.me().catch(() => null),
        resumeAPI.getMyResumes().catch(() => ({ data: [] }))
      ]);
      
      if (userRes?.data?.user) setUser(userRes.data.user);
      if (resumesRes?.data) loadResumes(resumesRes.data);
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleNewResume = async () => {
    const resume = await createNewResume('Untitled Resume');
    if (resume) navigate(`/builder/${resume.id}`);
  };

  const handleFileDrop = async (file) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF or DOCX file');
      return;
    }
    toast.loading('Parsing & analyzing resume...', { duration: 5000 });
    try {
      const parseResult = await resumeAPI.parseResumeFile(file);
      if (!parseResult?.success || !parseResult?.data?.parsedResume) {
        toast.error('Could not parse. Creating empty resume instead...');
        const resume = await createNewResume(file.name.replace(/\.[^/.]+$/, '') || 'Imported Resume');
        if (resume) {
          loadData();
          navigate(`/builder/${resume.id}`);
        }
        return;
      }
      
      const parsedResume = parseResult.data.parsedResume;
      
      let atsScore = 0;
      try {
        const atsResult = await resumeParserAPI.analyze(parsedResume);
        if (atsResult?.success) {
          atsScore = atsResult.data?.score || 0;
        }
      } catch (atsErr) {
        console.warn('ATS analysis failed:', atsErr.message);
      }
      
      toast.loading('Creating resume...', { duration: 3000 });
      const resume = await createNewResume(file.name.replace(/\.[^/.]+$/, '') || 'Imported Resume', atsScore, 'modern-1', parsedResume);
      if (resume) {
        toast.success(`Resume imported! ATS Score: ${atsScore}`);
        loadData();
        navigate(`/builder/${resume.id}`);
      }
    } catch (err) {
      console.error('[DROP] Error:', err);
      const resume = await createNewResume(file.name.replace(/\.[^/.]+$/, '') || 'Imported Resume');
      if (resume) {
        loadData();
        navigate(`/builder/${resume.id}`);
      }
    }
  };

  const handleOpenResume = async (resume) => {
    const success = await loadResume(resume.id);
    if (success) {
      navigate(`/builder/${resume.id}`);
    }
  };

  const handleDeleteResume = async (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this resume?')) {
      try {
        const res = await resumeAPI.delete(id);
        if (res.success !== false) {
          toast.success('Resume deleted');
          loadData();
        }
      } catch (err) {
        console.log('Delete error (may already be deleted):', err.message);
        loadData();
      }
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    await resumeAPI.duplicate(id);
    toast.success('Resume duplicated');
    loadData();
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const getAtsBadge = (score) => {
    if (!score) return null;
    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
    return (
      <span style={{ background: color, color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
        ATS {score}
      </span>
    );
  };

  const templates = [
    { id: 'modern-1', name: 'Modern', color: '#6366f1' },
    { id: 'minimal-1', name: 'Minimal', color: '#0f172a' },
    { id: 'creative-1', name: 'Creative', color: '#ec4899' },
    { id: 'classic-1', name: 'Classic', color: '#64748b' },
    { id: 'ATS-optimized', name: 'ATS Safe', color: '#22c55e' },
    { id: 'executive-1', name: 'Executive', color: '#1e293b' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg }}>
      {/* Sidebar */}
      <div style={{ width: '260px', background: colors.surface, borderRight: `1px solid ${colors.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: colors.text, marginBottom: '30px' }}>ResumeAI</h1>

        <div style={{ flex: 1 }}>
          {[
            { id: 'recent', icon: Home, label: 'Home', desc: 'Recent resumes' },
            { id: 'templates', icon: Layout, label: 'Templates', desc: 'Browse templates' },
            { id: 'ats', icon: Upload, label: 'ATS Checker', desc: 'Upload & analyze' },
          ].map(item => (
            <div key={item.id} onClick={() => item.id === 'ats' ? setShowUpload(true) : item.id === 'templates' ? setActiveSection('templates') : setActiveSection('recent')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px', background: activeSection === item.id ? '#f1f5f9' : 'transparent', color: activeSection === item.id ? '#0f172a' : '#64748b' }}>
              <item.icon size={20} />
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
          <button onClick={toggleDarkMode} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px', marginBottom: '12px', background: 'none', border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, cursor: 'pointer', fontSize: '14px' }}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: '600' }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: '500', fontSize: '14px', color: colors.text }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '14px' }}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '30px', overflow: 'auto' }}>
        {activeSection === 'recent' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>
                  Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                </h2>
                <p style={{ color: colors.textMuted }}>Here's what's happening with your resumes</p>
              </div>
              <button onClick={handleNewResume} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                <Plus size={18} /> Create Resume
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
              {[
                { label: 'Total Resumes', value: stats?.data?.totalResumes || resumeList.length || 0, icon: FileText },
                { label: 'ATS Checks Used', value: stats?.data?.atsChecksUsed || 0, icon: CheckCircle },
                { label: 'Downloads', value: stats?.data?.downloadsUsed || 0, icon: Download },
                { label: 'AI Enhancements', value: stats?.data?.aiEnhancements || 0, icon: Sparkles },
              ].map((stat, i) => (
                <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>{stat.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '30px' }}>
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileDrop(file);
                }}
                style={{ 
                  background: isDragging ? 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
                  padding: '24px', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isDragging ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <Upload size={24} style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Import Resume</h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Drag & drop to import directly to builder</p>
              </div>
              <div onClick={() => navigate('/pricing')} style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <Star size={24} style={{ marginBottom: '12px', color: '#f59e0b' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>Upgrade Plan</h3>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Get more downloads and AI credits</p>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Recent Resumes</h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{resumeList.length} resumes</span>
              </div>
              
              {resumeList.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <FileText size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                  <p style={{ color: '#64748b', marginBottom: '20px' }}>No resumes yet. Create your first one!</p>
                  <button onClick={handleNewResume} style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                    Create Resume
                  </button>
                </div>
              ) : (
                resumeList.slice(0, 10).map((resume, i) => (
                  <div key={resume.id} onClick={() => handleOpenResume(resume)} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: i < resumeList.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer' }}>
                    <FileText size={20} style={{ color: '#6366f1', marginRight: '16px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#0f172a', marginBottom: '2px' }}>{resume.title || 'Untitled'}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{resume.template_id?.replace('-', ' ') || 'Modern'} • Updated {formatDate(resume.updated_at)}</div>
                    </div>
                    {getAtsBadge(resume.ats_score)}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                      <button onClick={(e) => handleDuplicate(resume.id, e)} title="Duplicate" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Copy size={16} /></button>
                      <button onClick={(e) => handleDeleteResume(resume.id, e)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeSection === 'templates' && (
          <>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>Templates</h2>
              <p style={{ color: colors.textMuted }}>Choose a template to get started</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {TEMPLATES.slice(0, 6).map((template) => (
                <div key={template.id} onClick={async () => { 
                  const resume = await createNewResume('New Resume', null, template.id); 
                  if (resume) navigate(`/builder/${resume.id}`); 
                }}
                  style={{ background: colors.surface, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div style={{ height: '180px', background: '#fff', overflow: 'hidden' }}>
                    <PreviewSkeleton templateId={template.id} />
                  </div>
                  <div style={{ padding: '16px', borderTop: `1px solid ${colors.border}` }}>
                    <div style={{ fontWeight: '600', color: colors.text }}>{template.name}</div>
                    <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>{template.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowUpload(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Upload & Analyze Resume</h2>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <ResumeUpload user={user} onImportComplete={async (parsed, ats) => { setShowUpload(false); if (parsed) { const resume = await createNewResume('Imported Resume', ats?.score); if (resume) navigate(`/builder/${resume.id}`); } }} />
          </div>
        </div>
      )}
    </div>
  );
}