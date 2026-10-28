import React, { useMemo, useState } from 'react';
import useResumeStore from '../../../store/resumeStore';
import { aiAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import '../BuilderForm.css';

const STACK_SUGGESTIONS = [
  'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL',
  'TypeScript', 'Tailwind', 'Redux', 'Python', 'Django', 'FastAPI',
  'AWS', 'Docker', 'Kubernetes', 'Firebase', 'Stripe', 'Razorpay'
];

function TagsInput({ value = [], onChange, placeholder }) {
  const [inputVal, setInputVal] = useState('');

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInputVal('');
  };

  const handleKeyDown = (e) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const suggestions = useMemo(() => {
    const q = inputVal.trim().toLowerCase();
    if (!q) return [];
    return STACK_SUGGESTIONS.filter(s => !value.includes(s))
      .filter(s => s.toLowerCase().includes(q))
      .slice(0, 6);
  }, [inputVal, value]);

  return (
    <div className="form-input tags-input-wrapper" style={{ minHeight: 48, flexWrap: 'wrap', padding: '8px 10px' }}>
      {value.map(tag => (
        <span className="tag-chip" key={tag}>
          {tag}
          <button onClick={() => onChange(value.filter(t => t !== tag))}>x</button>
        </span>
      ))}
      <input
        className="tag-input-field"
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputVal && addTag(inputVal)}
        placeholder={value.length === 0 ? placeholder : ''}
      />
      {suggestions.length > 0 && (
        <div className="skill-suggestion-list" style={{ marginTop: 8 }}>
          {suggestions.map(s => (
            <button
              type="button"
              key={s}
              className="skill-suggestion-item"
              onMouseDown={() => addTag(s)}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectEntry({ project, onUpdate, onRemove }) {
  const [loading, setLoading] = useState(false);

  const handleAI = async () => {
    if (!project.description?.trim()) return toast.error('Add a description first');
    setLoading(true);
    const tid = toast.loading('Enhancing project description...');
    try {
      const res = await aiAPI.enhanceProject({
        title: project.title,
        description: project.description,
        techStack: project.techStack,
      });
      onUpdate(project.id, { description: res.data.content });
      toast.success(`Project enhanced!`, { id: tid });
    } catch (err) { 
      toast.error(err.message, { id: tid }); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span className="entry-card-title">Project: {project.title || 'New Project'}</span>
        <button className="remove-btn" onClick={() => onRemove(project.id)}>x</button>
      </div>
      <div className="form-grid-2">
        <div className="form-group form-full">
          <label className="form-label">Project Title *</label>
          <input className="form-input" value={project.title} placeholder="E-commerce Platform"
            onChange={e => onUpdate(project.id, { title: e.target.value })} />
        </div>
        <div className="form-group form-full">
          <label className="form-label">Tech Stack</label>
          <TagsInput
            value={project.techStack}
            onChange={val => onUpdate(project.id, { techStack: val })}
            placeholder="Type tech name and press Enter (React, Node.js, MongoDB...)"
          />
          <div className="text-xs text-slate-500 mt-2">Tip: add 6-12 technologies per project for stronger ATS matching.</div>
        </div>
        <div className="form-group">
          <label className="form-label">Live URL</label>
          <input className="form-input" value={project.liveUrl || ''} placeholder="https://myproject.vercel.app"
            onChange={e => onUpdate(project.id, { liveUrl: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">GitHub URL</label>
          <input className="form-input" value={project.githubUrl || ''} placeholder="github.com/user/project"
            onChange={e => onUpdate(project.id, { githubUrl: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input className="form-input" type="month" value={project.startDate || ''}
            onChange={e => onUpdate(project.id, { startDate: e.target.value })} />
        </div>
        {!project.currentlyWorking && (
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input className="form-input" type="month" value={project.endDate || ''}
              onChange={e => onUpdate(project.id, { endDate: e.target.value })} />
          </div>
        )}
        <div className="form-group">
          <label className="checkbox-row">
            <input type="checkbox" checked={project.currentlyWorking || false}
              onChange={e => onUpdate(project.id, { currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : project.endDate })} />
            <span>Currently Doing</span>
          </label>
        </div>
        <div className="form-group form-full">
          <label className="form-label">Description / Key Features</label>
          <textarea className="form-textarea" style={{ minHeight: 110 }} value={project.description}
            placeholder="- Built a full-stack e-commerce platform with real-time inventory management\n- Implemented JWT auth and integrated payment gateway"
            onChange={e => onUpdate(project.id, { description: e.target.value })} />
          <div className="form-actions" style={{ marginTop: 10, paddingTop: 10 }}>
            <button className="ai-button" onClick={handleAI} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:14,height:14}}/> Enhancing...</> : 'Improve with AI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsForm() {
  const { resumeData, addProject, updateProject, removeProject } = useResumeStore();

  return (
    <div className="form-section animate-fade-in">
      <div className="form-section-header">
        <div className="form-section-title">
          <span className="form-section-icon">P</span>
          <div>
            <h2>Projects</h2>
            <p className="form-section-desc">Showcase real-world projects with measurable impact</p>
          </div>
        </div>
      </div>

      {resumeData.projects.map(p => (
        <ProjectEntry key={p.id} project={p} onUpdate={updateProject} onRemove={removeProject} />
      ))}

      <button className="add-entry-btn" onClick={addProject}>
        + Add Project
      </button>
    </div>
  );
}
