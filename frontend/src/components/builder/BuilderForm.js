import React from 'react';
import BasicInfoForm from './sections/BasicInfoForm';
import SummaryForm from './sections/SummaryForm';
import ExperienceForm from './sections/ExperienceForm';
import EducationForm from './sections/EducationForm';
import ProjectsForm from './sections/ProjectsForm';
import SkillsForm from './sections/SkillsForm';
import CertificationsForm from './sections/CertificationsForm';
import AchievementsForm from './sections/AchievementsForm';
import './BuilderForm.css';
import './sections/sections.css';

const SECTION_MAP = {
  basicInfo:      BasicInfoForm,
  summary:        SummaryForm,
  experience:     ExperienceForm,
  education:      EducationForm,
  projects:       ProjectsForm,
  skills:         SkillsForm,
  certifications: CertificationsForm,
  achievements:   AchievementsForm,
};

export default function BuilderForm({ activeSection }) {
  const FormComponent = SECTION_MAP[activeSection] || BasicInfoForm;
  return (
    <div className="builder-form">
      <FormComponent />
    </div>
  );
}
