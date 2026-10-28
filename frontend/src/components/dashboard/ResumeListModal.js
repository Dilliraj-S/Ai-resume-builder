import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ResumeList from './ResumeList';
import './ResumeListModal.css';

export default function ResumeListModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="resume-modal-overlay" onClick={onClose}>
      <div className="resume-modal" onClick={(e) => e.stopPropagation()}>
        <button className="resume-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <ResumeList onClose={onClose} />
      </div>
    </div>
  );
}