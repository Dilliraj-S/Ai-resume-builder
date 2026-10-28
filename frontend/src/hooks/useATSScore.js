import { useCallback } from 'react';
import useResumeStore from '../store/resumeStore';

const ACTION_VERBS = [
  'achieved','analyzed','built','collaborated','created','designed','developed',
  'directed','engineered','implemented','improved','increased','launched','led',
  'managed','optimized','reduced','resolved','spearheaded','streamlined','delivered',
  'deployed','automated','scaled','mentored','architected','integrated',
];

export const useATSScore = () => {
  const { resumeData, setAtsScore } = useResumeStore();

  const calculate = useCallback(() => {
    const data = resumeData;
    let score = 0;
    const suggestions = [];
    const breakdown = {};

    // Contact (10 pts)
    const info = data.basicInfo || {};
    let c = 0;
    if (info.fullName) c += 2;
    if (info.email)    c += 3;
    if (info.phone)    c += 2;
    if (info.linkedin) c += 2;
    if (info.github || info.portfolio) c += 1;
    score += c; breakdown.contact = c;
    if (!info.linkedin) suggestions.push({ type: 'warning', text: 'Add LinkedIn profile for credibility' });

    // Summary (15 pts)
    const summary = data.summary || '';
    let s = 0;
    if (summary.length > 50)  s += 5;
    if (summary.length > 150) s += 5;
    if (ACTION_VERBS.some(v => summary.toLowerCase().includes(v))) s += 5;
    score += s; breakdown.summary = s;
    if (summary.length < 100) suggestions.push({ type: 'error', text: 'Write a longer professional summary (aim for 2-4 sentences)' });

    // Experience / Internship (25 pts)
    const allRoles = [...(data.experience || []), ...(data.internships || [])];
    let e = 0;
    if (allRoles.length > 0) e += 10;
    if (allRoles.length >= 2) e += 5;
    let hasMetrics = false, hasVerbs = false;
    allRoles.forEach(role => {
      const d = (role.description || '').toLowerCase();
      if (/\d+%|\d+ users|\d+x|\$\d+/i.test(d)) hasMetrics = true;
      if (ACTION_VERBS.some(v => d.includes(v))) hasVerbs = true;
    });
    if (hasMetrics) e += 5;
    if (hasVerbs) e += 5;
    score += e; breakdown.experience = e;
    if (!hasMetrics && allRoles.length > 0)
      suggestions.push({ type: 'error', text: 'Add measurable results like "Increased performance by 40%"' });

    // Education (10 pts)
    const edu = data.education || [];
    let ed = 0;
    if (edu.length > 0) ed += 5;
    if (edu[0]?.degree) ed += 3;
    if (edu[0]?.cgpa) ed += 2;
    score += ed; breakdown.education = ed;
    if (edu.length === 0) suggestions.push({ type: 'error', text: 'Add your education section' });

    // Skills (20 pts)
    const skills = data.skills || {};
    const allSkills = Object.values(skills).flat();
    let sk = 0;
    if (allSkills.length >= 5)  sk += 5;
    if (allSkills.length >= 10) sk += 5;
    if (allSkills.length >= 15) sk += 5;
    if (Object.keys(skills).length >= 2) sk += 5;
    score += sk; breakdown.skills = sk;
    if (allSkills.length < 8)
      suggestions.push({ type: 'warning', text: `Add more skills — currently ${allSkills.length} (aim for 10+)` });

    // Projects (10 pts)
    const projects = data.projects || [];
    let pr = 0;
    if (projects.length > 0) pr += 5;
    if (projects.length >= 2) pr += 3;
    if (projects.some(p => p.techStack?.length > 0)) pr += 2;
    score += pr; breakdown.projects = pr;
    if (projects.length === 0)
      suggestions.push({ type: 'warning', text: 'Add at least 2 projects to showcase your work' });

    // Extras (10 pts)
    const certs = data.certifications || [];
    const ach = data.achievements || [];
    let ex = 0;
    if (certs.length > 0) ex += 3;
    if (ach.length > 0) ex += 3;
    if (certs.length + ach.length >= 3) ex += 4;
    score += ex; breakdown.extras = ex;

    const finalScore = Math.min(100, Math.round(score));
    let grade = 'Poor';
    if (finalScore >= 90) grade = 'Excellent';
    else if (finalScore >= 75) grade = 'Good';
    else if (finalScore >= 60) grade = 'Fair';
    else if (finalScore >= 40) grade = 'Needs Work';

    if (finalScore >= 75)
      suggestions.unshift({ type: 'success', text: `Great! Your resume scores ${finalScore}/100 on ATS` });

    const result = { score: finalScore, grade, breakdown, suggestions: suggestions.slice(0, 8) };
    setAtsScore(finalScore, result.suggestions);
    return result;
  }, [resumeData, setAtsScore]);

  return { calculate };
};
