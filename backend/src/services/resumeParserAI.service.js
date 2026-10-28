// PATH: backend/src/services/resumeParserAI.service.js

const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const Groq = require("groq-sdk");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Skip AI only if DEV_USE_AI=false explicitly set in .env
const DEV_MODE = process.env.DEV_USE_AI === 'false';

logger.info('AI Parser: Config', {
  hasGroqKey: !!process.env.GROQ_API_KEY,
  DEV_MODE,
  nodeEnv: process.env.NODE_ENV,
});

// ─── Step 1: Extract raw text ─────────────────────────────────────────────────

const extractTextFromFile = async (file) => {
  const { mimetype, buffer } = file;

  if (mimetype === "application/pdf") {
    const data = await pdf(buffer);
    return data.text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mimetype === "text/plain") {
    return buffer.toString("utf-8").trim();
  }

  throw new Error("Unsupported file format. Please upload PDF, DOCX, or TXT.");
};

// ─── Step 2: AI parsing ───────────────────────────────────────────────────────

const parseWithAI = async (rawText) => {
  // Development mode: skip AI to save API calls
  if (DEV_MODE) {
    logger.warn('AI Parser: DEV_MODE - using simple fallback');
    return simpleParseResume(rawText);
  }
  
  const textToSend = rawText.substring(0, 14000);

  const userMessage = `Extract ALL data from this resume. Return ONLY a valid JSON object — no markdown, no explanation, no code fences. Start with { and end with }.

JSON SCHEMA (return exactly this structure):
{
  "name": "Full name exactly as written",
  "title": "Current job title if mentioned, else empty string",
  "summary": "The COMPLETE professional summary/objective paragraph copied verbatim — every word",
  "contact": {
    "email": "email address",
    "phone": "phone number",
    "linkedin": "LinkedIn URL or username or empty string",
    "github": "GitHub URL or username or empty string",
    "location": "City, State/Country or empty string"
  },
  "experience": [
    {
      "role": "Exact job title as written",
      "company": "Exact company name as written",
      "startDate": "e.g. 05/2024 or May 2024 or Aug 2025",
      "endDate": "Present or 04/2024 or Apr 2024",
      "bullets": [
        "First bullet point copied verbatim without the bullet character (•, -, *, ·)",
        "Second bullet — every single one, do not skip or merge any"
      ]
    }
  ],
  "education": [
    {
      "institution": "The NAME of the college/university/school e.g. Kuppam Engineering College or Govt.Jr.College Gudupalli or IIT Delhi — ONLY the institution name, nothing else",
      "degree": "The qualification ONLY e.g. B.Tech Computer Science Engineering or BTECH(CSE) or Intermediate(Mathematics, Physics, Chemistry) or Bachelor of Technology (CSE) — ONLY the degree, no institution name",
      "cgpa": "GPA or percentage value as a plain number string e.g. 7.63 or 8.5 — only if present, else empty string",
      "startDate": "start year or MM/YYYY e.g. 2020 or 06/2020 or 12/2020",
      "endDate": "end year or MM/YYYY e.g. 2024 or 05/2024"
    }
  ],
  "projects": [
    {
      "title": "Project name exactly as written",
      "type": "Mobile if mobile app, else Web",
      "startDate": "start date or empty string",
      "endDate": "end date or Present or empty string",
      "technologies": ["tech1", "tech2"],
      "bullets": ["what it does", "your contribution"]
    }
  ],
  "skills": {
    "frontend": ["HTML, CSS, JS, React, Angular, Vue, Bootstrap, Tailwind, TypeScript, React Native — UI/browser skills"],
    "backend": ["Python, Django, Flask, Node.js, Express, Java, Spring, PHP, Laravel, REST API, OOP, JSON, Servlets, JDBC — server-side"],
    "database": ["MySQL, MongoDB, PostgreSQL, SQL, SQLite, Firebase, Redis, Oracle — database technologies"],
    "tools": ["Git, GitHub, Docker, Kubernetes, AWS, Linux, Postman, Jenkins, CI/CD, VS Code, Eclipse, Figma — DevOps/tools"]
  },
  "certifications": [
    {
      "name": "The certification title only e.g. Certified Microsoft Virtual Internship or Java Full Stack Developer",
      "issuer": "The organization that issued it e.g. Future Skills Prime or NASSCOM or NPTEL or Java Learning Center — if mentioned",
      "description": "Any description after a dash or colon e.g. Completed practical internship program on Microsoft technologies — if present, else empty string"
    }
  ]
}

RULES — follow ALL of these:

EXPERIENCE (includes internships and trainee roles — put ALL work history here):
- Include jobs labeled under EXPERIENCE, WORK EXPERIENCE, INTERNSHIP, INTERNSHIPS, TRAINING sections — all go in experience[]
- Copy EVERY bullet point verbatim — do not skip, do not merge
- Remove only the leading bullet character

EDUCATION — the most critical section:
- "institution" = only the NAME of the college/school: "Kuppam Engineering College", "Govt.Jr.College Gudupalli", "IIT Delhi"
- "degree" = only the QUALIFICATION: "BTECH(CSE)", "Bachelor of Technology (CSE)", "Intermediate(Mathematics, Physics, Chemistry)"
- These are ALWAYS separate things. Never mix them.
- PATTERN 1 — College name on its own line, degree on next line:
    "Kuppam Engineering College" → institution
    "Bachelor of Technology (CSE) - 7.63   June 2020 - May 2024" → degree="Bachelor of Technology (CSE)", cgpa="7.63", startDate="June 2020", endDate="May 2024"
- PATTERN 2 — Everything on one line separated by comma:
    "Kuppam Engineering College, Kuppam, Andhra Pradesh, BTECH(CSE)   12/2020 to 05/2024"
    → institution="Kuppam Engineering College, Kuppam, Andhra Pradesh", degree="BTECH(CSE)", startDate="12/2020", endDate="05/2024"
- Always extract both startDate and endDate from the education entry
- cgpa: extract only the number (7.63 or 8.5), not "CGPA:" or "GPA:" prefix

CERTIFICATIONS:
- Split into name, issuer, and description
- "name" = the certification title (what they are certified in)
- "issuer" = who gave it (Future Skills Prime, NASSCOM, NPTEL, APSCHE, Java Learning Center)
- "description" = any explanatory text after "–" or ":" if present
- Example: "Future Skills Prime Certified Microsoft Virtual Internship – Completed practical internship program on Microsoft technologies."
    → name="Certified Microsoft Virtual Internship", issuer="Future Skills Prime", description="Completed practical internship program on Microsoft technologies"
- Example: "Certified in Java Full Stack Developer in Java Learning Center."
    → name="Java Full Stack Developer", issuer="Java Learning Center", description=""
- Example: "Certified in Digital Forensics provided by NASSCOM"
    → name="Digital Forensics", issuer="NASSCOM", description=""

SKILLS:
- Extract ALL skills mentioned anywhere in the resume
- Full proper names: JavaScript not "Javascr", MongoDB not "Mongodb", GitHub Actions not "Github Ac"
- Do not add skills not in the resume

GENERAL:
- Empty fields: "" for strings, [] for arrays
- Never truncate any text

RESUME TEXT:
${textToSend}`;

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      logger.info(`AI Parser: Attempt ${attempt}`);

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a resume parsing API. Output ONLY valid JSON. Never truncate. Copy text exactly. Keep institution names and degree names strictly separate in education entries.",
          },
          { role: "user", content: userMessage },
        ],
        temperature: 0.0,
        max_tokens: 4096,
      });

      let content = response.choices[0].message.content.trim();
      content = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const jsonStart = content.indexOf("{");
      const jsonEnd = content.lastIndexOf("}") + 1;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        content = content.substring(jsonStart, jsonEnd);
      } else {
        throw new Error("No JSON object in response");
      }

      const parsed = JSON.parse(content);
      logger.info(`AI Parser: Success attempt ${attempt}`, {
        name: parsed.name,
        exp: parsed.experience?.length || 0,
        edu: parsed.education?.length || 0,
        proj: parsed.projects?.length || 0,
        skills: Object.values(parsed.skills || {}).flat().length,
        certs: parsed.certifications?.length || 0,
      });
      return parsed;
    } catch (err) {
      lastError = err;
      logger.warn(`AI Parser: Attempt ${attempt} failed — ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw new Error(`AI parsing failed after 3 attempts: ${lastError.message}`);
};

// ─── Step 3: Map to app schema ────────────────────────────────────────────────

const mapToAppSchema = (parsed) => {
  // All work history (jobs + internships) goes into experience[]
  const experience = (parsed.experience || []).map((exp) => ({
    id: uuidv4(),
    jobTitle: exp.role || "",
    company: exp.company || "",
    startDate: exp.startDate || "",
    endDate: exp.endDate || "",
    currentlyWorking: (exp.endDate || "").toLowerCase() === "present",
    industry: "",
    description: (exp.bullets || []).join("\n"),
  }));

  // Education — store uses "institution" and "startDate"/"endDate"
  // ResumePreview.js ALSO uses these exact field names after our fix
  const education = (parsed.education || []).map((edu) => ({
    id: uuidv4(),
    institution: edu.institution || "", // maps to edu.institution in ResumePreview
    degree: edu.degree || "",
    startDate: edu.startDate || "", // maps to edu.startDate in ResumePreview
    endDate: edu.endDate || "", // maps to edu.endDate in ResumePreview
    cgpa: edu.cgpa || "",
    location: "",
  }));

  const projects = (parsed.projects || []).map((proj) => ({
    id: uuidv4(),
    title: proj.title || "",
    type: proj.type || "Web",
    startDate: proj.startDate || "",
    endDate: proj.endDate || "",
    description: (proj.bullets || []).join("\n"),
    techStack: proj.technologies || [],
    link: "",
  }));

  // Certifications — store uses "issuer" and "date"
  // ResumePreview.js ALSO uses these exact field names after our fix
  const certifications = (parsed.certifications || []).map((cert) => {
    if (typeof cert === "string") {
      return {
        id: uuidv4(),
        name: cert,
        issuer: "",
        date: "",
        description: "",
      };
    }
    return {
      id: uuidv4(),
      name: cert.name || "",
      issuer: cert.issuer || "",
      date: cert.date || "",
      description: cert.description || "",
    };
  });

  const rawSkills = parsed.skills || {};
  const skills = {
    frontend: rawSkills.frontend || [],
    backend: rawSkills.backend || [],
    database: rawSkills.database || [],
    tools: rawSkills.tools || [],
    business: rawSkills.business || [],
    finance: rawSkills.finance || [],
    marketing: rawSkills.marketing || [],
    softskills: rawSkills.softskills || [],
  };

  const hasExperience = experience.length > 0;

  return {
    basicInfo: {
      fullName: parsed.name || "",
      email: parsed.contact?.email || "",
      phone: parsed.contact?.phone || "",
      linkedin: parsed.contact?.linkedin || "",
      github: parsed.contact?.github || "",
      portfolio: parsed.contact?.portfolio || "",
    },
    summary: parsed.summary || "",
    profileType: hasExperience ? "experienced" : "fresher",
    hasInternship: false, // no separate internship section — all in experience[]
    experience,
    internships: [],
    education,
    projects,
    skills,
    certifications,
    achievements: [],
  };
};

// ─── Simple Fallback Parser (when AI unavailable) ─────────────────────────

const simpleParseResume = (rawText) => {
  const lines = rawText.split('\n').filter(l => l.trim());
  
  const extractSection = (keyword) => {
    const regex = new RegExp(keyword, 'i');
    const idx = lines.findIndex(l => regex.test(l));
    if (idx === -1) return [];
    
    const items = [];
    for (let i = idx + 1; i < lines.length && i < idx + 10; i++) {
      const line = lines[i].trim();
      if (!line || /^(education|experience|skills|projects|certifications|summary|contact)/i.test(line)) break;
      if (line.length > 10) items.push(line);
    }
    return items;
  };
  
  const name = lines[0]?.trim() || 'Unknown';
  const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = rawText.match(/\d{10,}/) || rawText.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
  
  return {
    contact: { email: emailMatch?.[0] || '', phone: phoneMatch?.[0] || '' },
    summary: extractSection('summary')[0] || '',
    experience: extractSection('experience').map((e, i) => ({
      id: uuidv4(),
      jobTitle: `Position ${i + 1}`,
      company: e,
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      industry: '',
      description: e,
    })),
    education: extractSection('education').map((e, i) => ({
      id: uuidv4(),
      institution: e,
      degree: '',
      startDate: '',
      endDate: '',
    })),
    projects: [],
    skills: {Technical: [], Soft: []},
    certifications: [],
  };
};

// ─── Main export ──────────────────────────────────────────────────────────────

const parseResume = async (file) => {
  const rawText = await extractTextFromFile(file);
  logger.info("AI Parser: Text extracted", { chars: rawText.length });

  let aiOutput;
  let useFallback = false;

  try {
    aiOutput = await parseWithAI(rawText);
  } catch (err) {
    // Rate limited or AI unavailable - use simple fallback
    if (err.message.includes('rate_limit') || err.message.includes('429') || !process.env.GROQ_API_KEY) {
      logger.warn('AI Parser: Using simple fallback parser (Groq unavailable)');
      aiOutput = simpleParseResume(rawText);
      useFallback = true;
    } else {
      throw err;
    }
  }

  const resumeData = mapToAppSchema(aiOutput);

  logger.info("AI Parser: Complete", {
    name: resumeData.basicInfo.fullName,
    expCount: resumeData.experience.length,
    eduCount: resumeData.education.length,
    projCount: resumeData.projects.length,
    skillsCount: Object.values(resumeData.skills).flat().length,
    certCount: resumeData.certifications.length,
    fallback: useFallback,
  });

  return {
    parsedResume: resumeData,
    raw: aiOutput,
    validation: { isValid: true, hasWarnings: false, warnings: [], issues: [] },
  };
};

module.exports = { parseResume, extractTextFromFile };
