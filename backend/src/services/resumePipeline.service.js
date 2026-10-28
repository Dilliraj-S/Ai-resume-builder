const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

const STRICT_SCHEMA = {
  name: '',
  title: '',
  contact: {
    email: '',
    phone: '',
    linkedin: '',
    location: 'Not specified'
  },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: {
    frontend: [],
    backend: [],
    database: [],
    tools: []
  },
  certifications: []
};

const TECH_NORMALIZATION = {
  'react': 'React', 'reactjs': 'React',
  'node': 'Node.js', 'nodejs': 'Node.js',
  'javascript': 'JavaScript', 'js': 'JavaScript',
  'typescript': 'TypeScript', 'ts': 'TypeScript',
  'python': 'Python', 'java': 'Java',
  'html': 'HTML', 'css': 'CSS',
  'sql': 'SQL', 'mysql': 'MySQL',
  'mongodb': 'MongoDB', 'postgresql': 'PostgreSQL',
  'express': 'Express.js', 'expressjs': 'Express.js',
  'angular': 'Angular', 'vue': 'Vue.js',
  'django': 'Django', 'flask': 'Flask',
  'spring': 'Spring', 'bootstrap': 'Bootstrap',
  'tailwind': 'Tailwind', 'redux': 'Redux',
  'api': 'API', 'rest': 'REST',
  'restful': 'RESTful', 'jwt': 'JWT',
  'aws': 'AWS', 'gcp': 'GCP',
  'docker': 'Docker', 'kubernetes': 'Kubernetes',
  'git': 'Git', 'github': 'GitHub',
  'postman': 'Postman', 'vscode': 'VS Code',
  'eclipse': 'Eclipse', 'intellij': 'IntelliJ',
  'firebase': 'Firebase', 'redis': 'Redis',
  'graphql': 'GraphQL', 'kafka': 'Kafka'
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_MAP = { jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec' };

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s*[-–]\s*/g, '-')
    .replace(/^\s*-\s*/, '')
    .trim();
};

const normalizeTech = (text) => {
  if (!text) return '';
  let result = text.toString();
  for (const [lower, proper] of Object.entries(TECH_NORMALIZATION)) {
    result = result.replace(new RegExp(`\\b${lower}\\b`, 'gi'), proper);
  }
  return result;
};

const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.toLowerCase().trim();
  if (clean === 'present' || clean === 'current') return 'Present';
  if (MONTHS.includes(clean)) return '';
  
  const match = clean.match(/((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)(20\d{2})/i);
  if (match) {
    const monthKey = match[1].toLowerCase().replace(/\./g, '').trim();
    return `${MONTH_MAP[monthKey] || 'Jan'} ${match[3]}`;
  }
  
  const yearOnly = clean.match(/\b(20\d{2})\b/);
  if (yearOnly) return `Jan ${yearOnly[1]}`;
  return '';
};

const formatDateRange = (startDate, endDate) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  if (!start && !end) return '';
  if (!start && end) return end;
  if (start && !end) return `${start} – Present`;
  if (end === 'Present') return `${start} – Present`;
  return `${start} – ${end}`;
};

const toSentenceCase = (str) => {
  if (!str) return '';
  const cleaned = normalizeText(str);
  let result = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  ['hands-on', 'real-time', 'end-to-end', 'full-stack', 'front-end', 'back-end'].forEach(word => {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), word);
  });
  return result;
};

const isStandaloneMonth = (str) => {
  return MONTHS.includes(str?.toLowerCase?.().trim());
};

const cleanTextFn = (text) => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
};

const extractTextFromFile = async (file) => {
  const { mimetype, buffer } = file;
  if (mimetype === 'application/pdf') {
    const data = await pdf(buffer);
    return cleanTextFn(data.text);
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return cleanTextFn(result.value);
  } else if (mimetype === 'text/plain') {
    return buffer.toString('utf-8');
  }
  throw new Error('Unsupported file format');
};

const detectSections = (lines) => {
  const sections = {};
  const keywords = {
    summary: ['summary', 'professional summary', 'profile', 'career objective'],
    experience: ['experience', 'work experience', 'internship', 'internships', 'employment'],
    education: ['education', 'academic', 'qualification'],
    projects: ['projects', 'project'],
    skills: ['skills', 'technical skills', 'technologies'],
    certifications: ['certifications', 'certification', 'certificate']
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const upper = line.toUpperCase();
    for (const [section, kws] of Object.entries(keywords)) {
      if (!sections[section]) {
        for (const kw of kws) {
          if (upper === kw.toUpperCase() || upper.startsWith(kw.toUpperCase() + ':') || upper.startsWith(kw.toUpperCase() + ' -')) {
            sections[section] = { start: i + 1, end: lines.length };
            break;
          }
        }
      }
    }
  }
  
  const order = ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'];
  let prevEnd = 0;
  for (const section of order) {
    if (sections[section]) {
      sections[section].end = prevEnd || sections[section].start;
      prevEnd = sections[section].start;
    }
  }
  return sections;
};

const parseHeader = (lines) => {
  const header = { name: '', email: '', phone: '', linkedin: '', location: 'Not specified' };
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:(?:\+|0)?91[-.\s]?)?(?:[6-9]\d{9})/;
  
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim();
    if (!header.email) {
      const m = line.match(emailRegex);
      if (m) header.email = m[0];
    }
    if (!header.phone) {
      const m = line.match(phoneRegex);
      if (m) header.phone = m[0].replace(/\s+/g, ' ');
    }
    if (!header.name && line.length > 2 && line.length < 50) {
      if (line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/) && !line.includes('@')) {
        header.name = line;
      }
    }
  }
  return header;
};

const parseExperience = (lines, bounds) => {
  const experiences = [];
  if (!bounds.experience) return experiences;
  
  const expLines = lines.slice(bounds.experience.start, bounds.experience.end);
  const titleKw = ['developer', 'engineer', 'manager', 'designer', 'analyst', 'intern', 'trainee', 'lead', 'architect'];
  const compKw = ['pvt', 'ltd', 'inc', 'corp', 'solutions', 'technologies', 'systems', 'software', 'company'];
  
  let current = null;
  
  for (const line of expLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;
    if (trimmed.match(/^[A-Z\s]+$/) && trimmed.length < 20) continue;
    
    const lower = trimmed.toLowerCase();
    if (lower.includes('education') || lower.includes('project') || lower.includes('skill') || lower.includes('certif')) break;
    
    const isTitle = titleKw.some(kw => lower.includes(kw));
    const isComp = compKw.some(kw => lower.includes(kw));
    
    if (isTitle || isComp) {
      if (current && current.bullets.length > 0) experiences.push(current);
      
      current = { role: '', company: '', startDate: '', endDate: '', location: 'Not specified', description: '', bullets: [] };
      
      if (isTitle) {
        current.role = toSentenceCase(trimmed);
      } else {
        current.company = normalizeText(trimmed);
      }
    } else if (current) {
      const dateMatch = trimmed.match(/\b(20\d{2})\s*[-–]+\s*(20\d{2}|present|current)\b/i);
      if (dateMatch) {
        current.startDate = normalizeDate(dateMatch[1]);
        current.endDate = dateMatch[2].toLowerCase() === 'present' ? 'Present' : normalizeDate(dateMatch[2]);
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        current.bullets.push(toSentenceCase(normalizeTech(trimmed.replace(/^[•\-\*]\s*/, ''))));
      }
    }
  }
  
  if (current && current.bullets.length > 0) experiences.push(current);
  
  return experiences.map(exp => ({
    ...exp,
    endDate: exp.endDate || 'Present',
    bullets: (exp.bullets || []).slice(0, 5)
  }));
};

const parseEducation = (lines, bounds) => {
  const education = [];
  if (!bounds.education) return education;
  
  const eduLines = lines.slice(bounds.education.start, bounds.education.end);
  const degreeKw = ['bachelor', 'master', 'btech', 'be', 'mtech', 'me', 'mca', 'bca', 'bsc', 'msc', 'diploma', 'intermediate', '12th', '10th'];
  
  for (const line of eduLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;
    if (trimmed.match(/^[A-Z\s]+$/) && trimmed.length < 15) continue;
    
    const lower = trimmed.toLowerCase();
    if (lower.includes('experience') || lower.includes('project') || lower.includes('skill')) break;
    
    if (!degreeKw.some(kw => lower.includes(kw))) continue;
    
    const degree = toSentenceCase(normalizeText(trimmed.replace(/\d{4}.*/g, '').replace(/(?:cgpa|gpa|percentage)[\s:]*\d+\.?\d*/gi, '')));
    const cgpaMatch = trimmed.match(/(?:cgpa|gpa|percentage)[\s:]*(\d+\.?\d*)/i);
    const cgpa = cgpaMatch ? cgpaMatch[1] : '';
    
    const years = trimmed.match(/(20\d{2}|19\d{2})/g) || [];
    let startDate = '', endDate = '';
    
    if (years.length >= 2) {
      startDate = normalizeDate(years[0]);
      endDate = normalizeDate(years[1]);
    } else if (years.length === 1) {
      endDate = normalizeDate(years[0]);
      if (lower.includes('intermediate') || lower.includes('12th')) startDate = String(parseInt(years[0]) - 2);
      else startDate = String(parseInt(years[0]) - 4);
    }
    
    if (isStandaloneMonth(startDate)) startDate = '';
    if (isStandaloneMonth(endDate)) endDate = '';
    
    if (degree.length > 3) {
      education.push({ degree, institution: '', startDate, endDate, location: 'Not specified', cgpa });
    }
  }
  
  return education;
};

const parseProjects = (lines, bounds) => {
  const projects = [];
  if (!bounds.projects) return projects;
  
  const projLines = lines.slice(bounds.projects.start, bounds.projects.end);
  const knownProjects = ['dropic', 'park here', 'hospital', 'dro pic', 'library', 'inventory', 'chatbot'];
  
  let current = null;
  
  for (const line of projLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 4) continue;
    if (trimmed.match(/^[A-Z\s]+$/) && trimmed.length < 15) continue;
    
    const lower = trimmed.toLowerCase();
    if (lower.includes('skill') || lower.includes('certif') || lower.includes('education') || lower.includes('experience')) break;
    
    const isProjectTitle = knownProjects.some(name => lower.includes(name)) || (trimmed.length < 50 && (lower.includes('application') || lower.includes('system')));
    
    if (isProjectTitle) {
      if (current && current.bullets.length > 0) projects.push(current);
      
      let type = 'Web Application';
      if (lower.includes('mobile') || lower.includes('react native')) type = 'Mobile Application';
      
      const title = toSentenceCase(normalizeText(trimmed.replace(/\d{4}/g, '').replace(/application|system|app/gi, '')));
      current = { title, type, startDate: '', endDate: '', description: '', bullets: [], technologies: [] };
    } else if (current) {
      const dateMatch = trimmed.match(/\b(20\d{2})\s*[-–]+\s*(20\d{2}|present|current)\b/i);
      if (dateMatch && !current.startDate) {
        current.startDate = normalizeDate(dateMatch[1]);
        current.endDate = dateMatch[2].toLowerCase() === 'present' ? 'Present' : normalizeDate(dateMatch[2]);
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        current.bullets.push(toSentenceCase(normalizeTech(trimmed.replace(/^[•\-\*]\s*/, ''))));
      }
    }
  }
  
  if (current && current.bullets.length > 0) projects.push(current);
  
  return projects.map(p => ({
    ...p,
    bullets: (p.bullets || []).slice(0, 5),
    startDate: p.startDate || '',
    endDate: p.endDate || 'Present'
  }));
};

const parseSkills = (lines, bounds) => {
  const skills = { frontend: [], backend: [], database: [], tools: [] };
  if (!bounds.skills) return skills;
  
  const skillLines = lines.slice(bounds.skills.start, bounds.skills.end);
  const categories = {
    frontend: ['html', 'css', 'javascript', 'react', 'angular', 'vue', 'jquery', 'bootstrap', 'tailwind', 'typescript', 'redux'],
    backend: ['node', 'python', 'java', 'django', 'spring', 'express', 'flask', 'php', 'ruby', 'golang'],
    database: ['mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'firebase', 'sql', 'nosql'],
    tools: ['git', 'docker', 'aws', 'azure', 'gcp', 'postman', 'jira', 'figma', 'vscode', 'eclipse', 'intellij']
  };
  
  for (const line of skillLines) {
    if (!line || line.length < 3) continue;
    
    let text = line;
    if (line.includes(':')) text = line.split(':').slice(1).join(':').trim();
    
    const parts = text.split(/[,|]+|\s+and\s+/i).map(s => s.trim()).filter(Boolean);
    
    for (const part of parts) {
      const clean = normalizeTech(part.charAt(0).toUpperCase() + part.slice(1));
      if (!clean || clean.length < 2) continue;
      
      const lower = clean.toLowerCase();
      for (const [cat, kws] of Object.entries(categories)) {
        if (kws.some(kw => lower.includes(kw)) && !skills[cat].includes(clean)) {
          skills[cat].push(clean);
          break;
        }
      }
    }
  }
  
  for (const key of Object.keys(skills)) {
    skills[key] = [...new Set(skills[key])].slice(0, 8);
  }
  
  return skills;
};

const parseCertifications = (lines, bounds) => {
  const certs = [];
  if (!bounds.certifications) return certs;
  
  const certLines = lines.slice(bounds.certifications.start, bounds.certifications.end);
  
  for (const line of certLines) {
    if (!line || line.length < 5) continue;
    if (line.startsWith('•') || line.startsWith('-')) {
      const cert = normalizeText(line.replace(/^[•\-\*]\s*/, '').replace(/^Certified\s+/i, ''));
      if (cert.length > 3 && cert.length < 100) certs.push(cert);
    }
  }
  
  return certs.slice(0, 8);
};

const generateSummary = (experience, skills) => {
  const role = experience[0]?.role || '';
  const allSkills = Object.values(skills).flat().slice(0, 5).join(', ');
  
  if (!role && !allSkills) return '';
  
  return toSentenceCase(`${role} with hands-on experience${allSkills ? ` in ${allSkills}` : ''}, building scalable web applications.`);
};

const buildSchema = (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      const logger = { info: (...args) => console.log('[PIPELINE]', ...args), warn: (...args) => console.warn('[PIPELINE]', ...args) };
      
      logger.info('STEP 1: extractText');
      const text = await extractTextFromFile(file);
      
      logger.info('STEP 2: parseRawText');
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const bounds = detectSections(lines);
      
      logger.info('STEP 3: mapToSchema');
      const contact = parseHeader(lines);
      const name = contact.email ? contact.email.split('@')[0].replace('.', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
      
      logger.info('STEP 4: normalizeData');
      let experience = parseExperience(lines, bounds);
      let education = parseEducation(lines, bounds);
      let projects = parseProjects(lines, bounds);
      let skills = parseSkills(lines, bounds);
      let certifications = parseCertifications(lines, bounds);
      
      logger.info('STEP 5: applyRules');
      experience = experience.map(exp => ({
        ...exp,
        endDate: exp.endDate || 'Present',
        bullets: exp.bullets.filter(b => b.length > 10).slice(0, 5)
      }));
      
      projects = projects.map(proj => ({
        ...proj,
        type: proj.title.toLowerCase().includes('mobile') ? 'Mobile Application' : 'Web Application',
        endDate: proj.endDate || 'Present'
      }));
      
      education = education.map(edu => ({
        ...edu,
        startDate: isStandaloneMonth(edu.startDate) ? '' : edu.startDate,
        endDate: isStandaloneMonth(edu.endDate) ? '' : edu.endDate
      }));
      
      logger.info('STEP 6: applyDefaults');
      let summary = generateSummary(experience, skills);
      
      const finalSchema = {
        name: name || 'Not specified',
        title: experience[0]?.role || '',
        contact,
        summary,
        experience,
        education,
        projects,
        skills,
        certifications
      };
      
      logger.info('STEP 7: FINAL STRUCTURED', JSON.stringify(finalSchema, null, 2).substring(0, 500));
      
      resolve({ success: true, data: finalSchema });
    } catch (error) {
      reject({ success: false, error: error.message });
    }
  });
};

module.exports = { buildSchema, STRICT_SCHEMA };