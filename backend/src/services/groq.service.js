const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'llama3-8b-8192';

const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/<script|javascript:|on\w+=/gi, '')
    .substring(0, 5000);
};

const sanitizeArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(sanitizeInput).filter(Boolean).slice(0, 50);
};

const callGroq = async (systemPrompt, userPrompt, maxTokens = 400) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.2,
  });
  const content = response.choices[0]?.message?.content || '';
  const tokensUsed = response.usage?.total_tokens || 0;
  return { content: content.trim(), tokensUsed };
};

// Summary
const enhanceSummary = async ({ currentSummary, jobTitle, skills, experience }) => {
  const system = `You are a professional resume editor.
Rewrite summaries to be clear, concise, and ATS-safe WITHOUT adding new facts.
Rules:
- Use ONLY the information provided by the user (do not invent skills, tools, metrics, or achievements)
- Fix grammar, tighten wording, and keep the same meaning
- Keep it 2-4 sentences max
- Use active voice
- No first-person pronouns (avoid "I", "me", "my")
- Return ONLY the improved summary, no explanations`;

  const user = `Job Title: ${sanitizeInput(jobTitle) || 'Not provided'}
Current Summary: ${sanitizeInput(currentSummary) || '(empty)'}
Skills: ${sanitizeArray(skills).join(', ') || 'not provided'}
Experience: ${sanitizeInput(experience) || 'not provided'}

Rewrite this summary using ONLY the provided information.`;

  return callGroq(system, user, 280);
};

// Experience
const enhanceExperience = async ({ role, company, description, industry }) => {
  const system = `You are a resume editor.
Improve job descriptions WITHOUT adding new information.
Rules:
- Use ONLY the information provided by the user
- Do NOT invent metrics, tools, results, or responsibilities
- Fix grammar, make bullets concise, and highlight key points that already exist
- Keep 2-4 bullet points maximum
- Return ONLY the bullet points, one per line starting with "•"`;

  const user = `Role: ${sanitizeInput(role) || 'Not provided'}
Company: ${sanitizeInput(company) || 'Not provided'}
Industry: ${sanitizeInput(industry) || 'Not provided'}
Current description: ${sanitizeInput(description) || '(empty)'}

Rewrite as concise bullets using ONLY the provided information.`;

  return callGroq(system, user, 300);
};

// Project
const enhanceProject = async ({ title, description, techStack }) => {
  const system = `You are a resume editor.
Improve project descriptions WITHOUT adding new information.
Rules:
- Use ONLY the information provided by the user
- Do NOT invent metrics, tools, results, or features
- Fix grammar and tighten wording
- 2-4 bullet points
- Return ONLY bullet points starting with "•"`;

  const user = `Project: ${sanitizeInput(title) || 'Not provided'}
Tech Stack: ${sanitizeArray(techStack).join(', ') || 'not specified'}
Description: ${sanitizeInput(description) || '(empty)'}

Rewrite as concise bullets using ONLY the provided information.`;

  return callGroq(system, user, 260);
};

// Internship
const enhanceInternship = async ({ role, company, description }) => {
  const system = `You are a resume editor for fresher/intern resumes.
Improve internship descriptions WITHOUT adding new information.
Rules:
- Use ONLY the information provided by the user
- Do NOT invent metrics, tools, results, or responsibilities
- Fix grammar and tighten wording
- 2-4 bullet points
- Return ONLY bullet points starting with "•"`;

  const user = `Internship Role: ${sanitizeInput(role) || 'Not provided'}
Company: ${sanitizeInput(company) || 'Not provided'}
Description: ${sanitizeInput(description) || '(empty)'}

Rewrite as concise bullets using ONLY the provided information.`;

  return callGroq(system, user, 220);
};

// Achievement
const enhanceAchievement = async ({ achievement }) => {
  const system = `You are a resume editor.
Rewrite achievements clearly WITHOUT adding new information.
Rules:
- Use ONLY the information provided by the user
- Do NOT invent metrics or facts
- Fix grammar and tighten wording
- One sentence only
- Return ONLY the improved achievement text`;

  const user = `Achievement: ${sanitizeInput(achievement) || '(empty)'}
Rewrite using ONLY the provided information.`;

  return callGroq(system, user, 120);
};

// Skills Suggestion
const suggestSkills = async ({ jobTitle, currentSkills, experience }) => {
  const system = `You are a tech industry expert. Suggest relevant, trending skills for a resume.
Return ONLY a JSON object with this structure:
{"frontend": [], "backend": [], "database": [], "tools": [], "soft": []}
Maximum 5 skills per category. Only suggest skills relevant to the job title.`;

  const user = `Job Title: ${sanitizeInput(jobTitle) || 'Software Developer'}
Current Skills: ${sanitizeArray(currentSkills).join(', ') || 'none'}
Experience Level: ${sanitizeInput(experience) || 'fresher'}

Suggest trending, ATS-relevant skills grouped by category.`;

  const result = await callGroq(system, user, 260);
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result.parsed = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    logger.warn('Failed to parse skills JSON:', err.message);
    result.parsed = null;
  }
  return result;
};

// Grammar Fix
const fixGrammar = async ({ text }) => {
  const system = `You are a professional editor. Fix grammar and clarity only.
Rules:
- Use ONLY the user's words; do not add new facts or ideas
- Keep the original meaning
- Return ONLY the corrected text`;

  const user = `Fix the grammar and improve clarity of this text: "${sanitizeInput(text)}"`;
  return callGroq(system, user, 220);
};

// AI-Based ATS Scoring
const scoreResumeAI = async (resumeData, jobDescription = null) => {
  const system = `You are an ATS expert. Evaluate this resume professionally.

Return ONLY valid JSON:
{
  "score": <0-100>,
  "grade": "Excellent|Good|Fair|Needs Work|Poor",
  "breakdown": {
    "contact": {"score": <0-10>, "max": 10, "feedback": "<text>"},
    "summary": {"score": <0-15>, "max": 15, "feedback": "<text>"},
    "experience": {"score": <0-25>, "max": 25, "feedback": "<text>"},
    "education": {"score": <0-10>, "max": 10, "feedback": "<text>"},
    "skills": {"score": <0-20>, "max": 20, "feedback": "<text>"},
    "projects": {"score": <0-10>, "max": 10, "feedback": "<text>"},
    "extras": {"score": <0-10>, "max": 10, "feedback": "<text>"}
  },
  "keywords": {"matched": ["<kw>"], "matchPercentage": <0-100>, "missing": ["<kw>"]},
  "readability": {"score": <0-100>, "grade": "Easy|Standard|Difficult"},
  "grammar": {"score": <0-100>, "issues": <number>},
  "suggestions": [{"type": "error|warning|info", "section": "<section>", "text": "<text>"}],
  "strengths": ["<text>"],
  "weaknesses": ["<text>"]
}

Scoring rules:
- Give high scores for: quantified achievements (% improvements, hours saved), relevant tech skills, action verbs, certifications
- For missing projects: if experience has project-like descriptions, give partial credit
- For 1-year experience: experience counts more than projects
- Be fair - credit what exists`;

  const user = `RESUME: ${JSON.stringify(resumeData, null, 2)}`;

  const result = await callGroq(system, user, 600);
  
  try {
    // Extract JSON from response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result.parsed = parsed;
      result.tokensUsed = result.tokensUsed;
    } else {
      logger.warn('No JSON found in AI ATS response');
      result.parsed = null;
    }
  } catch (err) {
    logger.error('Failed to parse AI ATS response:', err.message);
    result.parsed = null;
  }
  
  return result;
};

module.exports = {
  enhanceSummary,
  enhanceExperience,
  enhanceProject,
  enhanceInternship,
  enhanceAchievement,
  suggestSkills,
  fixGrammar,
  scoreResumeAI,
};
