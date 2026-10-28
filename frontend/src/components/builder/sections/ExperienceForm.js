import React, { useState } from 'react';
import useResumeStore from '../../../store/resumeStore';
import { aiAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import '../BuilderForm.css';

function ExperienceEntry({ exp, onUpdate, onRemove }) {
  const [loading, setLoading] = useState(false);

  const handleAI = async () => {
    if (!exp.description?.trim()) return toast.error('Add a description first');
    setLoading(true);
    const tid = toast.loading('Enhancing with AI…');
    try {
      const res = await aiAPI.enhanceExperience({ role: exp.jobTitle, company: exp.company, description: exp.description, industry: exp.industry });
      onUpdate(exp.id, { description: res.data.content });
      toast.success(`Experience enhanced!`, { id: tid });
    } catch (err) { 
      toast.error(err.message, { id: tid }); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span className="entry-card-title">💼 {exp.jobTitle || 'New Experience'}</span>
        <button className="remove-btn" onClick={() => onRemove(exp.id)}>✕</button>
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Job Title *</label>
          <input className="form-input" value={exp.jobTitle} placeholder="Software Engineer"
            onChange={e => onUpdate(exp.id, { jobTitle: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Company *</label>
          <input className="form-input" value={exp.company} placeholder="Acme Corp"
            onChange={e => onUpdate(exp.id, { company: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Industry</label>
          <input className="form-input" value={exp.industry || ''} placeholder="Technology"
            onChange={e => onUpdate(exp.id, { industry: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input className="form-input" type="month" value={exp.startDate}
            onChange={e => onUpdate(exp.id, { startDate: e.target.value })} />
        </div>
        <div className="form-group">
          {!exp.currentlyWorking && (
            <>
              <label className="form-label">End Date</label>
              <input className="form-input" type="month" value={exp.endDate}
                onChange={e => onUpdate(exp.id, { endDate: e.target.value })} />
            </>
          )}
          <label className="checkbox-row" style={{ marginTop: exp.currentlyWorking ? 0 : 10 }}>
            <input type="checkbox" checked={exp.currentlyWorking}
              onChange={e => onUpdate(exp.id, { currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })} />
            <span>Currently Working Here</span>
          </label>
        </div>
        <div className="form-group form-full">
          <label className="form-label">Description / Responsibilities</label>
          <textarea className="form-textarea" style={{ minHeight: 110 }} value={exp.description}
            placeholder="• Developed RESTful APIs serving 50k+ daily users&#10;• Reduced query time by 60% through indexing"
            onChange={e => onUpdate(exp.id, { description: e.target.value })} />
          <div className="form-actions" style={{ paddingTop: 10, marginTop: 8 }}>
            <button className="ai-button" onClick={handleAI} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:14,height:14}} /> Enhancing…</> : '✨ Improve with AI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InternshipEntry({ intern, onUpdate, onRemove }) {
  const [loading, setLoading] = useState(false);

  const handleAI = async () => {
    if (!intern.description?.trim()) return toast.error('Add a description first');
    setLoading(true);
    const tid = toast.loading('Enhancing internship…');
    try {
      const res = await aiAPI.enhanceInternship({ role: intern.role, company: intern.company, description: intern.description });
      onUpdate(intern.id, { description: res.data.content });
      toast.success(`Internship enhanced!`, { id: tid });
    } catch (err) { 
      toast.error(err.message, { id: tid }); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="entry-card" style={{ borderColor: '#0891b2' }}>
      <div className="entry-card-header">
        <span className="entry-card-title">🎒 {intern.role || 'New Internship'}</span>
        <button className="remove-btn" onClick={() => onRemove(intern.id)}>✕</button>
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Role / Position *</label>
          <input className="form-input" value={intern.role} placeholder="Frontend Intern"
            onChange={e => onUpdate(intern.id, { role: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Company *</label>
          <input className="form-input" value={intern.company} placeholder="Startup Inc."
            onChange={e => onUpdate(intern.id, { company: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input className="form-input" type="month" value={intern.startDate}
            onChange={e => onUpdate(intern.id, { startDate: e.target.value })} />
        </div>
        <div className="form-group">
          {!intern.currentlyWorking && (
            <>
              <label className="form-label">End Date</label>
              <input className="form-input" type="month" value={intern.endDate}
                onChange={e => onUpdate(intern.id, { endDate: e.target.value })} />
            </>
          )}
          <label className="checkbox-row" style={{ marginTop: intern.currentlyWorking ? 0 : 10 }}>
            <input type="checkbox" checked={intern.currentlyWorking}
              onChange={e => onUpdate(intern.id, { currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : intern.endDate })} />
            <span>Currently Working Here</span>
          </label>
        </div>
        <div className="form-group form-full">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" style={{ minHeight: 90 }} value={intern.description}
            placeholder="• Built React components for the dashboard&#10;• Collaborated with senior engineers on API integration"
            onChange={e => onUpdate(intern.id, { description: e.target.value })} />
          <div className="form-actions" style={{ paddingTop: 10, marginTop: 8 }}>
            <button className="ai-button" onClick={handleAI} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:14,height:14}} /> Enhancing…</> : '✨ Improve with AI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExperienceForm() {
  const { resumeData, setProfileType, setHasInternship,
    addExperience, updateExperience, removeExperience,
    addInternship, updateInternship, removeInternship } = useResumeStore();

  const { profileType, hasInternship, experience, internships } = resumeData;

  return (
    <div className="form-section animate-fade-in">
      <div className="form-section-header">
        <div className="form-section-title">
          <span className="form-section-icon">💼</span>
          <div>
            <h2>Experience</h2>
            <p className="form-section-desc">Work history and internships</p>
          </div>
        </div>
      </div>

      {/* Profile Type Toggle */}
      <div className="profile-toggle">
        <button className={`profile-toggle-btn ${profileType === 'fresher' ? 'active' : ''}`}
          onClick={() => setProfileType('fresher')}>
          🎓 Fresher
        </button>
        <button className={`profile-toggle-btn ${profileType === 'experienced' ? 'active' : ''}`}
          onClick={() => setProfileType('experienced')}>
          💼 Working Professional
        </button>
      </div>

      {profileType === 'fresher' && (
        <>
          <div className="internship-toggle-row">
            <label className="checkbox-row">
              <input type="checkbox" checked={hasInternship}
                onChange={e => setHasInternship(e.target.checked)} />
              <span style={{ fontWeight: 600 }}>I have internship experience</span>
            </label>
          </div>

          {hasInternship && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>
                Internship Experience
              </div>
              {internships.map(i => (
                <InternshipEntry key={i.id} intern={i} onUpdate={updateInternship} onRemove={removeInternship} />
              ))}
              <button className="add-entry-btn" onClick={addInternship}>
                + Add Internship
              </button>
            </div>
          )}
        </>
      )}

      {profileType === 'experienced' && (
        <div style={{ marginTop: 8 }}>
          {experience.map(exp => (
            <ExperienceEntry key={exp.id} exp={exp} onUpdate={updateExperience} onRemove={removeExperience} />
          ))}
          <button className="add-entry-btn" onClick={addExperience}>
            + Add Work Experience
          </button>
        </div>
      )}
    </div>
  );
}
