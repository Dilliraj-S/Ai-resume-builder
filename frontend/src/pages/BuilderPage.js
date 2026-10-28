import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Sparkles, Zap, CreditCard } from 'lucide-react';
import useResumeStore from '../store/resumeStore';
import { useAutoSave } from '../hooks/useAutoSave';
import toast from 'react-hot-toast';

import BuilderSidebar from '../components/builder/BuilderSidebar';
import BuilderForm from '../components/builder/BuilderForm';
import ResizeHandle from '../components/builder/ResizeHandle';
import ResumePreview from '../components/preview/ResumePreview';
import ATSPanel from '../components/ats/ATSPanel';
import TemplateSelector from '../components/templates/TemplateSelector';
import PaymentModal from '../components/payment/PaymentModal';
import { pdfAPI, paymentAPI } from '../services/api';
import { buildPreviewHTML } from '../utils/previewHtml';
import { getTemplateById } from '../components/templates/templateData';

import './BuilderPage.css';

const SECTIONS = [
  { id: 'basicInfo', label: 'Basic Info' },
  { id: 'summary', label: 'Summary' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'achievements', label: 'Achievements' },
];

// Minimum width the preview panel must always maintain
const PREVIEW_MIN_WIDTH = 300;
// Approx total width consumed by the 3 resize handles
const RESIZE_HANDLES_WIDTH = 12;

export default function BuilderPage() {
  const navigate = useNavigate();
  const { id: resumeIdParam } = useParams();
  const {
    activeSection,
    setActiveSection,
    isSaving,
    isGeneratingPDF,
    setGeneratingPDF,
    resumeId,
    resumeData,
    selectedTemplate,
    atsScore,
    fontSize,
    fontFamily,
    setFontSize,
    setFontFamily,
    userPlan,
    setUserPlan: setUserPlanStore,
    showUpsellModal,
    upsellReason,
    showUpsell,
    hideUpsell,
    isAllSectionsCompleted,
  } = useResumeStore();
  const { saveNow } = useAutoSave();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [mobileTab, setMobileTab] = useState('form');
  const [showMobileFab, setShowMobileFab] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [formWidth, setFormWidth] = useState(380);
  const [atsWidth, setAtsWidth] = useState(280);
  const builderBodyRef = useRef(null);
  const headerAtsChecksRemaining = userPlan.atsChecksRemaining ?? 3;
  const headerDownloadsRemaining = userPlan.downloadsRemaining ?? 0;

  const fetchPlanInfo = useCallback(async () => {
    try {
      const info = await paymentAPI.getInfo();
      if (info.success) {
        setUserPlanStore({
          plan: info.data.plan,
          atsChecksUsed: info.data.atsChecksUsed,
          atsChecksLimit: info.data.atsChecksLimit,
          atsChecksRemaining: info.data.atsChecksRemaining,
          downloadsUsed: info.data.downloadsUsed,
          downloadsLimit: info.data.downloadsLimit,
          downloadsRemaining: info.data.downloadsRemaining,
        });
      }
    } catch (e) {
      console.warn('Failed to fetch plan info');
    }
  }, [setUserPlanStore]);

  // Load resumes on mount
  const { loadResumes, resumeId: storeResumeId, resumeList, loadResume, createNewResume } = useResumeStore();
  
  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  // Load resume from URL param or store
  useEffect(() => {
    const initResume = async () => {
      if (resumeIdParam) {
        await loadResume(resumeIdParam);
      } else if (!storeResumeId && resumeList.length > 0) {
        await loadResume(resumeList[0].id);
      } else if (!storeResumeId && resumeList.length === 0) {
        const newResume = await createNewResume();
        if (newResume) {
          navigate('/builder', { replace: true });
        }
      }
    };
    initResume();
  }, [resumeIdParam, storeResumeId, resumeList, loadResume, createNewResume, navigate]);

  useEffect(() => {
    fetchPlanInfo();
  }, [fetchPlanInfo]);

  const handlePaymentSuccess = (result) => {
    setShowPayment(false);
    hideUpsell();
    
    toast.success('Payment received! Updating your plan...');
    fetchPlanInfo();
  };

  const handleUpsellClose = () => {
    setShowPayment(false);
    hideUpsell();
    // User closed upsell without paying - that's fine
  };

  // ── Sidebar resize ─────────────────────────────────────────────
  const handleSidebarResize = useCallback((clientX) => {
    if (!builderBodyRef.current) return;
    const rect = builderBodyRef.current.getBoundingClientRect();
    const newWidth = Math.max(150, Math.min(300, clientX - rect.left));
    setSidebarWidth(newWidth);
  }, []);

  // ── Form resize ────────────────────────────────────────────────
  const handleFormResize = useCallback((clientX) => {
    if (!builderBodyRef.current) return;
    const rect = builderBodyRef.current.getBoundingClientRect();
    const newWidth = Math.max(250, Math.min(600, clientX - rect.left - sidebarWidth));
    setFormWidth(newWidth);
  }, [sidebarWidth]);

  // ── ATS resize — FIXED: preview panel is always kept ≥ PREVIEW_MIN_WIDTH ──
  const handleAtsResize = useCallback((clientX) => {
    if (!builderBodyRef.current) return;
    const rect = builderBodyRef.current.getBoundingClientRect();

    // Space already consumed by sidebar + form + resize handles
    const consumed = sidebarWidth + formWidth + RESIZE_HANDLES_WIDTH;
    // Maximum ATS width that still leaves the preview its minimum room
    const maxAllowedAts = Math.max(200, rect.width - consumed - PREVIEW_MIN_WIDTH);

    const newWidth = Math.max(200, Math.min(maxAllowedAts, rect.right - clientX));
    setAtsWidth(newWidth);
  }, [sidebarWidth, formWidth]);

  const handleDownloadPDF = useCallback(async (options = {}) => {
    const skipLimitCheck = options.skipLimitCheck === true;
    const planOverride = options.planOverride;
    const downloadsLimitOverride = options.downloadsLimitOverride;
    const downloadsRemainingOverride = options.downloadsRemainingOverride;
    const downloadsUsedOverride = options.downloadsUsedOverride;

    const effectivePlan = planOverride || userPlan.plan;
    const effectiveDownloadsLimit = downloadsLimitOverride ?? userPlan.downloadsLimit;
    const effectiveDownloadsUsed = downloadsUsedOverride ?? userPlan.downloadsUsed ?? 0;
    const effectiveDownloadsRemaining =
      downloadsRemainingOverride ??
      userPlan.downloadsRemaining ??
      (effectiveDownloadsLimit === -1 ? -1 : Math.max(0, (effectiveDownloadsLimit ?? 0) - effectiveDownloadsUsed));

    if (!resumeData.basicInfo?.email) {
      toast.error('Please add your email in Basic Info before downloading.');
      return;
    }

    if (!skipLimitCheck && effectivePlan === 'free') {
      setShowPayment(true);
      showUpsell('payment');
      return;
    }

    if (!skipLimitCheck && (effectivePlan === 'basic' || effectivePlan === 'pro')) {
      const remaining = effectiveDownloadsRemaining;
      if (remaining === 0) {
        toast.error('Download limit exceeded. Please purchase a plan to continue.');
        setShowPayment(true);
        showUpsell('payment');
        return;
      }
      if (remaining > 0 && remaining <= 1) {
        toast(`Last download! ${remaining} remaining`, { icon: '⚠️' });
      } else {
        toast.success(`${remaining} downloads remaining`);
      }
    }

    setGeneratingPDF(true);
    try {
      const name = resumeData?.basicInfo?.fullName || 'User';
      const templateMeta = getTemplateById(selectedTemplate);
      const cleanTemplate = templateMeta ? {
        id: templateMeta.id, name: templateMeta.name, layout: templateMeta.layout,
        primaryColor: templateMeta.primaryColor, accentColor: templateMeta.accentColor,
        font: templateMeta.font, category: templateMeta.category,
      } : null;
      const htmlContent = buildPreviewHTML(fontSize, fontFamily);
      const blob = await pdfAPI.download({
        resumeData, templateId: selectedTemplate, templateMeta: cleanTemplate,
        htmlContent, resumeId, filename: `${name.replace(/\s+/g, '_')}_Resume.pdf`,
        fontSize, fontFamily,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const nextRemaining = effectiveDownloadsLimit === -1
        ? -1
        : Math.max(0, (effectiveDownloadsRemaining ?? (effectiveDownloadsLimit ?? 0)) - 1);

      toast.success(
        effectiveDownloadsLimit === -1
          ? 'Download started! Unlimited downloads available.'
          : `Download started! ${nextRemaining} downloads remaining.`
      );

      setUserPlanStore(prev => {
        const baseLimit = effectiveDownloadsLimit ?? prev.downloadsLimit;
        const baseUsed = (prev.downloadsUsed ?? 0);
        const baseRemaining =
          effectiveDownloadsRemaining ??
          prev.downloadsRemaining ??
          (baseLimit === -1 ? -1 : Math.max(0, (baseLimit ?? 0) - baseUsed));
        const updatedRemaining = baseLimit === -1 ? -1 : Math.max(0, baseRemaining - 1);
        return {
          ...prev,
          downloadsLimit: baseLimit,
          downloadsUsed: baseUsed + 1,
          downloadsRemaining: updatedRemaining,
        };
      });

      fetchPlanInfo();
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code || err.code;
      const message = err.response?.data?.error || err.message;

      if (status === 403 || code === 'limit_exceeded' || code === 'PAYMENT_REQUIRED' || message?.includes('limit_exceeded') || message?.includes('PAYMENT_REQUIRED')) {
        setShowPayment(true);
        showUpsell('payment');
        toast.error('Download limit reached. Please choose a plan to continue.');
      } else {
        toast.error(message || 'Download failed. Please try again.');
      }
    } finally {
      setGeneratingPDF(false);
    }
  }, [resumeData, selectedTemplate, setGeneratingPDF, userPlan]);

  const isPreviewOrATS = mobileTab === 'preview' || mobileTab === 'ats';
  const atsClass = atsScore >= 75 ? 'good' : atsScore >= 50 ? 'fair' : 'poor';

  return (
    <div className={`builder ${isPreviewOrATS ? 'show-overlay' : ''}`}>

      {/* ══════════════ HEADER ══════════════ */}
      <header className="builder-header">

        {/* Left — Logo */}
        <div className="builder-header-left">
          <div className="builder-logo" onClick={() => navigate('/')}>
            <span className="builder-logo-icon">R</span>
            ResumeAI
          </div>
        </div>

        {/* Center — Edit / Preview / ATS tabs */}
        <div className="builder-header-center">
          <div className="mobile-tabs desktop-tabs">
            {['form', 'preview', 'ats'].map(tab => (
              <button
                key={tab}
                className={`mobile-tab ${mobileTab === tab ? 'active' : ''}`}
                onClick={() => setMobileTab(tab)}
              >
                {tab === 'form' ? 'Edit' : tab === 'preview' ? 'Preview' : 'ATS'}
              </button>
            ))}
          </div>
        </div>
        {mobileTab !== 'form' && (
          <button className="mobile-close-btn" onClick={() => setMobileTab('form')}>✕</button>
        )}

        {/* Right — Pills + Controls + Buttons */}
        <div className="builder-header-right">

{/* ATS score */}
{atsScore > 0 && (
            <div className="ats-score-pill header-stat-pill" title={`ATS Score: ${atsScore}%`}>
              <span className="ats-label">ATS</span>
              <span className={`ats-value ${atsClass}`}>{atsScore}%</span>
            </div>
          )}

          <div className="ats-score-pill header-stat-pill" style={{ backgroundColor: userPlan.plan === 'pro' ? '#dcfce7' : '#fef3c7' }} title={`ATS Checks: ${headerAtsChecksRemaining}`}>
            <Sparkles size={12} style={{ color: userPlan.plan === 'pro' ? '#16a34a' : '#d97706' }} />
            <span style={{ color: userPlan.plan === 'pro' ? '#16a34a' : '#d97706', fontWeight: '600', fontSize: '12px' }}>
              {headerAtsChecksRemaining}
            </span>
          </div>

          <div
            className="ats-score-pill header-stat-pill"
            style={{
              backgroundColor: userPlan.plan === 'pro' ? '#fef3c7' : userPlan.plan === 'single' ? '#f3e8ff' : '#f1f5f9',
            }}
            title={`Downloads Remaining: ${headerDownloadsRemaining === -1 ? 'Unlimited' : headerDownloadsRemaining}`}
          >
            <Download size={12} style={{ color: userPlan.plan === 'pro' ? '#d97706' : userPlan.plan === 'single' ? '#9333ea' : '#64748b' }} />
            <span style={{ color: userPlan.plan === 'pro' ? '#d97706' : userPlan.plan === 'single' ? '#9333ea' : '#64748b', fontWeight: '600', fontSize: '12px' }}>
              {headerDownloadsRemaining === -1 ? '∞' : headerDownloadsRemaining}
            </span>
          </div>

{userPlan.plan === 'free' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/pricing')}
              style={{
                color: '#1e3a8a',
                fontWeight: '700',
                borderColor: 'rgba(30,58,138,0.2)',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <CreditCard size={12} />
              Upgrade Plan
            </button>
          )}

<button className="btn btn-ghost btn-sm" onClick={() => setShowTemplates(true)}>
            Templates
          </button>

          <button className="btn btn-ghost btn-sm" onClick={saveNow} disabled={isSaving}>
            {isSaving
              ? <><span className="spinner spinner-dark" />Saving…</>
              : '💾 Save'}
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isGeneratingPDF
              ? <><span className="spinner" />Processing…</>
              : <><Download size={13} />Download PDF</>}
          </button>
        </div>
      </header>

      {/* ══════════════ BODY ══════════════ */}
      <div className="builder-body" ref={builderBodyRef}>
        <aside
          className={`builder-sidebar ${mobileTab !== 'form' ? 'mobile-hidden' : ''}`}
          style={{ width: sidebarWidth }}
        >
          <BuilderSidebar sections={SECTIONS} activeSection={activeSection} onSelect={setActiveSection} />
        </aside>

        <ResizeHandle direction="horizontal" onResize={handleSidebarResize} minSize={150} maxSize={300} />

        <main
          className={`builder-form-panel ${mobileTab !== 'form' ? 'mobile-hidden' : ''}`}
          style={{ width: formWidth }}
        >
          <BuilderForm activeSection={activeSection} />
        </main>

        <ResizeHandle direction="horizontal" onResize={handleFormResize} minSize={250} maxSize={600} />

        <section className={`builder-preview-panel ${mobileTab !== 'preview' ? 'mobile-hidden' : ''}`}>
          <ResumePreview fontSize={fontSize} fontFamily={fontFamily} />
        </section>

        <ResizeHandle direction="horizontal" onResize={handleAtsResize} minSize={200} maxSize={400} />

        <aside
          className={`builder-ats-panel ${mobileTab !== 'ats' ? 'mobile-hidden' : ''}`}
          style={{ width: atsWidth }}
        >
          <ATSPanel />
        </aside>
      </div>

      {/* ══════════════ MOBILE FAB ══════════════ */}
      <div className="mobile-fab">
        <button
          className={`fab-btn ${mobileTab === 'preview' ? 'active' : ''}`}
          onClick={() => setMobileTab(mobileTab === 'preview' ? 'form' : 'preview')}
          title="Toggle Preview"
        >👁</button>
        <button
          className={`fab-btn fab-secondary ${mobileTab === 'ats' ? 'active' : ''}`}
          onClick={() => setMobileTab(mobileTab === 'ats' ? 'form' : 'ats')}
          title="Toggle ATS"
        >📊</button>
      </div>

      {/* ══════════════ TEMPLATES ══════════════ */}
      {showTemplates && <TemplateSelector onClose={() => setShowTemplates(false)} />}

      {/* ══════════════ PAYMENT MODAL ══════════════ */}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          onAutoDownload={() => handleDownloadPDF()}
          reason={upsellReason}
        />
      )}
    </div>
  );
}
