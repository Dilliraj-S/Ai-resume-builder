import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Download, ArrowRight, CheckCircle, AlertTriangle, Info, TrendingUp, Target, Lock } from 'lucide-react';
import './ATSResultModal.css';

export default function ATSResultModal({ result, onClose, onImportAndEdit }) {
  if (!result) return null;

  const navigate = useNavigate();
  const { score, grade, gradeColor, suggestions = [], keywords, readability, grammar, jobTitleMatch, skillGap, isAI, isLoggedIn, loginRequired } = result;

  const getGradeIcon = () => {
    if (score >= 75) return '🎉';
    if (score >= 50) return '⚠️';
    return '😟';
  };

  const getGradeMessage = () => {
    if (loginRequired && !isLoggedIn) return 'Login to see your accurate ATS score!';
    if (score >= 90) return 'Excellent! Your resume is ATS-ready!';
    if (score >= 75) return 'Great! Minor improvements will make it perfect.';
    if (score >= 50) return 'Good start. Let\'s boost your score!';
    return 'Let\'s improve your resume with AI!';
  };

  const getGradeColor = () => {
    if (loginRequired && !isLoggedIn) return '#8b5cf6';
    if (score >= 90) return '#22c55e';
    if (score >= 75) return '#84cc16';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  };

  const handleLogin = () => {
    navigate('/?login=true');
    onClose();
  };

  return (
    <div className="ats-modal-overlay" onClick={onClose}>
      <div className="ats-modal" onClick={e => e.stopPropagation()}>
        <button className="ats-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {loginRequired && !isLoggedIn && (
          <div className="ats-login-banner">
            <Lock size={20} />
            <span>Sign in to see your accurate score</span>
          </div>
        )}

        <div className="ats-modal-header">
          <div className="ats-score-circle" style={{ '--score-color': getGradeColor() }}>
            <span className="score-value">{loginRequired && !isLoggedIn ? '?' : score}</span>
            <span className="score-label">{loginRequired && !isLoggedIn ? 'Score' : 'ATS Score'}</span>
          </div>
          <div className="ats-header-info">
            <span className="ats-grade">{getGradeIcon()} {loginRequired && !isLoggedIn ? 'Login Required' : grade}</span>
            <p className="ats-message">{getGradeMessage()}</p>
            {isAI && <span className="ai-badge">🤖 AI-Powered</span>}
          </div>
        </div>

        <div className="ats-modal-body">
          {loginRequired && !isLoggedIn ? (
            <div className="ats-locked-content">
              <div className="locked-icon">🔒</div>
              <h3>Full Analysis Locked</h3>
              <p>Login or create an account to unlock:</p>
              <ul className="locked-benefits">
                <li>✅ Your accurate ATS score</li>
                <li>✅ Detailed keyword analysis</li>
                <li>✅ AI-powered suggestions</li>
                <li>✅ Skill gap analysis</li>
                <li>✅ Full resume optimization tips</li>
              </ul>
              <button className="btn btn-primary" onClick={handleLogin}>
                Sign In to Unlock
              </button>
              <p className="login-prompt">Don't have an account? <button className="link-btn" onClick={handleLogin}>Create one</button></p>
            </div>
          ) : (
            <>
              <div className="ats-section">
                <h4><TrendingUp size={18} /> Quick Stats</h4>
                <div className="ats-stats-grid">
                  <div className="ats-stat">
                    <span className="stat-value">{keywords?.matchPercentage || 0}%</span>
                    <span className="stat-label">Keyword Match</span>
                  </div>
                  <div className="ats-stat">
                    <span className="stat-value">{readability?.grade || 'N/A'}</span>
                    <span className="stat-label">Readability</span>
                  </div>
                  <div className="ats-stat">
                    <span className="stat-value">{grammar?.score || 100}</span>
                    <span className="stat-label">Grammar Score</span>
                  </div>
                </div>
              </div>

          {skillGap && skillGap.hasJobDescription && (
            <div className="ats-section">
              <h4><Target size={18} /> Skill Gap Analysis</h4>
              <div className="skill-gap-bar">
                <div className="skill-gap-progress" style={{ width: `${skillGap.coverage}%` }} />
              </div>
              <p className="skill-gap-text">{skillGap.coverage}% coverage • {skillGap.totalMissing} skills missing</p>
              
              {skillGap.missing?.length > 0 && (
                <div className="missing-skills">
                  <span className="missing-label">Missing:</span>
                  {skillGap.missing.slice(0, 5).map((skill, i) => (
                    <span key={i} className="missing-skill">{skill.skill}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="ats-section">
            <h4><Sparkles size={18} /> AI Suggestions</h4>
            <div className="ats-suggestions">
              {suggestions.length > 0 ? (
                suggestions.slice(0, 6).map((suggestion, index) => (
                  <div key={index} className={`suggestion-item ${suggestion.type}`}>
                    {suggestion.type === 'error' && <AlertTriangle size={16} />}
                    {suggestion.type === 'warning' && <AlertTriangle size={16} />}
                    {suggestion.type === 'info' && <Info size={16} />}
                    {suggestion.type === 'success' && <CheckCircle size={16} />}
                    <span>{suggestion.text}</span>
                  </div>
                ))
              ) : (
                <div className="suggestion-item success">
                  <CheckCircle size={16} />
                  <span>No issues found! Your resume looks great.</span>
                </div>
              )}
            </div>

            {result.strengths && result.strengths.length > 0 && (
              <div className="ats-section">
                <h4><CheckCircle size={18} /> Key Strengths</h4>
                <div className="strengths-list">
                  {result.strengths.slice(0, 3).map((strength, index) => (
                    <span key={index} className="strength-item">✓ {strength}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

              </>
          )}

          {(!loginRequired || isLoggedIn) && (
            <div className="ats-modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Maybe Later
              </button>
              <button 
                className="btn btn-primary btn-import" 
                onClick={() => {
                  console.log('[ATS Modal] Import clicked, result:', result);
                  if (onImportAndEdit) onImportAndEdit();
                }}
              >
                <Sparkles size={18} />
                Import & Enhance with AI
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
