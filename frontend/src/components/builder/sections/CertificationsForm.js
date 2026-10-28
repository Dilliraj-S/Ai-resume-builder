import React from 'react';
import useResumeStore from '../../../store/resumeStore';
import '../BuilderForm.css';

function CertEntry({ cert, onUpdate, onRemove }) {
  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span className="entry-card-title">Certification: {cert.name || 'New Certification'}</span>
        <button className="remove-btn" onClick={() => onRemove(cert.id)}>x</button>
      </div>
      <div className="form-grid-2">
        <div className="form-group form-full">
          <label className="form-label">Certification Name *</label>
          <input className="form-input" value={cert.name} placeholder="AWS Solutions Architect Associate"
            onChange={e => onUpdate(cert.id, { name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Issuing Organization</label>
          <input className="form-input" value={cert.organization} placeholder="Amazon Web Services"
            onChange={e => onUpdate(cert.id, { organization: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Year</label>
          <input className="form-input" value={cert.year} placeholder="2024"
            onChange={e => onUpdate(cert.id, { year: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export default function CertificationsForm() {
  const { resumeData, addCertification, updateCertification, removeCertification } = useResumeStore();

  return (
    <div className="form-section animate-fade-in">
      <div className="form-section-header">
        <div className="form-section-title">
          <span className="form-section-icon">C</span>
          <div>
            <h2>Certifications</h2>
            <p className="form-section-desc">Professional certifications and credentials</p>
          </div>
        </div>
      </div>
      {resumeData.certifications.map(c => (
        <CertEntry key={c.id} cert={c} onUpdate={updateCertification} onRemove={removeCertification} />
      ))}
      <button className="add-entry-btn" onClick={addCertification}>+ Add Certification</button>
    </div>
  );
}
