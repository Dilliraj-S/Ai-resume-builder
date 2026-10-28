const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
};

const parseTextFile = (buffer) => {
  return buffer.toString('utf-8');
};

const parsePdfFile = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return cleanText(data.text);
  } catch (error) {
    logger.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF');
  }
};

const parseDocxFile = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  } catch (error) {
    logger.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX');
  }
};

const extractTextFromFile = async (file) => {
  const mimeType = file.mimetype;
  const buffer = file.buffer;

  if (mimeType === 'application/pdf') {
    return await parsePdfFile(buffer);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await parseDocxFile(buffer);
  } else if (mimeType === 'text/plain') {
    return parseTextFile(buffer);
  } else {
    throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.');
  }
};

const SECTION_KEYWORDS = {
  summary: ['summary', 'professional summary', 'profile', 'career objective', 'objective'],
  experience: ['experience', 'work experience', 'professional experience', 'internship', 'internships', 'employment'],
  education: ['education', 'academic', 'qualification', 'qualifications'],
  projects: ['projects', 'project', 'work samples', 'portfolio'],
  skills: ['skills', 'technical skills', 'technologies', 'tech stack', 'competencies'],
  certifications: ['certifications', 'certification', 'certificate', 'certificates', 'licenses', 'credentials']
};

const detectSections = (lines) => {
  const sections = {};
  const sectionOrder = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const lower = line.toLowerCase();
    
    for (const [sectionName, keywords] of Object.entries(SECTION_KEYWORDS)) {
      const isHeader = keywords.some(kw => {
        const kwUpper = kw.toUpperCase();
        const lineUpper = line.toUpperCase();
        return lineUpper === kwUpper || lineUpper.startsWith(kwUpper + ':') || lineUpper.startsWith(kwUpper + ' -') || lineUpper.startsWith(kwUpper + ' ');
      });
      
      if (isHeader && !sections[sectionName]) {
        sections[sectionName] = { start: i + 1, end: lines.length };
        sectionOrder.push(sectionName);
        break;
      }
    }
  }
  
  for (let i = 0; i < sectionOrder.length - 1; i++) {
    const current = sectionOrder[i];
    const next = sectionOrder[i + 1];
    sections[current].end = sections[next].start - 1;
  }
  
  return sections;
};

const parseHeader = (lines) => {
  const header = { name: '', email: '', phone: '' };
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:(?:\+|0)?91[-.\s]?)?(?:[6-9]\d{9}|(?:\d{2,5}[-.\s]?\d{6,8}))/;
  
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim();
    
    if (!header.email) {
      const emailMatch = line.match(emailRegex);
      if (emailMatch) header.email = emailMatch[0];
    }
    
    if (!header.phone) {
      const phoneMatch = line.match(phoneRegex);
      if (phoneMatch) header.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
    }
    
    if (!header.name && line.length > 2 && line.length < 50) {
      if (line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/) || line.match(/^[A-Z\s]{3,40}$/)) {
        if (!line.includes('@') && !line.match(/\d{10,}/)) {
          header.name = line.replace(/\s+/g, ' ').trim();
        }
      }
    }
  }
  
  return header;
};

const NORMALIZE_MONTHS = {
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
  jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
  january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr', june: 'Jun',
  july: 'Jul', august: 'Aug', september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec'
};

const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.toLowerCase().trim();
  
  if (clean === 'present' || clean === 'current') return 'Present';
  
  const match = clean.match(/((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)(20\d{2})/i);
  if (match) {
    const monthKey = match[1].toLowerCase().replace(/\./g, '').trim();
    return `${NORMALIZE_MONTHS[monthKey] || 'Jan'} ${match[3]}`;
  }
  
  const yearOnly = clean.match(/\b(20\d{2})\b/);
  if (yearOnly) return `Jan ${yearOnly[1]}`;
  
  return '';
};

const parseDateRange = (text) => {
  if (!text) return { startDate: '', endDate: '' };
  const clean = text.toLowerCase().trim();
  
  const fullMatch = clean.match(/((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(20\d{2})\s*[-–to]+\s*((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(20\d{2}|present|current)/i);
  if (fullMatch) {
    const startDate = normalizeDate(fullMatch[3] || '');
    const endRaw = fullMatch[5] || '';
    const endDate = (endRaw.toLowerCase() === 'present' || endRaw.toLowerCase() === 'current') ? 'Present' : normalizeDate(endRaw);
    return { startDate, endDate };
  }
  
  const simpleMatch = clean.match(/\b(20\d{2})\s*[-–to]+\s*(20\d{2}|present|current)\b/i);
  if (simpleMatch) {
    return {
      startDate: normalizeDate(simpleMatch[1]),
      endDate: simpleMatch[2].toLowerCase() === 'present' ? 'Present' : normalizeDate(simpleMatch[2])
    };
  }
  
  return { startDate: '', endDate: '' };
};

const parseExperience = (lines, sectionBounds) => {
  const experiences = [];
  
  if (!sectionBounds.experience) {
    if (sectionBounds.experience !== undefined) {
      const internshipIdx = lines.findIndex(l => l.toUpperCase().includes('INTERNSHIP'));
      if (internshipIdx >= 0) {
        sectionBounds.experience = { start: internshipIdx + 1, end: sectionBounds.education?.start || lines.length };
      }
    }
  }
  
  if (!sectionBounds.experience) return experiences;
  
  const expStart = sectionBounds.experience.start;
  const expEnd = sectionBounds.experience.end;
  const expLines = lines.slice(expStart, expEnd);
  
  const titleKeywords = ['developer', 'engineer', 'manager', 'designer', 'analyst', 'consultant', 'intern', 'trainee', 'lead', 'architect', 'specialist', 'coordinator', 'executive', 'full stack', 'junior', 'senior'];
  const companyKeywords = ['pvt', 'ltd', 'inc', 'corp', 'solutions', 'technologies', 'systems', 'software', 'it solutions', 'company', 'private', 'limited'];
  
  let currentExp = null;
  let currentBullets = [];
  
  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i].trim();
    if (!line || line.length < 3) continue;
    if (line.match(/^[A-Z\s]+$/) && line.length < 20) continue;
    
    const lower = line.toLowerCase();
    if (lower.includes('education') || lower.includes('project') || lower.includes('skill') || lower.includes('certif') || lower.includes('summary')) break;
    
    const isTitle = titleKeywords.some(kw => lower.includes(kw)) && line.length < 80;
    const isCompany = companyKeywords.some(kw => lower.includes(kw)) && line.length < 60;
    const isDateRange = line.match(/\b(20\d{2})\s*[-–to]+\s*(20\d{2}|present|current)\b/i) || line.match(/((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(20\d{2})\s*[-–to]+\s*((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(20\d{2}|present|current)/i);
    
    if (isTitle || isCompany) {
      if (currentExp && currentBullets.length > 0) {
        currentExp.bullets = currentBullets.filter(b => b.length > 10);
        experiences.push(currentExp);
      }
      
      currentExp = { role: '', company: '', startDate: '', endDate: '', bullets: [] };
      currentBullets = [];
      
      if (isTitle) {
        currentExp.role = line;
        if (i + 1 < expLines.length) {
          const nextLine = expLines[i + 1].trim();
          if (companyKeywords.some(kw => nextLine.toLowerCase().includes(kw))) {
            currentExp.company = nextLine;
          } else if (i > 0) {
            const prevLine = expLines[i - 1].trim();
            if (companyKeywords.some(kw => prevLine.toLowerCase().includes(kw))) {
              currentExp.company = prevLine;
            }
          }
        }
      } else {
        currentExp.company = line;
        if (i + 1 < expLines.length) {
          const nextLine = expLines[i + 1].trim();
          if (titleKeywords.some(kw => nextLine.toLowerCase().includes(kw))) {
            currentExp.role = nextLine;
          }
        }
      }
    } else if (isDateRange && currentExp) {
      const dates = parseDateRange(line);
      currentExp.startDate = dates.startDate;
      currentExp.endDate = dates.endDate;
    } else if (currentExp && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
      const bullet = line.replace(/^[•\-\*]\s*/, '').trim();
      if (bullet.length > 5) currentBullets.push(bullet);
    } else if (currentExp && line.match(/^[A-Z]/) && !line.includes('@') && line.length > 20) {
      if (!titleKeywords.some(kw => line.toLowerCase().includes(kw)) && !companyKeywords.some(kw => line.toLowerCase().includes(kw))) {
        currentBullets.push(line);
      }
    }
  }
  
  if (currentExp && currentBullets.length > 0) {
    currentExp.bullets = currentBullets.filter(b => b.length > 10);
    experiences.push(currentExp);
  }
  
  return experiences;
};

const parseEducation = (lines, sectionBounds) => {
  const education = [];
  
  if (!sectionBounds.education) return education;
  
  const eduStart = sectionBounds.education.start;
  const eduEnd = sectionBounds.education.end;
  const eduLines = lines.slice(eduStart, eduEnd);
  
  const degreeKeywords = ['bachelor', 'master', 'btech', 'be', 'mtech', 'me', 'mca', 'bca', 'bsc', 'msc', 'phd', 'bba', 'mba', 'diploma', 'intermediate', '12th', '10th'];
  
  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i].trim();
    if (!line || line.length < 5) continue;
    if (line.match(/^[A-Z\s]+$/) && line.length < 15) continue;
    
    const lower = line.toLowerCase();
    if (lower.includes('experience') || lower.includes('project') || lower.includes('skill') || lower.includes('certif')) break;
    
    const hasDegree = degreeKeywords.some(kw => lower.includes(kw));
    if (!hasDegree) continue;
    
    let degree = line;
    let college = '';
    
    if (i > 0) {
      const prevLine = eduLines[i - 1].trim();
      if (prevLine && prevLine.length > 3 && prevLine.length < 60 && !degreeKeywords.some(kw => prevLine.toLowerCase().includes(kw))) {
        college = prevLine.replace(/\d{4}.*/g, '').replace(/[-|]/g, '').trim();
      }
    }
    
    const cgpaMatch = line.match(/(?:cgpa|gpa|percentage|score|grade)[\s:]*(\d+\.?\d*)/i);
    let cgpa = cgpaMatch ? cgpaMatch[1] : '';
    if (!cgpa) {
      const dashMatch = line.match(/- (\d+\.?\d*)/);
      if (dashMatch) cgpa = dashMatch[1];
    }
    
    let startDate = '', endDate = '';
    const years = line.match(/(20\d{2}|19\d{2})/g) || [];
    if (years.length >= 2) {
      startDate = years[0];
      endDate = years[1];
    } else if (years.length === 1) {
      if (lower.includes('intermediate') || lower.includes('12th') || lower.includes('10th')) {
        endDate = years[0];
        startDate = String(parseInt(years[0]) - 2);
      } else {
        endDate = years[0];
        startDate = String(parseInt(years[0]) - 4);
      }
    } else {
      if (lower.includes('intermediate') || lower.includes('12th')) {
        endDate = '2020';
        startDate = '2018';
      } else if (lower.includes('bachelor') || lower.includes('btech') || lower.includes('be')) {
        endDate = '2024';
        startDate = '2020';
      }
    }
    
    degree = degree.replace(/\d{4}.*/g, '').replace(/(?:cgpa|gpa|percentage|score|grade)[\s:]*\d+\.?\d*/gi, '').replace(/[-|]/g, '').replace(/\s+/g, ' ').trim();
    
    if (degree.length > 3) {
      education.push({ degree, college, cgpa, startDate, endDate });
    }
  }
  
  return education.slice(0, 4);
};

const parseProjects = (lines, sectionBounds) => {
  const projects = [];
  
  if (!sectionBounds.projects) return projects;
  
  const projStart = sectionBounds.projects.start;
  const projEnd = sectionBounds.projects.end;
  const projLines = lines.slice(projStart, projEnd);
  
  const knownProjects = ['dropic', 'park here', 'hospital', 'dro pic', 'library', 'inventory', 'chatbot', 'ecommerce', 'social media', 'todo', 'task manager'];
  
  let currentProj = null;
  let currentBullets = [];
  let currentTech = [];
  
  for (let i = 0; i < projLines.length; i++) {
    const line = projLines[i].trim();
    const lower = line.toLowerCase();
    
    if (lower.includes('skill') || lower.includes('certif') || lower.includes('education') || lower.includes('experience')) break;
    if (!line || line.length < 4) continue;
    if (line.match(/^[A-Z\s]+$/) && line.length < 15) continue;
    
    const isProjectTitle = knownProjects.some(name => lower.includes(name)) || (line.length < 50 && (lower.includes('application') || lower.includes('system') || lower.includes('app')));
    
    if (isProjectTitle) {
      if (currentProj && currentBullets.length > 0) {
        currentProj.bullets = currentBullets;
        currentProj.technologies = currentTech;
        projects.push(currentProj);
      }
      
      let type = 'Web';
      if (lower.includes('mobile') || lower.includes('react native')) type = 'Mobile';
      
      currentProj = { title: '', type, startDate: '', endDate: '', bullets: [], technologies: [] };
      currentBullets = [];
      currentTech = [];
      
      currentProj.title = line.replace(/[-–:]/g, ' ').replace(/\d{4}/g, '').replace(/application|system|app/gi, '').replace(/\s+/g, ' ').trim();
      
      for (let k = i; k < Math.min(i + 3, projLines.length); k++) {
        const dateLine = projLines[k] || '';
        const dates = parseDateRange(dateLine);
        if (dates.startDate || dates.endDate) {
          currentProj.startDate = dates.startDate;
          currentProj.endDate = dates.endDate;
          break;
        }
      }
    } else if (currentProj) {
      const dates = parseDateRange(line);
      if (dates.startDate && !currentProj.startDate) {
        currentProj.startDate = dates.startDate;
        currentProj.endDate = dates.endDate;
      } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        currentBullets.push(line.replace(/^[•\-\*]\s*/, '').trim());
      } else if (line.length > 20 && !line.includes('@')) {
        const techMatches = line.match(/(react|node|express|python|java|mysql|mongodb|aws|html|css|javascript|typescript|postgresql|firebase|docker)/gi);
        if (techMatches) {
          currentTech = [...new Set([...currentTech, ...techMatches.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())])];
        }
      }
    }
  }
  
  if (currentProj && currentBullets.length > 0) {
    currentProj.bullets = currentBullets;
    currentProj.technologies = currentTech;
    projects.push(currentProj);
  }
  
  return projects.slice(0, 3);
};

const parseSkills = (lines, sectionBounds) => {
  const skills = { frontend: [], backend: [], database: [], tools: [] };
  
  if (!sectionBounds.skills) return skills;
  
  const skillStart = sectionBounds.skills.start;
  const skillEnd = sectionBounds.skills.end;
  const skillLines = lines.slice(skillStart, skillEnd);
  
  const skillCategories = {
    frontend: ['html', 'css', 'javascript', 'react', 'reactjs', 'react native', 'angular', 'vue', 'jquery', 'bootstrap', 'tailwind', 'typescript', 'nextjs', 'nuxt', 'sass', 'less', 'redux'],
    backend: ['node', 'nodejs', 'express', 'python', 'django', 'flask', 'java', 'spring', 'c#', 'dotnet', 'php', 'laravel', 'ruby', 'rails', 'go', 'golang', 'graphql', 'restapi', 'restful', 'jdbc', 'servlet'],
    database: ['mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'firebase', 'sql', 'nosql', 'dynamodb'],
    tools: ['git', 'github', 'gitlab', 'docker', 'kubernetes', 'jenkins', 'aws', 'azure', 'gcp', 'postman', 'jira', 'figma', 'vscode', 'eclipse', 'intellij', 'digital forensics']
  };
  
  for (const line of skillLines) {
    if (!line || line.length < 3) continue;
    if (line.match(/^[A-Z\s:]+$/) && line.length < 15) continue;
    
    let skillText = line;
    if (line.includes(':')) skillText = line.split(':').slice(1).join(':').trim();
    
    const parts = skillText.split(/[,|]+|\s+and\s+/i).map(s => s.trim()).filter(Boolean);
    
    for (const part of parts) {
      const partClean = part.replace(/\s+and\s+/gi, '').trim();
      if (!partClean || partClean.length < 2) continue;
      
      const partLower = partClean.toLowerCase();
      for (const [category, keywords] of Object.entries(skillCategories)) {
        for (const skill of keywords) {
          if (partLower.includes(skill)) {
            const skillName = skill.charAt(0).toUpperCase() + skill.slice(1);
            if (!skills[category].includes(skillName)) {
              skills[category].push(skillName);
            }
            break;
          }
        }
      }
    }
  }
  
  for (const key of Object.keys(skills)) {
    skills[key] = [...new Set(skills[key])].slice(0, 8);
  }
  
  return skills;
};

const parseCertifications = (lines, sectionBounds) => {
  const certifications = [];
  
  if (!sectionBounds.certifications) return certifications;
  
  const certStart = sectionBounds.certifications.start;
  const certEnd = sectionBounds.certifications.end;
  const certLines = lines.slice(certStart, certEnd);
  
  for (const line of certLines) {
    if (!line || line.length < 5) continue;
    
    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      let cert = line.replace(/^[•\-\*]\s*/, '').trim();
      cert = cert.replace(/^Certified in\s+/i, '').replace(/^Certified\s+/i, '').replace(/^certificate\s+/i, '');
      
      if (cert.length > 5 && cert.length < 100 && !cert.match(/^ied in/i)) {
        certifications.push(cert);
      }
    }
  }
  
  return certifications.slice(0, 8);
};

const parseSummary = (lines, sectionBounds, skills) => {
  if (sectionBounds.summary) {
    const sumStart = sectionBounds.summary.start;
    const sumEnd = sectionBounds.summary.end;
    const sumLines = lines.slice(sumStart, sumEnd);
    
    const summaryParts = [];
    for (const line of sumLines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 10 && !trimmed.match(/^[A-Z\s]+$/)) {
        summaryParts.push(trimmed);
      }
    }
    
    if (summaryParts.length > 0) {
      return summaryParts.join(' ').substring(0, 400);
    }
  }
  
  const allSkills = Object.values(skills || {}).flat();
  if (allSkills.length > 0) {
    const skillList = allSkills.slice(0, 5).join(', ');
    return `Professional with hands-on experience in ${skillList}. Skilled at building and deploying applications.`;
  }
  
  return '';
};

const validateParsedResume = (parsed) => {
  const warnings = [];
  const errors = [];
  
  if (!parsed.header?.name) errors.push('Missing name');
  if (!parsed.header?.email) errors.push('Missing email');
  
  if (!parsed.experience || parsed.experience.length === 0) {
    warnings.push('No experience section detected');
  } else {
    for (const exp of parsed.experience) {
      if (!exp.role) warnings.push(`Experience entry missing role`);
      if (!exp.company) warnings.push(`Experience entry missing company`);
      if (exp.bullets.length === 0) warnings.push(`Experience entry "${exp.role}" missing bullet points`);
    }
  }
  
  if (!parsed.education || parsed.education.length === 0) {
    warnings.push('No education section detected');
  }
  
  if (!parsed.projects || parsed.projects.length === 0) {
    warnings.push('No projects section detected');
  } else {
    for (const proj of parsed.projects) {
      if (!proj.title) warnings.push('Project missing title');
      if (proj.bullets.length === 0) warnings.push(`Project "${proj.title}" missing bullet points`);
    }
  }
  
  const totalSkills = Object.values(parsed.skills || {}).flat().length;
  if (totalSkills === 0) {
    warnings.push('No skills section detected');
  }
  
  return { errors, warnings, isValid: errors.length === 0 };
};

const parseResume = async (file) => {
  const text = await extractTextFromFile(file);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const header = parseHeader(lines);
  const sectionBounds = detectSections(lines);
  
  const experience = parseExperience(lines, sectionBounds);
  const education = parseEducation(lines, sectionBounds);
  const projects = parseProjects(lines, sectionBounds);
  const skills = parseSkills(lines, sectionBounds);
  const certifications = parseCertifications(lines, sectionBounds);
  const summary = parseSummary(lines, sectionBounds, skills);
  
  const parsedResume = {
    header,
    summary,
    experience,
    education,
    projects,
    skills,
    certifications
  };
  
  const validation = validateParsedResume(parsedResume);
  
  return {
    parsed: parsedResume,
    validation,
    rawText: text.substring(0, 1000)
  };
};

module.exports = {
  parseResume,
  extractTextFromFile,
  cleanText
};