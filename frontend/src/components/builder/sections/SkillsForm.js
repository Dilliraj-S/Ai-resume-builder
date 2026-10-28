import React, { useMemo, useState } from 'react';
import useResumeStore from '../../../store/resumeStore';
import { aiAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import '../BuilderForm.css';

const CATEGORIES = [
  { key: 'frontend', label: 'Frontend', placeholder: 'React, Vue, Next.js, HTML, CSS, Tailwind' },
  { key: 'backend', label: 'Backend', placeholder: 'Node.js, Express, Django, Spring Boot, FastAPI' },
  { key: 'database', label: 'Database', placeholder: 'PostgreSQL, MongoDB, MySQL, Redis, Firebase' },
  { key: 'cloud', label: 'Cloud & DevOps', placeholder: 'AWS, Azure, GCP, Docker, Kubernetes, CI/CD' },
  { key: 'data', label: 'Data', placeholder: 'SQL, Python, Pandas, Tableau, Power BI, ML' },
  { key: 'mobile', label: 'Mobile', placeholder: 'Flutter, React Native, Swift, Kotlin' },
  { key: 'design', label: 'Design', placeholder: 'Figma, UX, UI, Wireframing, Prototyping' },
  { key: 'business', label: 'Business', placeholder: 'Strategy, Operations, Analytics, CRM' },
  { key: 'finance', label: 'Finance', placeholder: 'Accounting, Financial Modeling, Excel, Auditing' },
  { key: 'marketing', label: 'Marketing', placeholder: 'SEO, SEM, Branding, Content, Growth' },
  { key: 'softskills', label: 'Soft Skills', placeholder: 'Communication, Leadership, Teamwork, Problem Solving' }
];

const SKILL_SUGGESTIONS = {
  frontend: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Angular', 'Tailwind', 'Redux', 'Vite', 'Sass', 'Figma'],
  backend: ['Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'NestJS', 'REST APIs', 'GraphQL', 'Microservices', 'JWT', 'OAuth'],
  database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'SQLite', 'SQL Server', 'DynamoDB', 'Indexing'],
  cloud: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Linux', 'Nginx', 'Terraform'],
  data: ['Python', 'SQL', 'Pandas', 'NumPy', 'Tableau', 'Power BI', 'Machine Learning', 'Statistics', 'Data Modeling'],
  mobile: ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Android', 'iOS'],
  design: ['Figma', 'UX Research', 'UI Design', 'Wireframing', 'Prototyping', 'Design Systems'],
  business: ['Strategy', 'Operations', 'Business Analysis', 'Project Management', 'Stakeholder Management', 'CRM'],
  finance: ['Accounting', 'Financial Modeling', 'Excel', 'Auditing', 'Taxation', 'Budgeting', 'Valuation'],
  marketing: ['SEO', 'SEM', 'Content Marketing', 'Branding', 'Market Research', 'Social Media', 'Email Marketing', 'Analytics'],
  softskills: ['Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management', 'Adaptability', 'Critical Thinking']
};

function SkillTag({ skill, onRemove }) {
  return (
    <span className="tag-chip" style={{ cursor: 'default' }}>
      {skill}
      <button onClick={() => onRemove(skill)}>x</button>
    </span>
  );
}

function SkillCategoryInput({ category, skills, onUpdate, onRemove }) {
  const [inputVal, setInputVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) onUpdate([...skills, trimmed]);
    setInputVal('');
  };

  const removeSkill = (skill) => onUpdate(skills.filter(s => s !== skill));

  const handleKeyDown = (e) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) { e.preventDefault(); addSkill(inputVal); }
    else if (e.key === 'Backspace' && !inputVal && skills.length > 0) onUpdate(skills.slice(0, -1));
  };

  const normalized = inputVal.trim().toLowerCase();
  const baseSuggestions = SKILL_SUGGESTIONS[category.key] || [];
  const filteredSuggestions = normalized
    ? baseSuggestions.filter(s => !skills.includes(s))
        .filter(s => s.toLowerCase().includes(normalized))
        .slice(0, 6)
    : [];

  return (
    <div className="skill-category-block">
      <div className="skill-cat-header">
        <strong>{category.label}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="skill-count">{skills.length} skills</span>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '14px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Remove category"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="skill-input-wrap">
        <div className="form-input tags-input-wrapper" style={{ minHeight: 46, padding: '6px 10px', flexWrap: 'wrap' }}>
          {skills.map(s => <SkillTag key={s} skill={s} onRemove={removeSkill} />)}
          <input
            className="tag-input-field"
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            placeholder={skills.length === 0 ? category.placeholder : ''}
          />
        </div>
        {showSuggestions && normalized && filteredSuggestions.length > 0 && (
          <div className="skill-suggestion-list">
            {filteredSuggestions.map(s => (
              <button
                type="button"
                key={s}
                className="skill-suggestion-item"
                onMouseDown={() => addSkill(s)}
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SkillsForm() {
  const { resumeData, updateSkillCategory, addSkillCategory, removeSkillCategory } = useResumeStore();
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState(null);
  const [customCategory, setCustomCategory] = useState('');

  const handleSuggestSkills = async () => {
    setLoading(true);
    const tid = toast.loading('AI is suggesting trending skills...');
    try {
      const res = await aiAPI.suggestSkills({
        jobTitle: resumeData.experience?.[0]?.jobTitle || '',
        currentSkills: Object.values(resumeData.skills || {}).flat(),
        experience: resumeData.profileType,
      });
      if (res.data.parsed) {
        setSuggested(res.data.parsed);
        toast.success(`Skills suggested!`, { id: tid });
      } else {
        toast.error('Could not parse suggestions', { id: tid });
      }
    } catch (err) { 
      toast.error(err.message, { id: tid }); 
    }
    finally { setLoading(false); }
  };

  const addSuggestedSkill = (cat, skill) => {
    const current = resumeData.skills[cat] || [];
    if (!current.includes(skill)) updateSkillCategory(cat, [...current, skill]);
  };

  const totalSkills = Object.values(resumeData.skills || {}).flat().length;

  const sortedCategories = useMemo(() => {
    const base = [...CATEGORIES];
    const baseKeys = new Set(base.map(b => b.key));
    const existingCustom = Object.keys(resumeData.skills || {})
      .filter(key => !baseKeys.has(key))
      .map(key => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' '), placeholder: 'Add skills separated by Enter' }));
    return [...base, ...existingCustom];
  }, [resumeData.skills]);

  const baseCategoryKeys = new Set(CATEGORIES.map(c => c.key));

  const handleAddCategory = () => {
    const key = customCategory.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key) return;
    if (!resumeData.skills[key]) addSkillCategory(key);
    setCustomCategory('');
  };

  const handleRemoveCategory = (key) => {
    removeSkillCategory(key);
  };

  return (
    <div className="form-section animate-fade-in">
      <div className="form-section-header">
        <div className="form-section-title">
          <span className="form-section-icon">S</span>
          <div>
            <h2>Skills</h2>
            <p className="form-section-desc">Type a skill and press Enter to add it</p>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: totalSkills >= 10 ? 'var(--success)' : 'var(--warning)' }}>
          {totalSkills} total · aim for 10+
        </span>
      </div>

      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Add Custom Skill Category</label>
        <div className="flex gap-2">
          <input
            className="form-input"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="e.g. Cybersecurity, Analytics, DevOps"
          />
          <button className="btn btn-primary" type="button" onClick={handleAddCategory}>Add</button>
        </div>
      </div>

      {sortedCategories.map(cat => (
        <SkillCategoryInput
          key={cat.key}
          category={cat}
          skills={resumeData.skills[cat.key] || []}
          onUpdate={(skills) => updateSkillCategory(cat.key, skills)}
          onRemove={!baseCategoryKeys.has(cat.key) ? () => handleRemoveCategory(cat.key) : null}
        />
      ))}

      <div className="form-actions">
        <button className="ai-button" onClick={handleSuggestSkills} disabled={loading}>
          {loading ? <><span className="spinner" style={{width:14,height:14}}/> Thinking...</> : 'Suggest Trending Skills'}
        </button>
      </div>

      {suggested && (
        <div className="suggestions-panel">
          <div className="suggestions-header">
            <strong>AI Suggestions - click to add</strong>
            <button onClick={() => setSuggested(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>x</button>
          </div>
          {Object.entries(suggested).map(([cat, skills]) =>
            skills?.length > 0 ? (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{cat}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {skills.map(skill => {
                    const catSkills = resumeData.skills[cat] || [];
                    const isAdded = catSkills.includes(skill);
                    return (
                      <button key={skill}
                        onClick={() => !isAdded && addSuggestedSkill(cat, skill)}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          border: '1.5px solid', cursor: isAdded ? 'default' : 'pointer',
                          background: isAdded ? 'rgba(34,197,94,0.1)' : 'white',
                          borderColor: isAdded ? '#22c55e' : 'var(--border-strong)',
                          color: isAdded ? '#15803d' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                        }}>
                        {isAdded ? 'Added ' : '+ '}{skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
