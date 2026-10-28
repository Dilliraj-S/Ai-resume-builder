import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import { resumeParserAPI } from '../../services/api';
import ATSResultModal from './ATSResultModal';
import './ResumeUpload.css';
import toast from 'react-hot-toast';

export default function ResumeUpload({ onImportComplete, user, loginTrigger, initialFile }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [parsedResume, setParsedResume] = useState(null);
  const fileInputRef = useRef(null);
  
  const pendingData = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('resume_pending_data');
    if (stored && user) {
      const data = JSON.parse(stored);
      pendingData.current = data;
    }

    const handleDashboardImport = (e) => {
      if (e.detail?.file) {
        handleFile(e.detail.file);
      }
    };
    window.addEventListener('dashboard-import-file', handleDashboardImport);
    return () => window.removeEventListener('dashboard-import-file', handleDashboardImport);
  }, [user]);

  useEffect(() => {
    // Check for pending data after login
    const stored = sessionStorage.getItem('resume_pending_data');
    const hasPending = pendingData.current || stored;
    
    if (loginTrigger > 0 && hasPending && user) {
      // Re-analyze after login
      const data = pendingData.current || JSON.parse(stored);
      const pr = data.parsedResume;
      setIsUploading(true);
      
      resumeParserAPI.analyze(pr).then((res) => {
        // Process resumption
        const atsResult = res;
        setIsUploading(false);
        if (res.success) {
          setShowResult(false);
          setResult(res.data);
          setParsedResume(pr);
          setTimeout(() => setShowResult(true), 100);
          toast.success('Full ATS report unlocked!');
        }
        pendingData.current = null;
        sessionStorage.removeItem('resume_pending_data');
      }).catch((err) => {
        console.error('Error:', err);
        setIsUploading(false);
        pendingData.current = null;
        sessionStorage.removeItem('resume_pending_data');
      });
    }
  }, [loginTrigger, user]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload PDF or DOCX file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const parseResult = await resumeParserAPI.parse(file);
      
      if (parseResult.success && parseResult.data?.parsedResume) {
        setParsedResume(parseResult.data.parsedResume);
        
        const atsResult = await resumeParserAPI.analyze(parseResult.data.parsedResume);
        
        console.log('[ResumeUpload] ATS result:', atsResult);
        
        if (atsResult.success) {
          setResult(atsResult.data);
          setShowResult(true);
          const pending = { 
            parsedResume: parseResult.data.parsedResume,
            atsScore: atsResult.data?.score
          };
          console.log('[ResumeUpload] Pending data:', pending);
          pendingData.current = pending;
          sessionStorage.setItem('resume_pending_data', JSON.stringify(pending));
        } else {
          setError('Failed to analyze resume');
        }
      } else {
        setError('Could not parse the resume. Please try a different file.');
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError(err.message || 'Failed to process resume');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    handleFile(file);
  }, [handleFile]);

  useEffect(() => {
    if (initialFile) {
      handleFile(initialFile);
    }
  }, [initialFile]);

  const handleImportAndEdit = useCallback(() => {
    if (onImportComplete && parsedResume) {
      onImportComplete(parsedResume, result);
    }
    setShowResult(false);
    setResult(null);
    setParsedResume(null);
    pendingData.current = null;
    sessionStorage.removeItem('resume_pending_data');
  }, [onImportComplete, parsedResume, result]);

  const handleClose = useCallback(() => {
    setShowResult(false);
  }, []);

  return (
    <>
      <div 
        className={`resume-upload ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {isUploading ? (
          <div className="upload-loading">
            <Loader2 className="spin" size={48} />
            <p>Analyzing your resume...</p>
            <span>This will only take a moment</span>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">
              {isDragging ? <Upload size={48} /> : <FileText size={48} />}
            </div>
            <h3>
              {isDragging ? 'Drop your resume here' : 'Upload Your Resume'}
            </h3>
            <p>
              Drag & drop your PDF resume here, or click to browse.
              <br />
              <span>We'll analyze it and suggest improvements instantly!</span>
            </p>
            <div className="upload-formats">
              <span>✓ ATS Score Analysis</span>
              <span>✓ AI Suggestions</span>
              <span>✓ Auto-fill to Builder</span>
            </div>
          </div>
        )}

        {error && (
          <div className="upload-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {showResult && result && (
        <ATSResultModal
          result={result}
          onClose={handleClose}
          onImportAndEdit={handleImportAndEdit}
        />
      )}
    </>
  );
}