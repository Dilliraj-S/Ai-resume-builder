import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useResumeStore from '../../store/resumeStore';
import { Trash2, Copy, Edit, Plus, FileText, Loader } from 'lucide-react';
import './ResumeList.css';

export default function ResumeList({ onClose }) {
  const navigate = useNavigate();
  const {
    resumeList,
    isLoadingResumes,
    loadResumes,
    createNewResume,
    loadResume,
    deleteResume,
    duplicateResume,
    resumeId,
  } = useResumeStore();

  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const handleCreateNew = async () => {
    setIsCreating(true);
    const newResume = await createNewResume('My Resume');
    if (newResume) {
      navigate('/builder');
      if (onClose) onClose();
    }
    setIsCreating(false);
  };

  const handleSelectResume = async (id) => {
    await loadResume(id);
    navigate('/builder');
    if (onClose) onClose();
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    await duplicateResume(id);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await deleteResume(id);
    setShowDeleteConfirm(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoadingResumes) {
    return (
      <div className="resume-list-loading">
        <Loader className="spin" size={24} />
        <p>Loading your resumes...</p>
      </div>
    );
  }

  return (
    <div className="resume-list-container">
      <div className="resume-list-header">
        <h3>Your Resumes</h3>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={handleCreateNew}
          disabled={isCreating}
        >
          {isCreating ? <Loader size={16} className="spin" /> : <Plus size={16} />}
          New Resume
        </button>
      </div>

      {resumeList.length === 0 ? (
        <div className="resume-list-empty">
          <FileText size={48} />
          <p>No resumes yet</p>
          <button className="btn btn-primary" onClick={handleCreateNew}>
            Create Your First Resume
          </button>
        </div>
      ) : (
        <div className="resume-list-items">
          {resumeList.map((resume) => (
            <div
              key={resume.id}
              className={`resume-list-item ${resume.id === resumeId ? 'active' : ''}`}
              onClick={() => handleSelectResume(resume.id)}
            >
              <div className="resume-item-icon">
                <FileText size={20} />
              </div>
              <div className="resume-item-info">
                <h4>{resume.title || 'Untitled Resume'}</h4>
                <p>
                  {resume.template_id?.replace('-', ' ') || 'Modern'} • Updated {formatDate(resume.updated_at)}
                </p>
                {resume.ats_score ? (
                  <div className="resume-item-ats">
                    <span className={`ats-badge ${resume.ats_score >= 75 ? 'good' : resume.ats_score >= 50 ? 'medium' : 'low'}`}>
                      ATS: {resume.ats_score}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="resume-item-actions">
                <button
                  className="icon-btn"
                  onClick={(e) => handleDuplicate(resume.id, e)}
                  title="Duplicate"
                >
                  <Copy size={16} />
                </button>
                {resumeList.length > 1 && (
                  <button
                    className="icon-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(resume.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {showDeleteConfirm === resume.id && (
                <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                  <p>Delete this resume?</p>
                  <div className="delete-confirm-actions">
                    <button onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                    <button className="danger" onClick={(e) => handleDelete(resume.id, e)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {resumeList.length > 0 && (
        <div className="resume-list-footer">
          <button className="btn btn-outline" onClick={handleCreateNew}>
            <Plus size={16} /> Create New Resume
          </button>
        </div>
      )}
    </div>
  );
}