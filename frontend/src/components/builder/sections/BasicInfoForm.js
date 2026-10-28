import React from 'react';
import useResumeStore from '../../../store/resumeStore';
import '../BuilderForm.css';

export default function BasicInfoForm() {
  const { resumeData, updateBasicInfo } = useResumeStore();
  const info = resumeData.basicInfo;

  const handleChange = (e) => updateBasicInfo({ [e.target.name]: e.target.value });

  return (
    <div className="form-section animate-fade-in">
      <div className="form-section-header">
        <div className="form-section-title">
          <span className="form-section-icon">👤</span>
          <div>
            <h2>Basic Information</h2>
            <p className="form-section-desc">Your contact details for the resume header</p>
          </div>
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group form-full">
          <label className="form-label">Full Name *</label>
          <input className="form-input" name="fullName" value={info.fullName}
            onChange={handleChange} placeholder="e.g. Rahul Kumar" />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input className="form-input" name="email" type="email" value={info.email}
            onChange={handleChange} placeholder="rahul@gmail.com" />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input className="form-input" name="phone" value={info.phone}
            onChange={handleChange} placeholder="+91 98765 43210" />
        </div>

        <div className="form-group">
          <label className="form-label">LinkedIn URL</label>
          <input className="form-input" name="linkedin" value={info.linkedin}
            onChange={handleChange} placeholder="linkedin.com/in/rahulkumar" />
        </div>

        <div className="form-group">
          <label className="form-label">GitHub URL</label>
          <input className="form-input" name="github" value={info.github}
            onChange={handleChange} placeholder="github.com/rahulkumar" />
        </div>

        <div className="form-group form-full">
          <label className="form-label">Portfolio / Website</label>
          <input className="form-input" name="portfolio" value={info.portfolio}
            onChange={handleChange} placeholder="rahulkumar.dev" />
        </div>
      </div>
    </div>
  );
}
