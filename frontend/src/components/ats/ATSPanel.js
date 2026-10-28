import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';
import { resumeParserAPI } from '../../services/api';
import './ATSPanel.css';

const ICON_MAP = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
const COLOR_MAP = { success: '#16a34a', warning: '#d97706', error: '#dc2626', info: '#0369a1' };

function ScoreArc({ score }) {
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className="ats-arc-wrapper">
      <svg width="130" height="80" viewBox="0 0 130 80">
        <path d="M 15 75 A 50 50 0 0 1 115 75" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round"/>
        <path d="M 15 75 A 50 50 0 0 1 115 75" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ / 2} strokeDashoffset={offset / 2}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
      </svg>
      <div className="ats-arc-score" style={{ color }}>
        <strong>{score}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}

const GRADE_LABELS = {
  Excellent: { bg: 'rgba(22,163,74,0.1)', color: '#16a34a', label: 'Excellent ✨' },
  Good:      { bg: 'rgba(34,197,94,0.1)', color: '#15803d', label: 'Good 👍' },
  Fair:      { bg: 'rgba(245,158,11,0.1)', color: '#b45309', label: 'Fair ⚡' },
  'Needs Work': { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', label: 'Needs Work 📝' },
  Poor:      { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', label: 'Poor ❌' },
};

export default function ATSPanel() {
  const { atsScore, atsFeedback, resumeData, setAtsScore, updateResumeAtsScore, userPlan, showUpsell } = useResumeStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);

  const handleCheckATS = async () => {
    if (isAnalyzing) return;
    
    const atsRemaining = userPlan.atsChecksRemaining ?? 0;
    if (atsRemaining <= 0 && userPlan.plan === 'free') {
      showUpsell('ats');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const result = await resumeParserAPI.analyzeResume(resumeData);
      
      if (result.success && result.data) {
        const newScore = result.data.score || 0;
        const suggestions = result.data.suggestions || [];
        const feedback = suggestions.map(s => ({ type: s.type || 'info', text: s.text || s }));
        
        setAtsScore(newScore, feedback);
        setLastAnalyzed(new Date());
        
        const { resumeId } = useResumeStore.getState();
        if (resumeId) {
          await updateResumeAtsScore(resumeId, newScore, result.data);
        }
        
        const currentUsed = (userPlan.atsChecksUsed || 0) + 1;
        useResumeStore.setState((s) => ({
          userPlan: { ...s.userPlan, atsChecksUsed: currentUsed, atsChecksRemaining: Math.max(0, (userPlan.atsChecksLimit || 0) - currentUsed) }
        }));
      }
    } catch (error) {
      console.error('ATS analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const grade = atsScore >= 90 ? 'Excellent' : atsScore >= 75 ? 'Good' : atsScore >= 60 ? 'Fair' : atsScore >= 40 ? 'Needs Work' : 'Poor';
  const gradeStyle = GRADE_LABELS[grade] || GRADE_LABELS['Poor'];

  return (
    <div className="ats-panel">
      <div className="ats-panel-header">
        <h3>📊 ATS Score</h3>
        {lastAnalyzed && (
          <span className="ats-ai-badge">🤖 AI</span>
        )}
      </div>

      <div className="ats-score-section">
        <ScoreArc score={atsScore} />
        <div className="ats-grade" style={{ background: gradeStyle.bg, color: gradeStyle.color }}>
          {gradeStyle.label}
        </div>
      </div>

      {atsScore === 0 && !isAnalyzing && (
        <div className="ats-empty" style={{ marginBottom: '16px' }}>
          Upload a resume or check ATS to see your score.
        </div>
      )}

      <button 
        className="btn btn-primary ats-check-btn"
        onClick={handleCheckATS}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={18} className="spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Check ATS with AI
          </>
        )}
      </button>

      <div className="ats-suggestions">
        <div className="ats-suggestions-title">AI Suggestions</div>
        {atsFeedback.length === 0 && (
          <div className="ats-empty">Click "Check ATS with AI" to get suggestions.</div>
        )}
        {atsFeedback.map((item, i) => (
          <div key={i} className={`ats-tip ats-tip-${item.type}`}>
            <span className="ats-tip-icon">{ICON_MAP[item.type] || 'ℹ️'}</span>
            <span className="ats-tip-text" style={{ color: COLOR_MAP[item.type] }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}