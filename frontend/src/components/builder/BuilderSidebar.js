import React from 'react';
import useResumeStore from '../../store/resumeStore';
import './BuilderSidebar.css';

export default function BuilderSidebar({ sections, activeSection, onSelect }) {
  const { resumeData } = useResumeStore();

  const getSectionStatus = (id) => {
    const d = resumeData;
    switch (id) {
      case 'basicInfo':      return d.basicInfo?.fullName && d.basicInfo?.email ? 'done' : 'empty';
      case 'summary':        return d.summary?.length > 30 ? 'done' : 'empty';
      case 'experience':     return (d.experience?.length > 0 || d.internships?.length > 0) ? 'done' : 'empty';
      case 'education':      return d.education?.length > 0 ? 'done' : 'empty';
      case 'projects':       return d.projects?.length > 0 ? 'done' : 'empty';
      case 'skills':         return Object.values(d.skills || {}).flat().length > 3 ? 'done' : 'empty';
      case 'certifications': return d.certifications?.length > 0 ? 'done' : 'empty';
      case 'achievements':   return d.achievements?.length > 0 ? 'done' : 'empty';
      default:               return 'empty';
    }
  };

  return (
    <nav className="sidebar-nav">
      <div className="sidebar-title">Sections</div>
      {sections.map(s => {
        const status = getSectionStatus(s.id);
        return (
          <button
            key={s.id}
            className={`sidebar-item ${activeSection === s.id ? 'active' : ''} ${status}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="sidebar-icon">{s.icon}</span>
            <span className="sidebar-label">{s.label}</span>
            {status === 'done' && <span className="sidebar-check">✓</span>}
          </button>
        );
      })}
    </nav>
  );
}
