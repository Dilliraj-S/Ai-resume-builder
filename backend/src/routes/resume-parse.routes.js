const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const { body, validationResult } = require('express-validator');
const { scoreResume } = require('../services/ats.service');
const groqService = require('../services/groq.service');
const logger = require('../utils/logger');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .substring(0, 10000);
};

const sanitizeResumeData = (data) => {
  if (!data || typeof data !== 'object') return {};
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeResumeData(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeResumeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
};

const extractContactInfo = (text) => {
  const info = { fullName: '', email: '', phone: '', linkedin: '', github: '', portfolio: '' };
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const firstLines = lines.slice(0, 20).join('\n');
  
  // Extract email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = firstLines.match(emailRegex);
  if (emailMatch) info.email = emailMatch[0];
  
  // Extract phone - better pattern
  const phoneRegex = /(?:(?:\+|0)?91[-.\s]?)?(?:[6-9]\d{9}|(?:\d{2,5}[-.\s]?\d{6,8}))/;
  const phoneMatch = firstLines.match(phoneRegex);
  if (phoneMatch) {
    info.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
  }
  
  // Extract LinkedIn
  const linkedinMatch = firstLines.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) {
    info.linkedin = 'https://' + linkedinMatch[0];
  }
  
  // Extract GitHub
  const githubMatch = firstLines.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  if (githubMatch) {
    info.github = 'https://' + githubMatch[0];
  }
  
  // Extract name - look for ALL CAPS names or name patterns
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip if line contains email or phone
    if (line.includes('@') || line.match(/\d{10,}/)) continue;
    if (line.length < 3 || line.length > 50) continue;
    
    // Pattern 1: ALL CAPS name (like "YALLAPPA DIVAKAR")
    const allCapsMatch = line.match(/^([A-Z]{2,})\s+([A-Z]{2,})(?:\s+([A-Z]{2,}))?$/);
    if (allCapsMatch) {
      info.fullName = allCapsMatch.slice(1).filter(Boolean).join(' ');
      break;
    }
    
    // Pattern 2: Title Case name (like "John Doe")
    const titleMatch = line.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?$/);
    if (titleMatch && titleMatch[1].length > 1) {
      info.fullName = titleMatch.slice(1).filter(Boolean).join(' ');
      break;
    }
    
    // Pattern 3: Name with single letter (like "Y DIVAKAR")
    const singleMatch = line.match(/^([A-Z])\s+([A-Z][a-z]+)$/);
    if (singleMatch && !line.includes('@')) {
      info.fullName = `${singleMatch[1]}. ${singleMatch[2]}`;
      break;
    }
  }
  
  return info;
};

const extractSummary = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Look for summary section
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('summary') || lower.includes('objective') || lower.includes('profile')) {
      const summaryLines = [];
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].length > 20 && !lines[j].match(/^[A-Z\s]+$/)) {
          summaryLines.push(lines[j]);
        }
      }
      if (summaryLines.length > 0) {
        return summaryLines.join(' ').substring(0, 500);
      }
    }
  }
  
  return '';
};

const extractSkills = (text) => {
  const skills = { frontend: [], backend: [], database: [], tools: [], programming: [], other: [] };
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const skillKeywords = {
    frontend: ['html', 'css', 'javascript', 'react', 'reactjs', 'angular', 'vue', 'jquery', 'bootstrap', 'tailwind', 'typescript', 'nextjs', 'nuxt', 'sass', 'less', 'webpack', 'redux', 'context'],
    backend: ['nodejs', 'node', 'express', 'python', 'django', 'flask', 'java', 'spring', 'c#', 'dotnet', 'php', 'laravel', 'ruby', 'rails', 'go', 'golang', 'restapi', 'restful', 'graphql', 'api'],
    database: ['mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'firebase', 'sql', 'nosql', 'dynamodb', 'cassandra'],
    tools: ['git', 'github', 'gitlab', 'docker', 'kubernetes', 'jenkins', 'aws', 'azure', 'gcp', 'postman', 'jira', 'figma', 'adobe', 'vscode', 'eclipse', 'intellij'],
    programming: ['java', 'python', 'javascript', 'typescript', 'c++', 'c', 'golang', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'rust']
  };
  
  // Find skills section
  let foundSkills = false;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('skill') || lower.includes('technologies')) {
      foundSkills = true;
      
      // Get the next 5-10 lines that contain skills
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const line = lines[j];
        if (line.length < 3 || line.match(/^[A-Z\s]+$/) || line.match(/^[0-9\s-]+$/)) continue;
        
        const lowerLine = line.toLowerCase();
        
        // Categorize each skill
        for (const [category, keywords] of Object.entries(skillKeywords)) {
          for (const skill of keywords) {
            if (lowerLine.includes(skill)) {
              const skillName = findSkillName(line, skill);
              if (skillName && !skills[category].includes(skillName)) {
                skills[category].push(skillName);
              }
            }
          }
        }
        
        // Also check for programming languages in other contexts
        if (line.toLowerCase().includes('programming') || line.toLowerCase().includes('languages')) {
          for (const skill of skillKeywords.programming) {
            const skillName = findSkillName(line, skill);
            if (skillName && !skills.programming.includes(skillName)) {
              skills.programming.push(skillName);
            }
          }
        }
      }
      break;
    }
  }
  
  // If no skills section found, try to extract from anywhere in text
  if (!foundSkills || Object.values(skills).flat().length === 0) {
    const fullText = lines.join(' ').toLowerCase();
    for (const [category, keywords] of Object.entries(skillKeywords)) {
      for (const skill of keywords) {
        if (fullText.includes(skill)) {
          const skillName = skill.charAt(0).toUpperCase() + skill.slice(1);
          if (!skills[category].includes(skillName)) {
            skills[category].push(skillName);
          }
        }
      }
    }
  }
  
  return skills;
};

const findSkillName = (line, keyword) => {
  const lowerLine = line.toLowerCase();
  const idx = lowerLine.indexOf(keyword);
  if (idx === -1) return null;
  
  // Get the word containing the keyword
  const start = Math.max(0, idx - 2);
  const end = Math.min(line.length, idx + keyword.length + 3);
  
  // Extract word
  let word = line.substring(start, end).replace(/[^a-zA-Z0-9#+. ]/g, '').trim();
  
  // Capitalize properly
  word = word.split(/[\s,]/).filter(Boolean).map(w => 
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ');
  
  return word.length > 2 ? word : keyword.charAt(0).toUpperCase() + keyword.slice(1);
};

const extractExperience = (text) => {
  const experience = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const sectionKeywords = ['experience', 'work', 'employment', 'internship', 'intern'];
  const titleKeywords = ['developer', 'engineer', 'manager', 'designer', 'analyst', 'consultant', 'intern', 'trainee', 'lead', 'architect', 'specialist', 'coordinator'];
  
  let inExperienceSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Check if we're in experience section
    if (sectionKeywords.some(kw => line.includes(kw))) {
      inExperienceSection = true;
      continue;
    }
    
    if (!inExperienceSection) continue;
    
    // Stop if we hit another major section
    if (line.includes('education') || line.includes('project') || line.includes('skill') || line.includes('certification')) {
      break;
    }
    
    // Check if this line looks like a job title
    const isTitle = titleKeywords.some(kw => line.includes(kw)) && line.length < 80;
    
    if (isTitle) {
      const jobTitle = lines[i];
      
      // Look for company name in next line or same line
      let company = '';
      let dateRange = '';
      
      if (i + 1 < lines.length && !titleKeywords.some(kw => lines[i + 1].toLowerCase().includes(kw))) {
        company = lines[i + 1].replace(/[0-9-]/g, '').trim();
        if (company.length > 50) company = '';
      }
      
      // Extract date from any nearby lines
      const datePattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,-]*(?:20|19)\d{2}|20\d{2}\s*[-–]\s*(?:present|current|20\d{2})/gi;
      
      for (let k = i; k < Math.min(i + 5, lines.length); k++) {
        const dateMatch = lines[k].match(datePattern);
        if (dateMatch) {
          dateRange = dateMatch[0];
          break;
        }
      }
      
      // Get description (bullet points)
      const description = [];
      for (let k = i + 1; k < Math.min(i + 10, lines.length); k++) {
        if (lines[k].startsWith('•') || lines[k].startsWith('-') || lines[k].startsWith('*')) {
          description.push(lines[k].replace(/^[•\-\*]\s*/, '').trim());
        } else if (description.length > 0 && lines[k].length > 20 && !lines[k].match(datePattern)) {
          description.push(lines[k].trim());
        }
      }
      
      if (jobTitle && (company || description.length > 0)) {
        experience.push({
          id: `exp_${Date.now()}_${i}`,
          jobTitle: jobTitle.substring(0, 100),
          company: company.substring(0, 80),
          startDate: extractYear(dateRange, 'start'),
          endDate: extractYear(dateRange, 'end') || (dateRange.toLowerCase().includes('present') ? 'Present' : ''),
          currentlyWorking: dateRange.toLowerCase().includes('present'),
          description: description.join('\n').substring(0, 1000)
        });
      }
    }
  }
  
  return experience;
};

const extractYear = (dateStr, which) => {
  if (!dateStr) return '';
  const years = dateStr.match(/(20\d{2}|19\d{2})/g);
  if (!years) return '';
  if (which === 'start') return years[0] || '';
  return years[1] || years[0] || '';
};

const extractInternships = (text) => {
  const internships = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('intern') || lower.includes('training')) {
      const companyMatch = lines[i].match(/at\s+([A-Za-z\s]+)|([A-Za-z\s]+)\s+(?:Pvt|Ltd|Inc)/i);
      const company = companyMatch ? (companyMatch[1] || companyMatch[2] || '').trim() : '';
      
      if (company || lines[i].length > 10) {
        internships.push({
          id: `intern_${Date.now()}_${i}`,
          role: lines[i].replace(/intern|training|at/gi, '').trim().substring(0, 80),
          company: company.substring(0, 60),
          startDate: '',
          endDate: '',
          description: ''
        });
      }
    }
  }
  
  return internships;
};

const extractEducation = (text) => {
  const education = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const degreeKeywords = ['bachelor', 'master', 'btech', 'be', 'mtech', 'me', 'mca', 'bca', 'bsc', 'msc', 'phd', 'bba', 'mba', 'diploma'];
  
  let inEducationSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (line.includes('education') || line.includes('academic')) {
      inEducationSection = true;
      continue;
    }
    
    if (!inEducationSection) continue;
    
    // Stop at next major section
    if (line.includes('experience') || line.includes('project') || line.includes('skill')) {
      break;
    }
    
    // Check if line contains degree keywords
    const hasDegree = degreeKeywords.some(kw => line.includes(kw));
    const hasYear = line.match(/(20\d{2}|19\d{2})/);
    
    if (hasDegree && line.length > 10 && line.length < 100) {
      // Extract CGPA/Percentage
      const cgpaMatch = line.match(/(?:cgpa|gpa|percentage|score|grade)[\s:]*(\d+\.?\d*)/i);
      const cgpa = cgpaMatch ? cgpaMatch[1] : '';
      
      // Extract year
      const years = line.match(/(20\d{2}|19\d{2})/g);
      
      // Clean degree name
      const degree = line.replace(/\d{4}.*/g, '').replace(/[|]/g, '').trim().substring(0, 80);
      
      if (degree.length > 5) {
        education.push({
          id: `edu_${Date.now()}_${i}`,
          degree: degree,
          institution: '',
          startDate: years ? years[0] : '',
          endDate: years && years[1] ? years[1] : '',
          cgpa: cgpa,
          location: ''
        });
      }
    }
  }
  
  // Try to find institution names for each education entry
  for (let i = 0; i < education.length; i++) {
    const eduLineIndex = lines.findIndex(l => l.toLowerCase().includes(education[i].degree.toLowerCase().split(' ')[0]));
    if (eduLineIndex >= 0 && eduLineIndex + 1 < lines.length) {
      const nextLine = lines[eduLineIndex + 1];
      if (!nextLine.match(/\d{4}/) && nextLine.length > 3 && nextLine.length < 60) {
        education[i].institution = nextLine.replace(/\d{4}.*/g, '').trim();
      }
    }
  }
  
  return education.slice(0, 4);
};

const extractProjects = (text) => {
  const projects = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const titleKeywords = ['project', 'application', 'system', 'website', 'app', 'portal'];
  
  let inProjectSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (titleKeywords.some(kw => line.includes(kw))) {
      inProjectSection = true;
      
      // This might be a project title
      const title = lines[i].replace(/project|application|system|website|app|portal/gi, '').trim();
      
      if (title.length > 2 && title.length < 60) {
        // Get description from next few lines
        const description = [];
        for (let k = i + 1; k < Math.min(i + 8, lines.length); k++) {
          if (lines[k].startsWith('•') || lines[k].startsWith('-') || lines[k].startsWith('*')) {
            description.push(lines[k].replace(/^[•\-\*]\s*/, '').trim());
          } else if (description.length > 0 && lines[k].length > 10) {
            description.push(lines[k].trim());
          }
        }
        
        // Extract tech stack
        const techStack = [];
        const techKeywords = ['react', 'node', 'python', 'java', 'mysql', 'mongodb', 'aws', 'api', 'html', 'css', 'javascript', 'express', 'postgresql'];
        const fullText = (title + ' ' + description.join(' ')).toLowerCase();
        
        for (const tech of techKeywords) {
          if (fullText.includes(tech)) {
            techStack.push(tech.charAt(0).toUpperCase() + tech.slice(1));
          }
        }
        
        projects.push({
          id: `proj_${Date.now()}_${i}`,
          title: title.substring(0, 60),
          description: description.join('\n').substring(0, 800),
          techStack: techStack,
          link: ''
        });
      }
    }
  }
  
  return projects.slice(0, 5);
};

const extractCertifications = (text) => {
  const certifications = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('certif') || lower.includes('certificate') || lower.includes('certified')) {
      const cert = lines[i].replace(/certif|certificate|certified/gi, '').trim();
      if (cert.length > 5 && cert.length < 100) {
        certifications.push({
          id: `cert_${Date.now()}_${i}`,
          name: cert.substring(0, 80),
          issuer: '',
          date: ''
        });
      }
    }
  }
  
  return certifications.slice(0, 8);
};

router.post('/parse', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const data = await pdf(req.file.buffer);
    const text = cleanText(data.text);

    const parsedResume = {
      basicInfo: extractContactInfo(text),
      summary: extractSummary(text),
      experience: extractExperience(text),
      internships: extractInternships(text),
      education: extractEducation(text),
      skills: extractSkills(text),
      projects: extractProjects(text),
      certifications: extractCertifications(text),
      achievements: [],
    };

    logger.info('Parsed resume:', { 
      name: parsedResume.basicInfo?.fullName,
      email: parsedResume.basicInfo?.email,
      phone: parsedResume.basicInfo?.phone,
      expCount: parsedResume.experience?.length || 0,
      eduCount: parsedResume.education?.length || 0,
      skillsCount: Object.values(parsedResume.skills || {}).flat().length || 0,
      projectsCount: parsedResume.projects?.length || 0,
      certsCount: parsedResume.certifications?.length || 0
    });

    res.json({
      success: true,
      data: { parsedResume, rawText: text.substring(0, 1500) }
    });

  } catch (error) {
    logger.error('PDF parse error:', error);
    res.status(500).json({ success: false, error: 'Failed to parse PDF' });
  }
});

router.post('/analyze', optionalAuth, [
  body('resumeData').isObject().withMessage('Resume data must be an object'),
  body('jobDescription').optional().isString().trim().isLength({ max: 10000 }),
  validate
], async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    const isLoggedIn = !!req.user;
    
    const sanitizedResumeData = sanitizeResumeData(resumeData);
    const sanitizedJobDesc = sanitizeInput(jobDescription);
    
    logger.info('ATS Analyze: Starting analysis', { 
      hasGroqKey: !!process.env.GROQ_API_KEY,
      hasJobDesc: !!sanitizedJobDesc,
      isLoggedIn,
      userId: req.user?.id 
    });
    
    let atsResult;
    
    // Only run real AI analysis when logged in (to save Groq credits)
    if (isLoggedIn && process.env.GROQ_API_KEY) {
      logger.info('ATS Analyze: User logged in - running real AI analysis');
      try {
        logger.info('ATS Analyze: Calling Groq AI...');
        const aiResult = await groqService.scoreResumeAI(sanitizedResumeData, sanitizedJobDesc);
        
        if (aiResult.parsed && aiResult.parsed.score) {
          atsResult = {
            ...aiResult.parsed,
            isAI: true,
            timestamp: new Date().toISOString(),
          };
          logger.info('AI ATS scoring successful:', { score: atsResult.score });
        } else {
          logger.warn('AI ATS returned no parsed result, using fallback');
          atsResult = await scoreResume(resumeData, { jobDescription });
        }
      } catch (aiError) {
        logger.error('AI ATS failed, falling back to rule-based:', aiError.message);
        atsResult = await scoreResume(resumeData, { jobDescription });
      }
    } else {
      // Not logged in - show locked result without wasting AI credits
      logger.info('User not logged in - showing locked result (no AI used)');
      atsResult = await scoreResume(resumeData, { jobDescription });
      
      // Manipulate score to show locked result
      if (atsResult) {
        atsResult = {
          ...atsResult,
          score: Math.floor(atsResult.score * 0.7 + Math.random() * 15),
          isLoggedIn: false,
          loginRequired: true,
        };
      }
    }
    
    if (!atsResult) {
      atsResult = { score: 0, grade: 'N/A', suggestions: [] };
    }
    
    if (isLoggedIn && atsResult) {
      atsResult.isLoggedIn = true;
    }
    
    res.json({
      success: true,
      data: atsResult
    });
  } catch (error) {
    logger.error('ATS analyze error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze resume' });
  }
});

module.exports = router;