import React from 'react';
import useResumeStore from '../../../store/resumeStore';
import '../BuilderForm.css';

function EducationEntry({ edu, onUpdate, onRemove }) {
  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span className="entry-card-title">🎓 {edu.college || 'New Education'}</span>
        <button className="remove-btn" onClick={() => onRemove(edu.id)}>✕</button>
      </div>
      <div className="form-grid-2">
        <div className="form-group form-full">
          <label className="form-label">College / University *</label>
          <input className="form-input" value={edu.college} placeholder="IIT Bombay"
            onChange={e => onUpdate(edu.id, { college: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Degree *</label>
          <input className="form-input" value={edu.degree} placeholder="B.Tech Computer Science"
            onChange={e => onUpdate(edu.id, { degree: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Graduation Year</label>
          <input className="form-input" value={edu.year} placeholder="2024"
            onChange={e => onUpdate(edu.id, { year: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">CGPA / Percentage</label>
          <input className="form-input" value={edu.cgpa} placeholder="8.5 / 10"
            onChange={e => onUpdate(edu.id, { cgpa: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export default function EducationForm() {
  const { resumeData, addEducation, updateEducation, removeEducation } = useResumeStore();

  return (
    <div className="form-section animate-fade-in">
      <div className="form-section-header">
        <div className="form-section-title">
          <span className="form-section-icon">🎓</span>
          <div>
            <h2>Education</h2>
            <p className="form-section-desc">Academic qualifications and degrees</p>
          </div>
        </div>
      </div>

      {resumeData.education.map(edu => (
        <EducationEntry key={edu.id} edu={edu} onUpdate={updateEducation} onRemove={removeEducation} />
      ))}

      <button className="add-entry-btn" onClick={addEducation}>
        + Add Education
      </button>
    </div>
  );
}
