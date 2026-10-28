const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  
  const months = {
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
    jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec'
  };
  
  const clean = dateStr.toLowerCase().trim();
  
  if (clean === 'present' || clean === 'current') return 'Present';
  
  const hasPresent = clean.includes('present') || clean.includes('current');
  if (hasPresent) {
    const match = clean.match(/((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)(20\d{2})/i);
    if (match) {
      const monthKey = match[1].toLowerCase().replace(/\./g, '').trim();
      return `${months[monthKey] || 'Jan'} ${match[3]}`;
    }
    const yearOnly = clean.match(/\b(20\d{2})\b/);
    if (yearOnly) return `Jan ${yearOnly[1]}`;
    return '';
  }
  
  const match = clean.match(/((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)(20\d{2})/i);
  if (match) {
    const monthKey = match[1].toLowerCase().replace(/\./g, '').trim();
    return `${months[monthKey] || 'Jan'} ${match[3]}`;
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

const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/[|]/g, '')
    .replace(/\s*[-–]\s*/g, '-')
    .replace(/^\s*-\s*/, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .trim();
};

const toSentenceCase = (str) => {
  if (!str) return '';
  const cleaned = cleanText(str);
  let result = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  const hyphenWords = ['hands-on', 'real-time', 'end-to-end', 'full-stack', 'front-end', 'back-end', 'node-js', 'react-js', 'postgresql', 'mysql'];
  for (const word of hyphenWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, word);
  }
  return result;
};

const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
};

const normalizeTech = (text) => {
  if (!text) return '';
  const techMap = {
    'react': 'React',
    'reactjs': 'React',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'html': 'HTML',
    'css': 'CSS',
    'sql': 'SQL',
    'mysql': 'MySQL',
    'mongodb': 'MongoDB',
    'postgresql': 'PostgreSQL',
    'express': 'Express.js',
    'expressjs': 'Express.js',
    'angular': 'Angular',
    'vue': 'Vue.js',
    'django': 'Django',
    'flask': 'Flask',
    'spring': 'Spring',
    'bootstrap': 'Bootstrap',
    'tailwind': 'Tailwind',
    'redux': 'Redux',
    'api': 'API',
    'rest': 'REST',
    'restful': 'RESTful',
    'jwt': 'JWT',
    'aws': 'AWS',
    'gcp': 'GCP',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'git': 'Git',
    'github': 'GitHub',
    'postman': 'Postman',
    'vscode': 'VS Code',
    'eclipse': 'Eclipse',
    'intellij': 'IntelliJ',
    'firebase': 'Firebase',
    'redis': 'Redis',
    'elasticsearch': 'Elasticsearch',
    'kafka': 'Kafka',
    'graphql': 'GraphQL',
    'cicd': 'CI/CD'
  };
  let result = text.toString();
  for (const [lower, proper] of Object.entries(techMap)) {
    const regex = new RegExp(`\\b${lower}\\b`, 'gi');
    result = result.replace(regex, proper);
  }
  return result;
};

const formatRole = (role) => {
  if (!role) return '';
  let cleaned = role
    .replace(/^Intern\s*-\s*/i, '')
    .replace(/^Internship\s*-\s*/i, '')
    .replace(/Intern$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const lowerWords = ['and', 'or', 'the', 'of', 'for', 'in', 'with', 'on', 'at', 'to'];
  const words = cleaned.split(' ');
  const capitalized = words.map((word, idx) => {
    if (idx > 0 && lowerWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  return capitalizeWords(capitalized.join(' '));
};

const formatExperience = (experience) => {
  if (!Array.isArray(experience)) return [];
  
  return experience.map(exp => {
    const role = formatRole(exp.role || '');
    const company = cleanText(capitalizeWords(exp.company || ''));
    
    let startDate = normalizeDate(exp.startDate);
    let endDate = normalizeDate(exp.endDate);
    if (!endDate || endDate === '') endDate = 'Present';
    if (exp.currentlyWorking) endDate = 'Present';
    
    let bullets = [];
    if (Array.isArray(exp.bullets)) {
      bullets = exp.bullets
        .map(b => toSentenceCase(normalizeTech(b)))
        .filter(b => b.length > 10 && b.length < 300)
        .slice(0, 5);
    } else if (typeof exp.bullets === 'string') {
      bullets = exp.bullets
        .split('\n')
        .map(b => toSentenceCase(normalizeTech(b)))
        .filter(b => b.length > 10 && b.length < 300)
        .slice(0, 5);
    }
    
    return {
      role,
      company,
      startDate,
      endDate,
      bullets,
      formatted: `${role} at ${company} | ${formatDateRange(startDate, endDate)}`
    };
  }).filter(exp => exp.role && exp.company);
};

const formatEducation = (education) => {
  if (!Array.isArray(education)) return [];
  
  return education.map(edu => {
    let degree = cleanText(capitalizeWords(edu.degree || ''));
    let college = cleanText(capitalizeWords(edu.college || ''));
    const cgpa = edu.cgpa || '';
    
    let startDate = edu.startDate || '';
    let endDate = edu.endDate || '';
    
    const isStandaloneMonth = (dateStr) => {
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      return months.includes(dateStr?.toLowerCase?.().trim());
    };
    
    if (isStandaloneMonth(startDate)) startDate = '';
    if (isStandaloneMonth(endDate)) endDate = '';
    
    if (startDate && !startDate.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/)) {
      startDate = '';
    }
    if (endDate && !endDate.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/)) {
      endDate = '';
    }
    
    const dateRange = formatDateRange(startDate, endDate);
    const cgpaStr = cgpa ? `CGPA: ${cgpa}` : '';
    
    const parts = [];
    if (degree) parts.push(degree);
    if (college) parts.push(college);
    if (dateRange) parts.push(dateRange);
    if (cgpaStr) parts.push(cgpaStr);
    
    return {
      degree,
      college,
      startDate,
      endDate,
      cgpa,
      formatted: parts.join(' | ')
    };
  }).filter(edu => edu.degree);
};

const formatProjects = (projects) => {
  if (!Array.isArray(projects)) return [];
  
  return projects.map(proj => {
    const title = cleanText(capitalizeWords(proj.title || ''));
    let type = proj.type || 'Web';
    
    if (type.toLowerCase() === 'mobile') type = 'Mobile Application';
    else if (type.toLowerCase() === 'web') type = 'Web Application';
    else if (title.toLowerCase().includes('mobile')) type = 'Mobile Application';
    else type = 'Web Application';
    
    let startDate = proj.startDate || '';
    let endDate = proj.endDate || '';
    
    if (startDate && startDate.toLowerCase().includes('june') && !startDate.match(/\d{4}/)) {
      startDate = '';
    }
    if (endDate && endDate.toLowerCase().includes('june') && !endDate.match(/\d{4}/)) {
      endDate = '';
    }
    
    if (startDate && !startDate.match(/^\d{4}$/)) {
      startDate = normalizeDate(startDate);
    }
    if (endDate && !endDate.match(/^\d{4}$/)) {
      endDate = normalizeDate(endDate);
    }
    
    if (startDate && !startDate.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/)) {
      startDate = '';
    }
    if (endDate && !endDate.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/)) {
      endDate = '';
    }
    
    const dateRange = formatDateRange(startDate, endDate);
    let bullets = [];
    if (Array.isArray(proj.bullets)) {
      bullets = proj.bullets
        .map(b => toSentenceCase(normalizeTech(b)))
        .filter(b => b.length > 5 && b.length < 300)
        .slice(0, 5);
    } else if (typeof proj.bullets === 'string') {
      bullets = proj.bullets
        .split('\n')
        .map(b => toSentenceCase(normalizeTech(b)))
        .filter(b => b.length > 5 && b.length < 300)
        .slice(0, 5);
    }
    
    let techStack = [];
    if (Array.isArray(proj.techStack)) {
      techStack = proj.techStack.map(t => normalizeTech(capitalizeWords(t.toString()))).slice(0, 8);
    }
    
    let description = '';
    if (bullets.length > 0) {
      description = bullets.join('\n');
    }
    
    return {
      title,
      type,
      startDate,
      endDate,
      description,
      techStack,
      technologies: techStack,
      bullets,
      formatted: dateRange ? `${title} - ${type} | ${dateRange}` : `${title} - ${type}`
    };
  }).filter(proj => proj.title);
};

const formatSkills = (skills) => {
  if (!skills || typeof skills !== 'object') {
    return { frontend: [], backend: [], database: [], tools: [] };
  }
  
  const formatCategory = (arr) => {
    if (!Array.isArray(arr)) return [];
    return [...new Set(arr.map(s => normalizeTech(capitalizeWords(s.toString()))))].slice(0, 8);
  };
  
  return {
    frontend: formatCategory(skills.frontend || []),
    backend: formatCategory(skills.backend || []),
    database: formatCategory(skills.database || []),
    tools: formatCategory(skills.tools || [])
  };
};

const formatCertifications = (certifications) => {
  if (!Array.isArray(certifications)) return [];
  
  return certifications
    .map(cert => {
      if (typeof cert === 'string') {
        return {
          id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: cleanText(capitalizeWords(cert)),
          issuer: '',
          date: ''
        };
      }
      return {
        id: cert.id || `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: cleanText(capitalizeWords(cert.name || '')),
        issuer: cert.issuer || '',
        date: normalizeDate(cert.date || '')
      };
    })
    .filter(cert => cert.name && cert.name.length > 2)
    .slice(0, 8);
};

const formatSummary = (summary, experience, skills) => {
  if (!summary || summary.length < 20) {
    const allSkills = Object.values(skills || {}).flat();
    const expRole = experience[0]?.role || '';
    
    const cleanRole = formatRole(expRole);
    const skillList = (allSkills || []).map(s => normalizeTech(s)).slice(0, 5).join(', ');
    
    if (cleanRole || skillList) {
      let parts = [];
      if (cleanRole) parts.push(cleanRole);
      if (skillList) parts.push(`proficient in ${skillList}`);
      
      let summaryText = toSentenceCase(parts.join('. '));
      
      const sentences = summaryText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length > 2) {
        return sentences.slice(0, 2).join('. ').trim() + '.';
      }
      return summaryText;
    }
    return '';
  }
  
  let cleaned = toSentenceCase(normalizeTech(summary));
  
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let result;
  if (sentences.length > 2) {
    result = sentences.slice(0, 2).join('. ').trim() + '.';
  } else {
    result = cleaned;
  }
  
  if (result.length > 300) {
    const words = result.split(' ');
    let truncated = '';
    for (const word of words) {
      if ((truncated + ' ' + word).trim().length > 250) break;
      truncated = (truncated + ' ' + word).trim();
    }
    result = truncated + '.';
  }
  
  return result;
};

const formatHeader = (header) => {
  const formatField = (val, regex, formatFn) => {
    if (!val) return '';
    const match = val.match(regex);
    return match ? formatFn(match[0]) : '';
  };
  
  const name = header?.name ? cleanText(capitalizeWords(header.name)) : '';
  const email = formatField(header?.email, /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, v => v.toLowerCase());
  const phone = formatField(header?.phone, /(?:(?:\+|0)?91[-.\s]?)?(?:[6-9]\d{9}|(?:\d{2,5}[-.\s]?\d{6,8}))/, v => v.replace(/\s+/g, ' ').trim());
  
  return {
    name,
    email,
    phone,
    linkedin: header?.linkedin || '',
    github: header?.github || '',
    portfolio: header?.portfolio || ''
  };
};

const postProcessResume = (parsedResume) => {
  const header = formatHeader(parsedResume.header || {});
  
  const experience = formatExperience(parsedResume.experience || []);
  const education = formatEducation(parsedResume.education || []);
  const projects = formatProjects(parsedResume.projects || []);
  const skills = formatSkills(parsedResume.skills || {});
  const certifications = formatCertifications(parsedResume.certifications || []);
  const summary = formatSummary(parsedResume.summary || '', experience, skills);
  
  return {
    basicInfo: {
      fullName: header.name,
      email: header.email,
      phone: header.phone,
      linkedin: header.linkedin,
      github: header.github,
      portfolio: header.portfolio
    },
    summary,
    experience,
    internships: [],
    education,
    skills,
    projects,
    certifications,
    achievements: []
  };
};

const validateFormattedResume = (resume) => {
  const issues = [];
  const warnings = [];
  
  if (!resume.basicInfo?.fullName) warnings.push('Missing name');
  if (!resume.basicInfo?.email) warnings.push('Missing email');
  
  if (!resume.experience || resume.experience.length === 0) {
    warnings.push('No experience found');
  } else {
    for (const exp of resume.experience) {
      if (!exp.role) issues.push('Experience missing role');
      if (!exp.company) issues.push('Experience missing company');
      if (!exp.startDate || !exp.endDate) warnings.push(`Experience "${exp.role}" missing dates`);
      if (!exp.bullets || exp.bullets.length === 0) warnings.push(`Experience "${exp.role}" has no bullet points`);
    }
  }
  
  if (!resume.education || resume.education.length === 0) {
    warnings.push('No education found');
  } else {
    for (const edu of resume.education) {
      if (!edu.degree) issues.push('Education missing degree');
      if (!edu.college) warnings.push('Education missing college');
    }
  }
  
  if (!resume.projects || resume.projects.length === 0) {
    warnings.push('No projects found');
  }
  
  const totalSkills = Object.values(resume.skills || {}).flat().length;
  if (totalSkills === 0) warnings.push('No skills found');
  
  return {
    isValid: issues.length === 0,
    hasWarnings: warnings.length > 0,
    issues,
    warnings
  };
};

module.exports = {
  postProcessResume,
  validateFormattedResume,
  formatDateRange,
  normalizeDate
};