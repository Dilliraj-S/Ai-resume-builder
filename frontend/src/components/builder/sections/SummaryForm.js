import React, { useState } from 'react';
import useResumeStore from '../../../store/resumeStore';
import { aiAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import '../BuilderForm.css';

export default function SummaryForm() {
  const { resumeData, setSummary } = useResumeStore();
  const [loading, setLoading] = useState(false);

  const allSkills = Object.values(resumeData.skills || {}).flat();
  const expCount = (resumeData.experience || []).length;

  const handleAI = async (mode) => {
    if (!resumeData.summary?.trim()) return toast.error('Please enter your summary first');
    
    setLoading(true);
    const toastId = toast.loading(mode === 'grammar' ? 'Fixing grammar...' : 'Improving summary...');
    try {
      const res = mode === 'grammar'
        ? await aiAPI.fixGrammar({ text: resumeData.summary })
        : await aiAPI.enhanceSummary({
            currentSummary: resumeData.summary,
            jobTitle: resumeData.experience?.[0]?.jobTitle || '',
            skills: allSkills.slice(0, 8),
            experience: expCount > 0 ? `${expCount} years` : 'fresher',
          });
      setSummary(res.data.content);
      useResumeStore.getState().setCredits(res.credits.remaining);
      toast.success(mode === 'grammar' ? 'Grammar fixed!' : `Summary improved! (${res.credits.remaining} credits left)`, { id: toastId });
    } catch (err) {
      if (err.message?.includes('NO_CREDITS') || err.message?.includes('No AI credits')) {
        showUpsell('credits');
      }
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-section animate-fade-in">
      <div className="form-section-header">
        <div className="form-section-title">
          <span className="form-section-icon">📝</span>
          <div>
            <h2>Professional Summary</h2>
            <p className="form-section-desc">3–4 sentences that sell your profile to recruiters</p>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Summary</label>
        <textarea
          className="form-textarea"
          style={{ minHeight: 130 }}
          value={resumeData.summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="Results-driven professional with experience in ... Focused on impact and clear outcomes."
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {resumeData.summary?.length || 0} characters · aim for 200–400
          </span>
          <span style={{ fontSize: 12, color: resumeData.summary?.length >= 100 ? 'var(--success)' : 'var(--warning)' }}>
            {resumeData.summary?.length >= 100 ? '✓ Good length' : '⚠ Too short'}
          </span>
        </div>
      </div>

      <div className="form-actions">
        <button className="ai-button" onClick={() => handleAI('improve')} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Working...</> : '✨ Improve with AI'}
        </button>
        <button className="ai-button" style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)' }}
          onClick={() => handleAI('grammar')} disabled={loading}>
          📝 Fix Grammar
        </button>
      </div>

      <div className="summary-tips">
        <p className="tip-title">💡 Tips for a great summary:</p>
        <ul>
          <li>Mention your years of experience and key specialization</li>
          <li>Include 2–3 high-value skills relevant to your target role</li>
          <li>Add one measurable achievement only if it is true</li>
          <li>Avoid first-person pronouns ("I", "me")</li>
        </ul>
      </div>
    </div>
  );
}
