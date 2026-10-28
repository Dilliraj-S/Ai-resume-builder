import React, { useState } from 'react';
import useResumeStore from '../../../store/resumeStore';
import { aiAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import '../BuilderForm.css';

function AchievementEntry({ ach, onUpdate, onRemove }) {
  const [loading, setLoading] = useState(false);
  const { userPlan, showUpsell } = useResumeStore();

  const handleAI = async () => {
    if (!ach.text?.trim()) return toast.error('Add achievement text first');
    if (userPlan.credits <= 0) return showUpsell('credits');
    setLoading(true);
    const tid = toast.loading('Enhancing achievement…');
    try {
      const res = await aiAPI.enhanceAchievement({ achievement: ach.text });
      onUpdate(ach.id, res.data.content);
      useResumeStore.getState().setCredits(res.credits.remaining);
      toast.success(`Achievement improved! (${res.credits.remaining} credits left)`, { id: tid });
    } catch (err) { 
      if (err.message?.includes('NO_CREDITS') || err.message?.includes('No AI credits')) {
        showUpsell('credits');
      }
      toast.error(err.message, { id: tid }); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="entry-card" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 10, fontSize: 16 }}>•</span>
        <div style={{ flex: 1 }}>
          <input
            className="form-input"
            value={ach.text}
            placeholder="Ranked in top 1% in national coding contest with 10,000+ participants"
            onChange={e => onUpdate(ach.id, e.target.value)}
          />
          <div style={{ marginTop: 8 }}>
            <button className="ai-button" onClick={handleAI} disabled={loading} style={{ fontSize: 11 }}>
              {loading ? <><span className="spinner" style={{width:12,height:12}}/> Enhancing…</> : '✨ Improve with AI'}
            </button>
          </div>
        </div>
        <button className="remove-btn" onClick={() => onRemove(ach.id)} style={{ marginTop: 8 }}>✕</button>
      </div>
    </div>
  );
}

export default function AchievementsForm() {
  const { resumeData, addAchievement, updateAchievement, removeAchievement } = useResumeStore();

  return (
    <div className="form-section animate-fade-in">
      <div className="form-section-header">
        <div className="form-section-title">
          <span className="form-section-icon">🌟</span>
          <div>
            <h2>Achievements</h2>
            <p className="form-section-desc">Awards, recognitions, and notable accomplishments</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: 'var(--text-secondary)' }}>
        💡 Include hackathon wins, competitive rankings, scholarships, or open-source contributions
      </div>

      {resumeData.achievements.map(a => (
        <AchievementEntry key={a.id} ach={a} onUpdate={updateAchievement} onRemove={removeAchievement} />
      ))}

      <button className="add-entry-btn" onClick={addAchievement}>+ Add Achievement</button>
    </div>
  );
}
