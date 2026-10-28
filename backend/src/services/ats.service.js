// ═══════════════════════════════════════════════════════════════════
// ATS Scoring Engine - 100% Industry Standard Implementation
// Features: Keyword analysis, readability, formatting, job matching,
//           grammar check, synonym matching, skill gap analysis
// ═══════════════════════════════════════════════════════════════════

// ─── LanguageTool API for Grammar Checking (Free) ──────────────────
const LANGUAGETOOL_API = 'https://api.languagetool.org/v2/check';

// ─── Skill Synonyms Database ────────────────────────────────────────
const SKILL_SYNONYMS = {
  // Programming Languages
  'javascript': ['js', 'ecmascript', 'vanilla js', 'javascript es6', 'javascript es5'],
  'python': ['python3', 'py', 'python programming'],
  'java': ['java se', 'java ee', 'core java', 'j2ee'],
  'typescript': ['ts', 'typescript jsx', 'typescript react'],
  'c++': ['c plus plus', 'cpp', 'c++ programming'],
  'c#': ['c sharp', 'c sharp dotnet', 'csharp'],
  'ruby': ['ruby on rails', 'ror', 'rails'],
  'php': ['php programming', 'php code'],
  'swift': ['swift ios', 'swift language'],
  'kotlin': ['kotlin android', 'kotlin jvm'],
  'golang': ['go language', 'go programming', 'go lang'],
  'rust': ['rust programming', 'rust language'],
  'scala': ['scala programming', 'apache scala'],
  'r': ['r programming', 'r language', 'r stats'],
  'sql': ['mysql sql', 'plsql', 'tsql', 'sql query', 'sql server'],
  
  // Frontend
  'react': ['reactjs', 'react js', 'react.js', 'react native', 'reactjs'],
  'angular': ['angularjs', 'angular 2', 'angular 4', 'angular 5', 'angular 6', 'angular 7', 'angular 8', 'angular 9', 'angular 10', 'angular 11', 'angular 12', 'angular 13', 'angular 14', 'angular 15', 'angular 16'],
  'vue': ['vuejs', 'vue.js', 'vue 2', 'vue 3', 'vuejs'],
  'jquery': ['jq', 'jquery ui', 'jquery mobile'],
  'html': ['html5', 'html css', 'hypertext markup language', 'markup'],
  'css': ['css3', 'cascading style sheets', 'style'],
  'bootstrap': ['bootstrap 4', 'bootstrap 5', 'twitter bootstrap'],
  'tailwind': ['tailwind css', 'tailwindcss'],
  'next.js': ['nextjs', 'next react', 'nextjs 13', 'nextjs 14'],
  'redux': ['redux toolkit', 'reduxjs', 'react redux'],
  
  // Backend
  'node.js': ['nodejs', 'node', 'node js', 'nodejs express', 'nodejs api', 'expressjs', 'express js', 'express'],
  'express': ['expressjs', 'express js', 'express framework'],
  'django': ['django python', 'django framework', 'django rest'],
  'flask': ['flask python', 'microframework flask'],
  'spring': ['spring framework', 'spring boot', 'spring mvc', 'spring core'],
  'rails': ['ruby on rails', 'ror', 'ruby on rails framework'],
  'laravel': ['laravel php', 'laravel framework'],
  'asp.net': ['asp net', 'aspdotnet', 'dotnet', '.net', '.net framework', '.net core'],
  'fastapi': ['fast api', 'fastapi python'],
  'graphql': ['graphql api', 'gql', 'apollo graphql'],
  'rest': ['rest api', 'restful', 'restful api', 'rest api design'],
  'grpc': ['grpc framework', 'google rpc'],
  
  // Database
  'mysql': ['mysql database', 'mysql server', 'mysql workbench', 'mariadb'],
  'postgresql': ['postgres', 'postgresql database', 'psql', 'pg'],
  'mongodb': ['mongo', 'mongodb database', 'mongo db', 'nosql'],
  'redis': ['redis cache', 'redis database', 'redis server'],
  'elasticsearch': ['es', 'elastic search', 'elasticsearch cluster'],
  'oracle': ['oracle database', 'oracle db', 'oracle 12c', 'oracle 19c'],
  'sql server': ['mssql', 'ms sql', 'microsoft sql server'],
  'dynamodb': ['dynamo', 'aws dynamodb', 'dynamo db'],
  'firebase': ['firebase database', 'firebase firestore', 'google firebase'],
  
  // Cloud
  'aws': ['amazon web services', 'amazon cloud', 'aws cloud', 'aws services', 'aws ec2', 'aws s3', 'aws lambda'],
  'azure': ['microsoft azure', 'azure cloud', 'azure services', 'azure devops'],
  'google cloud': ['gcp', 'google cloud platform', 'google cloud services', 'gcp cloud'],
  'heroku': ['heroku cloud', 'heroku platform', 'heroku paas'],
  'docker': ['docker container', 'docker containerization', 'dockerfile', 'docker compose', 'container'],
  'kubernetes': ['k8s', 'kubernet', 'k8s cluster', 'kubernetes container', 'container orchestration'],
  'jenkins': ['jenkins ci', 'jenkins cd', 'jenkins pipeline', 'jenkins automation'],
  'terraform': ['terraform iac', 'terraform infrastructure', 'hashicorp terraform'],
  'git': ['git version control', 'git repo', 'github', 'gitlab', 'gitlab ci', 'bitbucket'],
  
  // Data Science
  'machine learning': ['ml', 'ml algorithms', 'machine learning algorithms', 'ml models', 'ml deep learning', 'ml ai'],
  'deep learning': ['dl', 'deep neural networks', 'dl models', 'deep learning algorithms'],
  'tensorflow': ['tf', 'tensorflow ml', 'tensorflow deep learning', 'tf keras'],
  'pytorch': ['py torch', 'pytorch ml', 'pytorch deep learning', 'torch'],
  'pandas': ['pandas python', 'pandas dataframes', 'pandas library'],
  'numpy': ['numpy python', 'numpy library', 'numpy array'],
  'tableau': ['tableau bi', 'tableau desktop', 'tableau visualization', 'tableau dashboard'],
  'power bi': ['powerbi', 'microsoft power bi', 'power bi dashboard'],
  'statistics': ['statistical', 'statistical analysis', 'stats', 'statistical methods'],
  
  // Finance
  'financial analysis': ['financial reporting', 'financial statements', 'financial evaluation', 'financial review'],
  'financial modeling': ['financial model', 'excel modeling', 'financial projection', 'model building'],
  'valuation': ['company valuation', 'asset valuation', 'valuation analysis', 'dcf valuation'],
  'dcf': ['discounted cash flow', 'dcf analysis', 'dcf model', 'dcf valuation'],
  'excel': ['microsoft excel', 'excel spreadsheet', 'excel workbooks', 'excel vba', 'vba'],
  'budgeting': ['budget', 'budget management', 'budget planning', 'budget creation'],
  'forecasting': ['forecast', 'financial forecast', 'revenue forecast', 'demand forecasting'],
  'gaap': ['generally accepted accounting principles', 'gaap accounting'],
  'ifrs': ['international financial reporting standards', 'ifrs accounting'],
  'cfa': ['chartered financial analyst', 'cfa certification'],
  
  // Marketing
  'seo': ['search engine optimization', 'seo optimization', 'seo marketing', 'seo strategy'],
  'sem': ['search engine marketing', 'sem marketing', 'sem strategy'],
  'ppc': ['pay per click', 'ppc advertising', 'ppc campaign', 'paid search'],
  'google ads': ['google adwords', 'adwords', 'google advertising'],
  'facebook ads': ['facebook advertising', 'meta ads', 'fb ads'],
  'content marketing': ['content strategy', 'content creation', 'content development'],
  'email marketing': ['email campaign', 'email automation', 'newsletter marketing'],
  'social media': ['social media marketing', 'smm', 'social marketing'],
  'google analytics': ['ga', 'google analytics 4', 'ga4', 'google analytics tracking'],
  'analytics': ['data analytics', 'business analytics', 'web analytics', 'analytics insights'],
  
  // Healthcare
  'patient care': ['patient management', 'patient treatment', 'patient monitoring', 'patient support'],
  'emr': ['electronic medical records', 'electronic health records', 'emr system', 'ehr'],
  'ehr': ['electronic health records', 'electronic medical records', 'ehr system', 'emr'],
  'epic': ['epic emr', 'epic ehr', 'epic systems', 'epic software'],
  'cerner': ['cerner emr', 'cerner ehr', 'cerner systems'],
  'nursing': ['nurse', 'registered nurse', 'rn', 'nursing care', 'nursing staff'],
  'icu': ['intensive care', 'critical care', 'icu nursing', 'icu nurse'],
  'hipaa': ['hipaa compliance', 'hipaa regulations', 'patient privacy', 'health privacy'],
  
  // HR
  'recruitment': ['recruiting', 'talent acquisition', 'hiring', 'staffing', 'talent sourcing'],
  'onboarding': ['employee onboarding', 'new hire onboarding', 'onboarding process'],
  'performance management': ['performance review', 'performance appraisal', 'performance evaluation'],
  'employee engagement': ['employee retention', 'engagement', 'employee satisfaction'],
  'workday': ['workday hcm', 'workday hr', 'workday hr system'],
  'bamboohr': ['bamboo hr', 'bamboo hr system', 'bamboo hr software'],
  
  // Project Management
  'project management': ['pm', 'project lead', 'project coordination', 'project oversight'],
  'agile': ['agile methodology', 'agile process', 'agile framework', 'agile development'],
  'scrum': ['scrum methodology', 'scrum framework', 'scrum process', 'scrum master'],
  'jira': ['jira software', 'jira project management', 'jira tracking'],
  'kanban': ['kanban board', 'kanban method', 'kanban workflow'],
  'pmp': ['project management professional', 'pmp certification'],
  
  // Design
  'figma': ['figma design', 'figma ui', 'figma prototyping', 'figma design tool'],
  'photoshop': ['adobe photoshop', 'ps', 'photoshop design', 'photo editing'],
  'illustrator': ['adobe illustrator', 'ai', 'vector graphics', 'ai design'],
  'ui design': ['user interface', 'interface design', 'ui/ux', 'ui designer'],
  'ux design': ['user experience', 'experience design', 'ux/ui', 'ux researcher'],
  'wireframing': ['wireframe', 'wireframe design', 'low fidelity', 'high fidelity'],
  
  // Soft Skills
  'leadership': ['lead', 'leading', 'leader', 'leadership skills', 'team lead'],
  'communication': ['communications', 'communicating', 'communication skills', 'verbal communication'],
  'teamwork': ['team player', 'team work', 'team collaboration', 'collaborating'],
  'problem-solving': ['problem solving', 'problem solving skills', 'analytical', 'analytical thinking'],
  'analytical': ['analytics', 'analytical skills', 'data driven', 'analytical mind'],
  'critical thinking': ['critical thinker', 'critical analysis', 'critical reasoning'],
  'time management': ['time management skills', 'organization', 'organizational skills'],
  'organization': ['organizational', 'organizing', 'organizational skills'],
  'creativity': ['creative', 'creative thinking', 'innovative', 'innovation'],
  'negotiation': ['negotiating', 'negotiation skills', 'deal making'],
  'presentation': ['presentations', 'presentation skills', 'public speaking'],
  'mentoring': ['mentor', 'mentorship', 'coaching', 'coaching skills'],
  
  // Engineering
  'cad': ['computer aided design', 'cad design', 'cad software', 'autocad'],
  'solidworks': ['solid works', 'solidworks cad', 'solidworks 3d'],
  'autocad': ['auto cad', 'autocad 2d', 'autocad 3d'],
  'matlab': ['matlab programming', 'matlab simulation', 'matlab coding'],
  'ansys': ['ansys simulation', 'ansys fea', 'ansys analysis'],
  'fea': ['finite element analysis', 'finite element', 'fea analysis'],
  'plc': ['programmable logic controller', 'plc programming', 'plc scada'],
  'scada': ['scada system', 'scada software', 'scada hmi'],
};

// ─── Common Typos Dictionary ────────────────────────────────────────
const COMMON_TYPOS = {
  'accomodate': 'accommodate',
  'accomodation': 'accommodation',
  'acheive': 'achieve',
  'acheivement': 'achievement',
  'adquire': 'acquire',
  'advisor': 'adviser',
  'agressive': 'aggressive',
  'apparment': 'apartment',
  'apparments': 'apartments',
  'asume': 'assume',
  'atribute': 'attribute',
  'atributes': 'attributes',
  'begining': 'beginning',
  'belive': 'believe',
  'beleive': 'believe',
  'beter': 'better',
  'betting': 'better',
  'carier': 'career',
  'catagory': 'category',
  'committment': 'commitment',
  'committments': 'commitments',
  'compleatly': 'completely',
  'compleat': 'complete',
  'completly': 'completely',
  'concious': 'conscious',
  'conciously': 'consciously',
  'definately': 'definitely',
  'dependance': 'dependence',
  'desparate': 'desperate',
  'determin': 'determine',
  'determinded': 'determined',
  'develeop': 'develop',
  'develeoped': 'developed',
  'develeopment': 'development',
  'develope': 'develop',
  'developement': 'development',
  'diferent': 'different',
  'dificult': 'difficult',
  'discription': 'description',
  'discriptions': 'descriptions',
  'eleminate': 'eliminate',
  'eleminated': 'eliminated',
  'elemination': 'elimination',
  'enviroment': 'environment',
  'enviromental': 'environmental',
  'excelent': 'excellent',
  'excellant': 'excellent',
  'exchaning': 'exchanging',
  'exeprience': 'experience',
  'exprience': 'experience',
  'extrordinary': 'extraordinary',
  'facilites': 'facilities',
  'farward': 'forward',
  'favourite': 'favorite',
  'furthur': 'further',
  'generat': 'generate',
  'goverment': 'government',
  'graduated': 'graduated',
  'guage': 'gauge',
  'happend': 'happened',
  'happend': 'happened',
  'happenned': 'happened',
  'heigth': 'height',
  'hisself': 'himself',
  'honorary': 'honorary',
  'humar': 'humor',
  'humerous': 'humorous',
  'ideally': 'ideally',
  'immediatly': 'immediately',
  'improvment': 'improvement',
  'inadvertantly': 'inadvertently',
  'independant': 'independent',
  'independantly': 'independently',
  'interuption': 'interruption',
  'irony': 'ironic',
  'knowlege': 'knowledge',
  'knowlegeable': 'knowledgeable',
  'leed': 'lead',
  'leeds': 'leads',
  'liason': 'liaison',
  'liasons': 'liaisons',
  'longitudnal': 'longitudinal',
  'managment': 'management',
  'managment': 'management',
  'mispell': 'misspell',
  'mispelled': 'misspelled',
  'mispelling': 'misspelling',
  'monitering': 'monitoring',
  'neccessary': 'necessary',
  'necessery': 'necessary',
  'negotiat': 'negotiate',
  'negotiation': 'negotiation',
  'noticable': 'noticeable',
  'ocurrance': 'occurrence',
  'occurence': 'occurrence',
  'occurences': 'occurrences',
  'ommit': 'omit',
  'ommited': 'omitted',
  'opertunity': 'opportunity',
  'opprotunity': 'opportunity',
  'organise': 'organize',
  'organised': 'organized',
  'organiztion': 'organization',
  'origional': 'original',
  'pattners': 'partners',
  'payed': 'paid',
  'peform': 'perform',
  'peformance': 'performance',
  'peformed': 'performed',
  'peforming': 'performing',
  'persistant': 'persistent',
  'phsyically': 'physically',
  'posession': 'possession',
  'prefered': 'preferred',
  'prefering': 'preferring',
  'presance': 'presence',
  'privelege': 'privilege',
  'priviledge': 'privilege',
  'profesional': 'professional',
  'professionnal': 'professional',
  'programable': 'programmable',
  'programing': 'programming',
  'pronnounce': 'pronounce',
  'pronounciation': 'pronunciation',
  'reccomend': 'recommend',
  'reccomended': 'recommended',
  'reccommend': 'recommend',
  'reccommended': 'recommended',
  'reffer': 'refer',
  'refferal': 'referral',
  'refered': 'referred',
  'refering': 'referring',
  'relevent': 'relevant',
  'relys': 'relies',
  'repond': 'respond',
  'reponsible': 'responsible',
  'representive': 'representative',
  'responsability': 'responsibility',
  'responsable': 'responsible',
  'responsibily': 'responsibility',
  'responsive': 'responsive',
  'revelant': 'relevant',
  'rhythm': 'rhythmic',
  'ritalin': 'ritalin',
  'schedual': 'schedule',
  'seconadry': 'secondary',
  'secundary': 'secondary',
  'seige': 'siege',
  'seperate': 'separate',
  'seperately': 'separately',
  'seperation': 'separation',
  'slef': 'self',
  'speach': 'speech',
  'srophes': 'srophes',
  'strenthen': 'strengthen',
  'strengthed': 'strengthened',
  'strengh': 'strength',
  'strenght': 'strength',
  'strenghten': 'strengthen',
  'sucess': 'success',
  'sucessful': 'successful',
  'sucessfully': 'successfully',
  'superceed': 'supersede',
  'superceeded': 'superseded',
  'superceeding': 'superseding',
  'supose': 'suppose',
  'suposed': 'supposed',
  'suposing': 'supposing',
  'surounded': 'surrounded',
  'surounding': 'surrounding',
  'tatoo': 'tattoo',
  'tattoo': 'tattoo',
  'technnically': 'technically',
  'teh': 'the',
  'telemtry': 'telemetry',
  'temprature': 'temperature',
  'till': 'until',
  'tommorow': 'tomorrow',
  'tommorrow': 'tomorrow',
  'truely': 'truly',
  'twelth': 'twelfth',
  'twelveth': 'twelfth',
  'usefull': 'useful',
  'usefullly': 'usefully',
  'vaccum': 'vacuum',
  'vacum': 'vacuum',
  'vegtables': 'vegetables',
  'visulaisation': 'visualisation',
  'visualization': 'visualization',
  'visting': 'visiting',
  'volunteer': 'volunteering',
  'voulenteer': 'volunteer',
  'voulenteered': 'volunteered',
  'voulenteering': 'volunteering',
  'wanna': 'want to',
  'warrenty': 'warranty',
  'whcih': 'which',
  'wholey': 'wholly',
  'writting': 'writing',
  'yeild': 'yield',
  'yeilded': 'yielded',
  'yeilding': 'yielding',
};

// Common grammar errors
const GRAMMAR_ERRORS = [
  { pattern: /\btheir is\b/gi, replacement: 'there is', suggestion: 'Use "there is" instead of "their is"' },
  { pattern: /\btheir are\b/gi, replacement: 'there are', suggestion: 'Use "there are" instead of "their are"' },
  { pattern: /\byour welcome\b/gi, replacement: "you're welcome", suggestion: 'Use "you\'re welcome" (you are) instead of "your welcome"' },
  { pattern: /\bits\b/gi, replacement: "it's", suggestion: 'Use "it\'s" (it is) instead of "its" when meaning "it is"' },
  { pattern: /\bcould of\b/gi, replacement: 'could have', suggestion: 'Use "could have" instead of "could of"' },
  { pattern: /\bwould of\b/gi, replacement: 'would have', suggestion: 'Use "would have" instead of "would of"' },
  { pattern: /\bshould of\b/gi, replacement: 'should have', suggestion: 'Use "should have" instead of "should of"' },
  { pattern: /\bwould could\b/gi, replacement: 'would be able to', suggestion: 'Use "would be able to" instead of "would could"' },
  { pattern: /\balot\b/gi, replacement: 'a lot', suggestion: 'Use "a lot" instead of "alot"' },
  { pattern: /\bthen\b/gi, replacement: 'than', suggestion: 'Use "than" for comparisons, "then" for time' },
  { pattern: /\beither\b(?=\s+or\s+)/gi, replacement: 'either', suggestion: 'Ensure consistent verb form after "either...or"' },
  { pattern: /\bwho\b(?=\s+is\b)/gi, replacement: 'who', suggestion: 'Use "who" for people, "that" for things' },
  { pattern: /\blend\b(?=\s+(into|with))/gi, replacement: 'blend', suggestion: 'Check usage of "blend"' },
  { pattern: /\baffect\b(?=\s+(on|to))/gi, replacement: 'effect', suggestion: 'Use "effect" (noun) or "affect" (verb) correctly' },
  { pattern: /\beffect\b(?=\s+(on|to))/gi, replacement: 'affect', suggestion: 'Use "affect" (verb) or "effect" (noun) correctly' },
  { pattern: /\bvery\s+best\b/gi, replacement: 'very', suggestion: 'Use "by far the best" instead of "very best"' },
  { pattern: /\bshare\s+in\s+common\b/gi, replacement: 'share', suggestion: 'Use "share in common" or "have in common"' },
  { pattern: /\bthe\s+same\s+(as|like)\b/gi, replacement: 'the same', suggestion: 'Use "the same as" not "the same like"' },
  { pattern: /\bdifferent\s+(from|than)\b/gi, replacement: 'different', suggestion: 'Use "different from" or "different than" based on region' },
];

// ─── Grammar Check Function ──────────────────────────────────────────
const checkGrammar = async (text) => {
  const errors = [];
  
  if (!text || typeof text !== 'string' || text.length < 10) {
    return { score: 0, errors: [], message: 'Text too short to check' };
  }
  
  // Check for typos
  const words = text.split(/\s+/);
  const foundTypos = [];
  
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (COMMON_TYPOS[cleanWord]) {
      foundTypos.push({
        word: cleanWord,
        correction: COMMON_TYPOS[cleanWord],
        position: text.indexOf(cleanWord),
      });
    }
  });
  
  // Check for grammar errors
  const foundGrammarErrors = [];
  GRAMMAR_ERRORS.forEach(error => {
    const matches = text.match(error.pattern);
    if (matches) {
      matches.forEach(match => {
        foundGrammarErrors.push({
          error: match,
          suggestion: error.suggestion,
          correction: error.replacement,
          position: text.indexOf(match),
        });
      });
    }
  });
  
  // Try LanguageTool API (optional, won't fail if unavailable)
  let languageToolErrors = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(LANGUAGETOOL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `text=${encodeURIComponent(text)}&language=auto`,
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      const data = await response.json();
      if (data.matches && data.matches.length > 0) {
        languageToolErrors = data.matches.slice(0, 10).map(match => ({
          message: match.message,
          context: match.context?.text || '',
          offset: match.offset,
          length: match.length,
          type: match.rule?.category?.name || 'Grammar',
          suggestions: match.replacements?.slice(0, 3) || [],
        }));
      }
    }
  } catch (apiError) {
    // LanguageTool API unavailable, continue with local checks only
    logger.debug('LanguageTool API unavailable:', apiError.message);
  }
  
  const totalErrors = foundTypos.length + foundGrammarErrors.length + languageToolErrors.length;
  const errorScore = Math.max(0, 100 - (totalErrors * 10));
  
  return {
    score: errorScore,
    errors: {
      typos: foundTypos,
      grammar: foundGrammarErrors,
      languageTool: languageToolErrors,
    },
    totalErrors,
    message: totalErrors === 0 ? 'No grammar errors found!' : `Found ${totalErrors} error(s)`,
  };
};

// ─── Synonym Matching Function ──────────────────────────────────────
const findSynonymMatches = (resumeSkills, allKeywords) => {
  const matched = [];
  const normalizedSkills = resumeSkills.map(s => s.toLowerCase().trim());
  
  Object.entries(SKILL_SYNONYMS).forEach(([primary, synonyms]) => {
    // Check if primary skill or any synonym exists in resume
    const allVariants = [primary, ...synonyms];
    const foundInResume = normalizedSkills.find(skill => 
      allVariants.some(variant => skill.includes(variant) || variant.includes(skill))
    );
    
    if (foundInResume) {
      // Find which keyword it matched
      const matchingKeyword = allKeywords.find(kw => 
        allVariants.some(variant => kw.toLowerCase().includes(variant))
      );
      
      if (matchingKeyword) {
        matched.push({
          skill: foundInResume,
          matchedKeyword: matchingKeyword,
          isPrimary: foundInResume === primary,
        });
      }
    }
  });
  
  return matched;
};

// ─── Enhanced Job Title Matching ─────────────────────────────────────
const extractJobTitle = (text) => {
  if (!text) return null;
  
  // Common job title patterns
  const titlePatterns = [
    /\b(senior|lead|principal|staff|junior|associate|entry|middle)\s+(\w+\s+){0,2}(engineer|developer|manager|analyst|designer|specialist|consultant|architect)\b/i,
    /\b(\w+\s+){0,2}(engineer|developer|manager|analyst|designer|specialist|consultant|architect|director|vp|vice president|head|chief)\b/i,
    /\b(swe\s|software\s+engineer|full\s+stack|front\s+end|back\s+end|data\s+scientist|product\s+manager|ux\s+designer|ui\s+designer)\b/i,
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].toLowerCase().trim();
    }
  }
  
  // Fallback: return first meaningful phrase
  const words = text.split(/\s+/).slice(0, 4).join(' ');
  return words.length > 3 ? words.toLowerCase() : null;
};

const matchJobTitles = (resumeJobTitle, targetJobTitle) => {
  if (!resumeJobTitle || !targetJobTitle) {
    return { match: false, score: 0, reason: 'No job titles to compare' };
  }
  
  const resumeTitle = extractJobTitle(resumeJobTitle);
  const targetTitle = extractJobTitle(targetJobTitle);
  
  if (!resumeTitle || !targetTitle) {
    return { match: false, score: 0, reason: 'Could not extract job titles' };
  }
  
  // Normalize titles for comparison
  const normalizeTitle = (title) => {
    return title
      .replace(/\b(senior|lead|principal|staff|jr|jr\.|sr|sr\.)\b/gi, '')
      .replace(/\b(years?|yrs?|of|experience|exp)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };
  
  const normalizedResume = normalizeTitle(resumeTitle);
  const normalizedTarget = normalizeTitle(targetTitle);
  
  // Calculate similarity
  const resumeWords = new Set(normalizedResume.split(/\s+/).filter(Boolean));
  const targetWords = new Set(normalizedTarget.split(/\s+/).filter(Boolean));
  
  // Find common words
  let commonWords = 0;
  resumeWords.forEach(word => {
    if (word.length > 3 && targetWords.has(word)) {
      commonWords++;
    }
  });
  
  const similarity = commonWords / Math.max(targetWords.size, 1);
  const match = similarity >= 0.4;
  
  let reason = '';
  if (match) {
    reason = `Job title "${resumeJobTitle}" aligns with target role`;
  } else if (similarity > 0) {
    reason = `Partial match - your title differs from target (${Math.round(similarity * 100)}% similarity)`;
  } else {
    reason = `Job title "${resumeJobTitle}" does not match target role "${targetJobTitle}"`;
  }
  
  return {
    match,
    score: Math.round(similarity * 100),
    resumeTitle: resumeJobTitle,
    targetTitle: targetJobTitle,
    commonWords: commonWords,
    reason,
  };
};

// ─── Skill Gap Analysis Function ─────────────────────────────────────
const analyzeSkillGaps = (resumeData, jobDescription) => {
  if (!jobDescription) {
    return { hasJobDescription: false, message: 'No job description provided' };
  }
  
  // Extract keywords from job description
  const jobKeywords = extractKeywords(jobDescription)
    .filter(k => k.count >= 1)
    .map(k => k.word)
    .filter(w => w.length > 2);
  
  // Get all resume skills
  const resumeSkills = Object.values(resumeData.skills || {}).flat();
  
  // Also include skills from experience and projects descriptions
  const experienceSkills = (resumeData.experience || [])
    .map(e => e.description || '')
    .join(' ')
    .toLowerCase();
  
  const projectSkills = (resumeData.projects || [])
    .map(p => (p.techStack || []).join(' ') + ' ' + (p.description || ''))
    .join(' ')
    .toLowerCase();
  
  const allResumeText = [
    resumeSkills.join(' '),
    experienceSkills,
    projectSkills,
  ].join(' ').toLowerCase();
  
  // Categorize skills
  const matched = [];
  const missing = [];
  const partialMatch = [];
  
  // Check for synonym matches
  const synonymMatches = findSynonymMatches(resumeSkills, jobKeywords);
  
  jobKeywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    
    // Direct match
    if (allResumeText.includes(kwLower)) {
      matched.push({ skill: kw, type: 'direct' });
      return;
    }
    
    // Synonym match
    const synonymMatch = synonymMatches.find(s => 
      kwLower.includes(s.matchedKeyword?.toLowerCase()) || 
      s.matchedKeyword?.toLowerCase().includes(kwLower)
    );
    
    if (synonymMatch) {
      partialMatch.push({ 
        skill: kw, 
        matched: synonymMatch.skill,
        type: 'synonym' 
      });
      return;
    }
    
    // No match - check if it's a skill (not common words)
    const commonWords = ['the', 'and', 'or', 'but', 'for', 'with', 'experience', 'years', 'team', 'work', 'job', 'role', 'position', 'company', 'team'];
    if (!commonWords.includes(kwLower) && kwLower.length > 2) {
      missing.push({ skill: kw, type: 'missing' });
    }
  });
  
  // Calculate scores
  const totalRequired = matched.length + missing.length + partialMatch.length;
  const coverageScore = totalRequired > 0 
    ? Math.round(((matched.length + partialMatch.length) / totalRequired) * 100)
    : 0;
  
  // Prioritize missing skills (common/high-value)
  const prioritizedMissing = missing
    .filter(m => {
      const skillLower = m.skill.toLowerCase();
      // High-value skills to prioritize
      const highValueSkills = [
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'python', 'javascript', 
        'react', 'node', 'sql', 'agile', 'scrum', 'machine learning', 'data',
        'leadership', 'communication', 'project management', 'analytics'
      ];
      return highValueSkills.some(hv => skillLower.includes(hv));
    })
    .slice(0, 10);
  
  return {
    hasJobDescription: true,
    jobKeywords: jobKeywords.slice(0, 30),
    matched: matched.slice(0, 15),
    partialMatch: partialMatch.slice(0, 10),
    missing: prioritizedMissing.length > 0 ? prioritizedMissing : missing.slice(0, 10),
    coverage: coverageScore,
    totalRequired,
    totalMatched: matched.length,
    totalPartial: partialMatch.length,
    totalMissing: missing.length,
    recommendations: [
      ...(missing.length > 0 ? [`Add these missing skills: ${missing.slice(0, 5).map(m => m.skill).join(', ')}`] : []),
      ...(partialMatch.length > 3 ? ['Some skills have synonyms - consider adding primary skill names'] : []),
      ...(coverageScore < 50 ? ['Low skill match - tailor your resume more closely to the job description'] : []),
    ],
  };
};

// ─── Industry Keywords Database ───────────────────────────────────
const INDUSTRY_KEYWORDS = {
  // ═══ TECHNOLOGY ═══
  software: {
    programming: ['javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'perl', 'shell', 'bash', 'oop', 'json', 'xml'],
    frontend: ['react', 'angular', 'vue', 'jquery', 'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'next.js', 'nuxt', 'redux', 'context api', 'html5', 'css3', 'javascript', 'material ui', 'ant design', 'chakra', 'sass', 'less', 'webpack', 'vite'],
    backend: ['node.js', 'node', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'asp.net', 'fastapi', 'graphql', 'rest api', 'restful', 'rest', 'grpc', 'nestjs', 'fastify', 'restful api', 'api', 'oop'],
    database: ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sql server', 'dynamodb', 'firebase', 'cassandra', 'sql', 'nosql', 'schema design', 'database optimization'],
    cloud: ['aws', 'azure', 'google cloud', 'gcp', 'heroku', 'vercel', 'netlify', 'digitalocean', 'cloudflare', 'amazon web services', 'ec2', 's3', 'iam', 'cloudwatch', 'lambda'],
    devops: ['docker', 'kubernetes', 'jenkins', 'ci/cd', 'git', 'github', 'gitlab', 'terraform', 'ansible', 'puppet', 'nginx', 'github actions', 'cicd', 'devops', 'containerization', 'orchestration'],
    frameworks: ['microservices', 'serverless', 'mvc', 'orm', 'api', 'web services', 'soap', 'microservices architecture'],
    tools: ['git', 'github', 'gitlab', 'docker', 'kubernetes', 'jenkins', 'jira', 'figma', 'photoshop', 'illustrator', 'webpack', 'vite', 'grunt', 'gulp', 'linux', 'ubuntu', 'bash', 'shell', 'api testing', 'postman', 'agile', 'scrum', 'kanban', 'sprint', 'jira', 'confluence'],
  },
  data_science: {
    languages: ['python', 'r', 'sql', 'sas', 'matlab', 'julia', 'scala'],
    ml: ['machine learning', 'deep learning', 'neural networks', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'xgboost', 'lightgbm'],
    tools: ['jupyter', 'pandas', 'numpy', 'scipy', 'spark', 'hadoop', 'hive', 'tableau', 'power bi', 'looker'],
    statistics: ['statistics', 'regression', 'classification', 'clustering', 'time series', 'a/b testing', 'hypothesis testing', 'bayesian'],
    nlp: ['nlp', 'natural language processing', 'text mining', 'sentiment analysis', 'transformers', 'bert', 'gpt', 'llm'],
    viz: ['data visualization', 'matplotlib', 'seaborn', 'plotly', 'd3.js', 'tableau', 'power bi'],
  },
  cybersecurity: {
    technical: ['penetration testing', 'vulnerability assessment', 'security audit', 'ethical hacking', 'cybersecurity', 'infosec', 'network security', 'firewall', 'encryption', 'siem', 'threat hunting'],
    tools: ['nmap', 'metasploit', 'wireshark', 'burp suite', 'owasp', 'nist', 'iso 27001', 'siem', 'splunk', 'crowdstrike'],
    compliance: ['gdpr', 'hipaa', 'pci-dss', 'soc 2', 'iso 27001', 'data privacy', 'risk assessment', 'incident response'],
  },
  devops: {
    tools: ['docker', 'kubernetes', 'helm', 'terraform', 'ansible', 'puppet', 'chef', 'jenkins', 'gitlab ci', 'github actions', 'circleci'],
    cloud: ['aws', 'azure', 'gcp', 'cloudformation', 'pulumi', 'serverless', 'lambda', 'ec2', 's3'],
    monitoring: ['prometheus', 'grafana', 'datadog', 'new relic', 'cloudwatch', 'elk stack', 'splunk'],
    practices: ['ci/cd', 'devops', 'infrastructure as code', 'iac', 'microservices', 'containerization', 'orchestration'],
  },

  // ═══ BUSINESS ═══
  marketing: {
    digital: ['seo', 'sem', 'ppc', 'google ads', 'facebook ads', 'linkedin ads', 'instagram marketing', 'tiktok ads'],
    analytics: ['google analytics', 'google tag manager', 'gtm', 'amplitude', 'mixpanel', 'hotjar', 'segment', 'kissmetrics'],
    content: ['content marketing', 'copywriting', 'blogging', 'email marketing', 'newsletter', 'content strategy', 'content creation'],
    social: ['social media', 'twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'influencer', 'influencer marketing'],
    tools: ['hubspot', 'mailchimp', 'salesforce crm', 'hootsuite', 'buffer', 'sprout social', 'buffer', 'canva'],
    performance: ['conversion rate optimization', 'cro', 'landing page', 'funnel', 'roi', 'campaign management'],
  },
  sales: {
    crm: ['salesforce', 'hubspot', 'crm', 'pipedrive', 'zoho crm', 'microsoft dynamics', 'sugar crm', 'force'],
    tools: ['cold calling', 'email outreach', 'linkedin sales navigator', 'zoominfo', 'clearbit', 'outreach', 'salesloft'],
    process: ['sales pipeline', 'lead generation', 'prospecting', 'closing', 'quota', 'kpi', 'sales cycle', 'b2b sales', 'b2c sales'],
    metrics: ['kpi', 'quota', 'revenue', 'roi', 'conversion rate', 'mrr', 'arr', 'churn', 'deal size', 'pipeline value'],
    negotiation: ['negotiation', 'deal closing', 'contract', 'stakeholder management', 'account management'],
  },
  finance: {
    analysis: ['financial analysis', 'financial modeling', 'valuation', 'dcf', 'forecasting', 'budgeting', 'variance analysis', 'fp&a'],
    tools: ['excel', 'vba', 'sql', 'tableau', 'power bi', 'quickbooks', 'xero', 'sap', 'oracle financial', 'financial edge'],
    accounting: ['accounting', 'gaap', 'ifrs', 'bookkeeping', 'tax', 'audit', 'reconciliation', 'general ledger', 'accounts payable', 'accounts receivable'],
    risk: ['risk management', 'credit risk', 'market risk', 'operational risk', 'var', 'basel', 'risk assessment', 'compliance'],
    banking: ['investment banking', 'commercial banking', 'private banking', 'wealth management', 'kpmg', 'deloitte', 'ey', 'pwc'],
    investment: ['portfolio management', 'asset management', 'equity', 'fixed income', 'derivatives', 'stock analysis', 'equity research'],
  },
  accounting: {
    software: ['quickbooks', 'xero', 'sage', 'freshbooks', 'wave', 'zoho books', 'oracle netsuite', 'sap'],
    tasks: ['bookkeeping', 'reconciliation', 'accounts payable', 'accounts receivable', 'payroll', 'tax preparation', 'audit', 'tax return'],
    standards: ['gaap', 'ifrs', 'fasb', 'iasb', 'tax accounting', 'corporate tax', 'individual tax'],
    tools: ['excel', 'vba', 'accounting software', 'erp', 'financial reporting', 'trial balance'],
  },
  consulting: {
    strategy: ['strategy', 'strategic planning', 'market analysis', 'competitive analysis', 'business strategy', 'growth strategy'],
    management: ['project management', 'change management', 'process improvement', 'lean', 'six sigma', 'transformation'],
    technology: ['digital transformation', 'technology consulting', 'it strategy', 'system integration', 'enterprise architecture'],
    industries: ['strategy consulting', 'management consulting', 'it consulting', 'risk consulting', 'hr consulting'],
  },
  business_analyst: {
    tools: ['excel', 'sql', 'tableau', 'power bi', 'python', 'r', 'statistics'],
    skills: ['requirements gathering', 'business requirements', 'functional requirements', 'use cases', 'user stories', 'brd', 'frd'],
    analysis: ['data analysis', 'process analysis', 'gap analysis', 'swot analysis', 'root cause analysis', 'fishbone'],
    tools_ba: ['jira', 'confluence', 'visio', 'lucychart', 'balsamiq', 'axure', 'requirements management'],
  },
  project_management: {
    methodology: ['project management', 'agile', 'scrum', 'kanban', 'waterfall', 'prince2', 'pmp', 'capm', 'lean'],
    tools: ['ms project', 'jira', 'asana', 'monday', 'trello', 'notion', 'clickup', 'wrike', 'smartsheet'],
    skills: ['project planning', 'resource management', 'risk management', 'stakeholder management', 'budget management', 'timeline management'],
    certification: ['pmp', 'capm', 'prince2', 'scrum master', 'csmp', 'pmi'],
  },

  // ═══ DESIGN & CREATIVE ═══
  design: {
    tools: ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'indesign', 'invision', 'marvel', 'zeplin'],
    ui: ['ui design', 'user interface', 'visual design', 'wireframing', 'prototyping', 'mockups', 'high fidelity', 'low fidelity'],
    ux: ['ux design', 'user experience', 'user research', 'usability testing', 'personas', 'journey mapping', 'information architecture'],
    web: ['web design', 'responsive design', 'mobile first', 'design systems', 'typography', 'color theory', 'webflow'],
  },
  graphic_design: {
    software: ['photoshop', 'illustrator', 'indesign', 'figma', 'canva', 'affinity', 'coreldraw', 'lightroom'],
    skills: ['logo design', 'branding', 'visual identity', 'typography', 'illustration', 'print design', 'packaging design'],
    print: ['print design', 'prepress', 'offset printing', 'dieline', 'color management', 'bleed', 'trim marks'],
  },
  video_production: {
    software: ['adobe premiere', 'final cut pro', 'davinci resolve', 'after effects', 'motion graphics', 'animation'],
    skills: ['video editing', 'color grading', 'sound design', 'motion graphics', 'visual effects', 'vfx', 'cgi'],
    production: ['video production', 'filmmaking', 'scriptwriting', 'storyboarding', 'directing', 'cinematography'],
  },
  copywriting: {
    content: ['copywriting', 'content writing', 'blog writing', 'article writing', 'technical writing', 'creative writing'],
    formats: ['landing pages', 'email copy', 'ad copy', 'social media copy', 'product descriptions', 'seo content'],
    skills: ['seo', 'keyword research', 'content strategy', 'tone of voice', 'brand voice', 'compelling copy'],
  },

  // ═══ HEALTHCARE & MEDICAL ═══
  healthcare: {
    clinical: ['patient care', 'clinical skills', 'diagnosis', 'treatment', 'medical', 'nursing', 'patient assessment', 'vital signs'],
    software: ['emr', 'ehr', 'epic', 'cerner', 'meditech', 'allscripts', 'medication administration', 'cpoe'],
    compliance: ['hipaa', 'patient privacy', 'medical ethics', 'informed consent', 'joint commission', 'osha'],
    specializations: ['icu', 'er', 'pediatrics', 'surgery', 'oncology', 'cardiology', 'psychiatry', 'geriatrics'],
  },
  nursing: {
    skills: ['patient care', 'vital signs', 'medication administration', 'iv therapy', 'wound care', 'patient assessment', 'nursing diagnosis'],
    software: ['epic', 'cerner', 'meditech', 'nursing documentation', 'ehr'],
    certifications: ['rn', 'bsn', 'cpr', 'bls', 'als', 'ccrn', 'cnl'],
    specializations: ['icu', 'er', 'pediatrics', 'med-surg', 'oncology', 'nursery', 'psychiatry'],
  },
  medical: {
    clinical: ['diagnosis', 'treatment', 'patient care', 'medical examination', 'prescription', 'medical history', 'physical assessment'],
    specialties: ['cardiology', 'dermatology', 'neurology', 'orthopedics', 'pediatrics', 'psychiatry', 'radiology', 'surgery'],
    software: ['emr', 'ehr', 'epic', 'cerner', 'pacs', 'radiology information system'],
    compliance: ['hipaa', 'hipaa compliance', 'medical ethics', 'patient confidentiality', 'informed consent'],
  },
  pharmaceutical: {
    research: ['drug development', 'clinical trials', 'research', 'data analysis', 'fda', 'gmp', 'gcp', 'glp'],
    clinical: ['clinical research', 'clinical data management', 'phase i/ii/iii/iv', 'patient recruitment', 'informed consent'],
    regulatory: ['fda', 'ema', 'regulatory affairs', 'nda', 'anda', 'drug approval', 'compliance'],
    manufacturing: ['gmp', 'manufacturing', 'quality control', 'quality assurance', 'batch record', 'validation'],
  },
  biotechnology: {
    research: ['biotechnology', 'research', 'lab work', 'molecular biology', 'cell culture', 'pcr', 'elisa', 'western blot'],
    technical: ['dna', 'rna', 'protein', 'gene', 'genomics', 'proteomics', 'bioinformatics'],
    applications: ['drug discovery', 'vaccine development', 'gene therapy', 'stem cell', 'crispr', 'genetic engineering'],
  },

  // ═══ EDUCATION & TRAINING ═══
  education: {
    teaching: ['teaching', 'lesson planning', 'curriculum development', 'classroom management', 'instruction', 'educational technology'],
    subjects: ['mathematics', 'science', 'english', 'history', 'biology', 'chemistry', 'physics', 'literature'],
    certifications: ['teaching certification', 'teacher certification', 'edtpa', 'state certification', 'endorsement'],
    skills: ['student assessment', 'differentiation', 'instructional strategies', 'student engagement', 'parent communication'],
  },
  training: {
    corporate: ['corporate training', 'employee training', 'training development', 'learning and development', 'l&d'],
    skills: ['instructional design', 'training delivery', 'facilitation', 'workshop', 'seminar', 'webinar'],
    tools: ['lms', 'learning management system', 'articulate', 'captivate', 'trainer', 'facilitator'],
    evaluation: ['training evaluation', 'kirkpatrick model', 'roi', 'training needs assessment', 'competency mapping'],
  },

  // ═══ ENGINEERING ═══
  mechanical_engineering: {
    design: ['cad', 'solidworks', 'autocad', 'inventor', 'proe', 'catia', 'design', 'mechanical design', '3d modeling'],
    analysis: ['finite element analysis', 'fea', 'thermal analysis', 'stress analysis', 'computational fluid dynamics', 'cfd'],
    manufacturing: ['manufacturing', 'production', 'quality control', 'quality assurance', 'lean manufacturing', 'six sigma'],
    tools: ['matlab', 'simulink', 'ansys', 'abaqus', 'nastran', 'solder', ' GD&T'],
  },
  electrical_engineering: {
    design: ['circuit design', 'pcb design', 'schematic', 'electronics', 'analog', 'digital', 'embedded systems'],
    software: ['matlab', 'simulink', 'altium', 'cadence', 'pspice', 'multisim', 'labview'],
    power: ['power systems', 'power distribution', 'electrical safety', 'ieee', 'nec', 'grounding', 'transformers'],
    signals: ['signal processing', 'dsp', 'control systems', 'plc', 'scada', 'automation'],
  },
  civil_engineering: {
    design: ['structural design', 'structural analysis', 'autocad', 'revit', 'staad', 'etabs', 'sap2000', 'civil 3d'],
    construction: ['construction management', 'project management', 'site management', 'construction scheduling', 'cpm'],
    surveying: ['surveying', 'gis', 'gps', 'total station', 'elevation', 'boundaries', 'topography'],
    geotechnical: ['geotechnical', 'soil mechanics', 'foundation', 'retaining wall', 'slope stability'],
  },
  electronics: {
    circuit: ['circuit design', 'pcb design', 'schematic capture', 'analog circuits', 'digital circuits', 'pcb layout'],
    components: ['microcontrollers', 'fpga', 'asic', 'sensors', 'actuators', 'motors', 'power electronics'],
    tools: ['multisim', 'pspice', 'altium', 'cadence', 'orcad', 'matlab', 'simulink'],
    embedded: ['embedded systems', 'firmware', 'microcontroller', 'arduino', 'raspberry pi', 'stm32', 'esp32'],
  },
  aerospace: {
    design: ['aerospace', 'aircraft', 'aviation', 'aerodynamics', 'flight mechanics', 'structural analysis'],
    software: ['catia', 'nx', 'solidworks', 'ansys', 'fluent', 'matlab', 'simulink'],
    systems: ['flight systems', 'propulsion', 'control systems', 'navigation', 'avionics', 'instrumentation'],
    quality: ['as9100', 'quality assurance', 'iso', 'aerospace standards', 'faa', 'easa'],
  },

  // ═══ LAW & LEGAL ═══
  legal: {
    practice: ['litigation', 'corporate law', 'contract law', 'intellectual property', 'patent', 'trademark', 'copyright', 'employment law'],
    drafting: ['contract drafting', 'legal drafting', 'agreement', 'terms', 'conditions', 'negotiation'],
    research: ['legal research', 'case law', 'statutes', 'regulations', 'legal analysis', 'due diligence'],
    software: ['lexisnexis', 'westlaw', 'clio', 'practice management', 'document management'],
  },
  paralegal: {
    skills: ['legal research', 'document preparation', 'case management', 'filing', 'discovery', 'deposition'],
    software: ['lexisnexis', 'westlaw', 'clio', 'relativity', 'concordin', 'caseview'],
    tasks: ['briefs', 'motions', 'contracts', 'discovery requests', 'subpoena', 'legal assistant'],
  },

  // ═══ HR & PEOPLE ═══
  hr: {
    recruitment: ['recruitment', 'talent acquisition', 'hiring', 'onboarding', 'staffing', 'headhunter', 'sourcing', 'interviewing'],
    hris: ['hris', 'workday', 'bamboohr', 'adp', 'successfactors', 'greenhouse', 'lever', 'entelo'],
    engagement: ['employee engagement', 'culture', 'retention', 'performance management', '360 feedback', 'employee relations'],
    compliance: ['compliance', 'labor law', 'employment law', 'osha', 'eeoc', 'background check', 'i-9', 'e-verify'],
    training: ['training', 'learning and development', 'l&d', 'talent development', 'coaching', 'mentoring'],
  },
  talent_acquisition: {
    sourcing: ['sourcing', 'candidate sourcing', 'talent sourcing', 'linkedin recruiter', 'boolean search', 'passive candidates'],
    tools: ['linkedin', 'indeed', 'ziprecruiter', 'greenhouse', 'lever', 'bullhorn', 'ats', 'applicant tracking system'],
    process: ['interviewing', 'screening', 'assessment', 'negotiation', 'offer management', 'background check'],
    metrics: ['time to hire', 'cost per hire', 'quality of hire', 'pipeline', 'conversion rate', 'offer acceptance'],
  },

  // ═══ OPERATIONS & LOGISTICS ═══
  operations: {
    management: ['operations management', 'process management', 'process improvement', 'operational efficiency', 'workflow'],
    tools: ['lean', 'six sigma', 'process mapping', 'value stream', 'kaizen', '5s', 'poka-yoke'],
    software: ['sap', 'oracle', 'erp', 'crm', 'wms', 'scm', 'inventory management'],
    metrics: ['kpi', 'metrics', 'throughput', 'cycle time', 'turnaround', 'efficiency', 'productivity'],
  },
  logistics: {
    supply_chain: ['supply chain', 'logistics', 'supply chain management', 'scm', 'procurement', 'sourcing'],
    warehouse: ['warehouse', 'warehouse management', 'wms', 'inventory', 'storage', 'fulfillment', 'pick pack ship'],
    transportation: ['transportation', 'freight', 'shipping', 'dispatch', 'fleet management', 'route optimization'],
    software: ['sap', 'oracle', 'blue yonder', 'manhattan', 'kuebix', ' Descartes'],
  },
  supply_chain: {
    planning: ['supply chain planning', 'demand planning', 's&op', 'inventory planning', 'production planning'],
    procurement: ['procurement', 'purchasing', 'supplier management', 'vendor management', 'rfq', 'rfi', 'po'],
    execution: ['warehouse', 'transportation', 'distribution', 'fulfillment', 'last mile', '3pl'],
    software: ['sap', 'oracle', 'blue yonder', 'kinaxis', 'toolsgroup', 'o9'],
  },
  procurement: {
    sourcing: ['sourcing', 'supplier sourcing', 'vendor selection', 'rfq', 'rfi', 'rfp', 'bid analysis'],
    negotiation: ['negotiation', 'cost reduction', 'savings', 'vendor management', 'contract management'],
    tools: [' Coupa', 'procurify', 'oracle procurement', 'sap ariba', 'precor'],
    processes: ['procurement', 'purchasing', 'accounts payable', 'vendor onboarding', 'compliance'],
  },
  manufacturing: {
    production: ['production', 'manufacturing', 'assembly', 'production planning', 'scheduling', 'capacity planning'],
    quality: ['quality control', 'quality assurance', 'qc', 'qa', 'iso', 'six sigma', 'lean manufacturing'],
    tools: ['lean', 'six sigma', '5s', 'kaizen', 'poka-yoke', 'gemba', 'kanban', 'jit'],
    software: ['mes', 'erp', 'sap', 'oracle', 'delmia', 'processbook'],
  },

  // ═══ HOSPITALITY & SERVICE ═══
  hospitality: {
    hotel: ['hotel management', 'front desk', 'concierge', 'housekeeping', 'food and beverage', 'revenue management'],
    restaurant: ['restaurant management', 'food service', 'culinary', 'kitchen', 'menu development', 'cost control'],
    events: ['event planning', 'catering', 'banquet', 'conference', 'wedding', 'corporate events'],
    skills: ['customer service', 'guest relations', 'reservation', 'check-in', 'check-out', 'billing'],
  },
  retail: {
    sales: ['retail sales', 'merchandising', 'store management', 'visual merchandising', 'inventory', 'stock'],
    software: ['pos', 'square', 'shopify', 'magento', 'netsuite', 'retail pos', 'crm'],
    skills: ['customer service', 'sales', 'upselling', 'product knowledge', 'cash handling', 'inventory'],
    management: ['store manager', 'district manager', 'regional manager', 'retail operations', 'loss prevention'],
  },
  customer_service: {
    skills: ['customer service', 'customer support', 'client relations', 'complaint resolution', 'problem solving'],
    tools: ['zendesk', 'freshdesk', 'salesforce', 'intercom', 'hubspot', 'livesite', 'five9'],
    channels: ['phone', 'email', 'chat', 'social media', 'webinar', 'knowledge base'],
    metrics: ['csat', 'nps', 'first response time', 'resolution time', 'ticket volume'],
  },

  // ═══ MEDIA & COMMUNICATIONS ═══
  media: {
    digital: ['digital media', 'social media', 'content creation', 'media planning', 'media buying', 'advertising'],
    production: ['media production', 'video', 'audio', 'podcast', 'streaming', 'broadcast'],
    advertising: ['advertising', 'ad tech', 'programmatic', 'dsp', 'ssp', 'ad exchange'],
    tools: ['google ads', 'facebook business manager', 'twitter ads', 'linkedin ads', 'dv360', 'trade desk'],
  },
  communications: {
    corporate: ['corporate communications', 'internal communications', 'external communications', 'pr', 'media relations'],
    content: ['content strategy', 'content marketing', 'brand messaging', 'storytelling', 'thought leadership'],
    digital: ['digital communications', 'social media', 'email marketing', 'marketing communications'],
    tools: ['mailchimp', 'hubspot', 'marketo', 'pardot', 'sendinblue', 'buffer'],
  },
  journalism: {
    writing: ['journalism', 'reporting', 'news writing', 'feature writing', 'investigative journalism', 'interviewing'],
    editing: ['editing', 'copy editing', 'proofreading', 'fact checking', 'source verification'],
    formats: ['article', 'news', 'feature', 'opinion', 'editorial', 'column', 'blog'],
    media: ['print', 'digital', 'broadcast', 'online', 'news outlet', 'publication'],
  },

  // ═══ SCIENCE & RESEARCH ═══
  research: {
    scientific: ['research', 'scientific research', 'laboratory', 'data analysis', 'hypothesis', 'methodology'],
    methods: ['qualitative research', 'quantitative research', 'survey', 'interview', 'case study', 'experiment'],
    academic: ['academic research', 'publication', 'peer review', 'conference', 'thesis', 'dissertation'],
    tools: ['spss', 'stata', 'nvivo', 'atlas.ti', 'endnote', 'zotero', 'reference manager'],
  },
  chemistry: {
    analytical: ['analytical chemistry', 'chromatography', 'spectroscopy', 'mass spectrometry', 'hplc', 'gcms'],
    organic: ['organic chemistry', 'synthesis', 'reactions', 'purification', 'characterization'],
    industrial: ['industrial chemistry', 'chemical engineering', 'process chemistry', 'manufacturing'],
    software: ['chemdraw', 'mestrenova', 'gaussian', 'diamond', 'origin'],
  },
  physics: {
    theoretical: ['theoretical physics', 'quantum mechanics', 'relativity', 'particle physics', 'astrophysics'],
    experimental: ['experimental physics', 'laboratory', 'data analysis', 'measurement', 'instrumentation'],
    computational: ['computational physics', 'simulation', 'modeling', 'matlab', 'python', 'fortran'],
    research: ['research', 'publication', 'thesis', 'dissertation', 'grant writing'],
  },

  // ═══ GOVERNMENT & PUBLIC ═══
  government: {
    public_administration: ['public administration', 'public policy', 'government', 'policy analysis', 'program management'],
    compliance: ['compliance', 'regulations', 'federal', 'state', 'local', 'public sector', 'oversight'],
    programs: ['program management', 'grant management', 'policy implementation', 'public service'],
    software: ['govtech', 'classification', 'security clearance', 'civic', 'open government'],
  },
  nonprofit: {
    fundraising: ['fundraising', 'donor relations', 'grant writing', 'charity', 'philanthropy', 'donor management'],
    programs: ['program management', 'community outreach', 'advocacy', 'volunteer management', 'mission'],
    software: ['blackbaud', 'salesforce nonprofit', 'constant contact', 'network for good', 'classy'],
    management: ['nonprofit management', 'board relations', 'strategic planning', 'impact measurement'],
  },

  // ═══ REAL ESTATE & CONSTRUCTION ═══
  real_estate: {
    sales: ['real estate', 'property sales', 'residential', 'commercial', 'luxury', 'investment properties'],
    leasing: ['leasing', 'tenant', 'landlord', 'lease negotiation', 'commercial leasing', 'property management'],
    software: ['mls', 'zillow', 'redfin', 'salesforce', 'constellation', 'buildium', 'propertyware'],
    skills: ['negotiation', 'market analysis', 'appraisal', 'property valuation', 'financing'],
  },
  construction: {
    management: ['construction management', 'project management', 'site supervision', 'general contractor', 'construction superintendent'],
    software: ['procore', 'bluebeam', 'plangrid', ' Autodesk construction', 'viewpoint', 'sage construction'],
    trades: ['electrical', 'plumbing', 'hvac', 'carpentry', 'masonry', 'painting', 'roofing'],
    safety: ['osha', 'safety', 'construction safety', 'site safety', 'ppe', 'job site'],
  },

  // ═══ TELECOMMUNICATIONS ═══
  telecommunications: {
    technical: ['telecommunications', 'networking', 'fiber optics', '5g', '4g', 'lte', 'wireless', 'microwave'],
    equipment: ['cisco', 'juniper', 'ericsson', 'nokia', 'huawei', 'mpls', 'voip', 'sip'],
    software: ['network management', 'nms', 'oss', 'bss', 'telco', 'billing', 'crm'],
    services: ['isp', 'mobile', 'voip', 'unified communications', 'collaboration', 'video conferencing'],
  },

  // ═══ AGRICULTURE & ENVIRONMENT ═══
  agriculture: {
    farming: ['farming', 'agriculture', 'crop production', 'livestock', 'farmer', 'agronomy'],
    technology: ['precision agriculture', 'agri tech', 'drone', 'gis', 'gps', 'automation'],
    software: ['farm management', 'crop management', 'agriness', 'trimble', 'john deere'],
    skills: ['soil', 'irrigation', 'pest control', 'harvest', 'yield', 'sustainability'],
  },
  environmental: {
    sustainability: ['environmental', 'sustainability', 'esg', 'carbon footprint', 'renewable energy', 'green energy'],
    compliance: ['environmental compliance', 'epa', 'iepa', 'permitting', 'environmental impact', 'eia'],
    software: ['gis', 'arcgis', 'environmental software', 'modeling', 'simulation'],
    skills: ['environmental science', 'ecology', 'pollution', 'waste management', 'recycling'],
  },

  // ═══ TRANSPORTATION & AUTOMOTIVE ═══
  transportation: {
    logistics: ['transportation', 'logistics', 'freight', 'shipping', 'dispatch', 'fleet management'],
    operations: ['operations', 'route planning', 'driver management', 'load planning', 'compliance'],
    software: ['transportation software', 'fleet', 'tms', 'motive', 'keep truckin', ' Samsara'],
    skills: ['cdl', 'dot', 'safety', 'hours of service', 'hazmat', 'tanker'],
  },
  automotive: {
    technical: ['automotive', 'vehicle', 'mechanic', 'repair', 'maintenance', 'diagnostics', 'engine', 'transmission'],
    software: ['automotive software', 'obd', 'can bus', 'diagnostic', ' Dealer management', 'cdk', 'dealertrack'],
    sales: ['automotive sales', 'car sales', 'vehicle sales', 'f&i', 'finance and insurance', 'dealership'],
    skills: ['customer service', 'sales', 'negotiation', 'product knowledge', 'test drive'],
  },

  // ═══ SPORTS & FITNESS ═══
  sports: {
    coaching: ['coaching', 'sports coaching', 'athlete development', 'training', 'performance', 'sports science'],
    management: ['sports management', 'event management', 'facility management', 'league management', 'operations'],
    fitness: ['fitness', 'personal training', 'trainer', 'group fitness', 'nutrition', 'wellness'],
    skills: ['athletics', 'sports', 'competition', 'team management', 'player development'],
  },
};

const SOFT_SKILLS = [
  'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical', 'critical thinking',
  'adaptability', 'time management', 'organizational', 'creativity', 'innovation', 'collaboration',
  'interpersonal', 'conflict resolution', 'decision making', 'strategic thinking', 'attention to detail',
  'multi-tasking', 'self-motivated', 'independent', 'flexible', 'positive attitude', 'work ethic',
  'accountability', 'reliability', 'initiative', 'mentoring', 'coaching', 'presentation',
  'negotiation', 'stakeholder management', 'customer service', 'client facing', 'relationship building',
];

const ACTION_VERBS = {
  leadership: ['led', 'managed', 'directed', 'coordinated', 'supervised', 'mentored', 'coached', 'guided', 'spearheaded', 'headed', 'oversaw'],
  achievement: ['achieved', 'accomplished', 'delivered', 'exceeded', 'surpassed', 'attained', 'realized', 'generated', 'produced', 'won', 'awarded'],
  technical: ['developed', 'designed', 'engineered', 'built', 'created', 'implemented', 'integrated', 'deployed', 'architected', 'configured', 'automated', 'optimized', 'enhanced', 'upgraded'],
  communication: ['presented', 'communicated', 'explained', 'documented', 'authored', 'published', 'reported', 'briefed', 'trained', 'conducted', 'facilitated'],
  analytical: ['analyzed', 'evaluated', 'assessed', 'investigated', 'examined', 'reviewed', 'audited', 'measured', 'monitored', 'tracked', 'researched', 'identified'],
  result: ['increased', 'decreased', 'reduced', 'improved', 'enhanced', 'grew', 'expanded', 'scaled', 'streamlined', 'transformed', 'restructured', 'reengineered'],
};

const WEAK_WORDS = [
  'helped', 'assisted', 'worked on', 'participated', 'tried', 'attempted', 'involved in',
  'responsible for', 'duties included', 'handled', 'dealt with', 'tasked with',
  'some stuff', 'things', 'stuff', 'various', 'etc', 'and other things',
  'good', 'great', 'awesome', 'nice', 'amazing', 'excellent',  // subjective - no metrics
];

const ATS_UNFRIENDLY_ELEMENTS = [
  { pattern: /<img/i, name: 'Images', message: 'Avoid images - ATS cannot read them' },
  { pattern: /<table/i, name: 'Tables', message: 'Tables may not parse correctly in some ATS systems' },
  { pattern: /text.?box/i, name: 'Text boxes', message: 'Text boxes are often not readable by ATS' },
  { pattern: /header|footer/i, name: 'Headers/Footers', message: 'Headers and footers may be ignored by ATS' },
  { pattern: /column|columns/i, name: 'Columns', message: 'Multiple columns can break ATS parsing' },
  { pattern: /\[.*\]/i, name: 'Special characters', message: 'Avoid special characters in brackets' },
];

// ─── Utility Functions ─────────────────────────────────────────────
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

const countWords = (text) => {
  const sanitized = sanitizeText(text);
  return sanitized ? sanitized.split(/\s+/).filter(Boolean).length : 0;
};

const countSentences = (text) => {
  const sanitized = sanitizeText(text);
  return sanitized ? sanitized.split(/[.!?]+/).filter(Boolean).length : 0;
};

const countSyllables = (word) => {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
};

const calculateReadability = (text) => {
  const sanitized = sanitizeText(text);
  if (!sanitized || sanitized.length < 50) return 0;
  
  const words = sanitized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount < 10) return 0;
  
  const sentenceCount = Math.max(1, countSentences(sanitized));
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  // Flesch Reading Ease
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getReadabilityGrade = (score) => {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
};

const extractKeywords = (text) => {
  const sanitized = sanitizeText(text).toLowerCase();
  const words = sanitized.split(/\s+/).filter(w => w.length > 2);
  const wordCounts = {};
  
  words.forEach(word => {
    const clean = word.replace(/[^a-z0-9]/g, '');
    if (clean.length > 2) {
      wordCounts[clean] = (wordCounts[clean] || 0) + 1;
    }
  });
  
  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
};

const calculateKeywordDensity = (text, keywords) => {
  const sanitized = sanitizeText(text).toLowerCase();
  const totalWords = countWords(sanitized);
  if (totalWords === 0) return [];
  
  return keywords.map(kw => {
    const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'gi');
    const matches = (sanitized.match(regex) || []).length;
    const density = (matches / totalWords) * 100;
    return { keyword: kw, matches, density: density.toFixed(2) };
  }).filter(k => k.matches > 0);
};

const getDateFormat = (dateStr) => {
  if (!dateStr) return null;
  // Check for various formats
  if (/^\d{4}$/.test(dateStr)) return 'year';
  if (/^\d{2}\/\d{4}$/.test(dateStr)) return 'monthYear';
  if (/^[a-zA-Z]+\s\d{4}$/.test(dateStr)) return 'monthYear';
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) return 'fullDate';
  return 'unknown';
};

const checkConsistentDates = (dates) => {
  const formats = dates.filter(Boolean).map(getDateFormat).filter(Boolean);
  if (formats.length < 2) return true;
  const unique = [...new Set(formats)];
  return unique.length === 1;
};

// ─── Scoring Functions ────────────────────────────────────────────
const scoreContactInfo = (contact, suggestions) => {
  let score = 0;
  const maxScore = 10;
  
  const hasName = contact?.fullName && contact.fullName.length >= 2;
  
  if (hasName) {
    score += 5;
  } else {
    suggestions.push({ type: 'error', section: 'contact', text: 'Add your full name' });
  }
  
  if (contact?.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(contact.email)) {
      score += 3;
    }
  } else {
    suggestions.push({ type: 'error', section: 'contact', text: 'Add your email address' });
  }
  
  if (contact?.phone) {
    const phoneRegex = /^[\d\s\-+()]{10,20}$/;
    if (phoneRegex.test(contact.phone.replace(/\s/g, ''))) {
      score += 2;
    }
  }
  
  if (contact?.linkedin) {
    if (contact.linkedin.includes('linkedin.com')) {
      score += 2;
    }
  }
  
  if (contact?.github || contact?.portfolio) {
    score += 1;
  }
  
  return Math.min(score, maxScore);
};

const scoreSummary = (summary, suggestions) => {
  let score = 0;
  const maxScore = 15;
  
  if (!summary) {
    suggestions.push({ type: 'error', section: 'summary', text: 'Add a professional summary' });
    return 0;
  }
  
  const wordCount = countWords(summary);
  const sentenceCount = countSentences(summary);
  
  // Length scoring - more generous
  if (wordCount >= 15) score += 4;
  if (wordCount >= 30) score += 4;
  if (wordCount >= 50) score += 3;
  if (wordCount >= 80) score += 2;
  
  // Sentence structure
  if (sentenceCount >= 2 && sentenceCount <= 6) score += 3;
  else if (sentenceCount > 6) score += 1;
  
  // Action verbs
  const summaryLower = summary.toLowerCase();
  const foundActionVerbs = Object.values(ACTION_VERBS).flat().filter(verb => summaryLower.includes(verb));
  if (foundActionVerbs.length > 0) score += 2;
  
  // Readability
  const readability = calculateReadability(summary);
  if (readability >= 40 && readability <= 85) score += 2;
  
  // Suggestions
  if (wordCount < 20) {
    suggestions.push({ type: 'warning', section: 'summary', text: 'Summary is too short. Aim for 30-50 words.' });
  } else if (wordCount > 150) {
    suggestions.push({ type: 'warning', section: 'summary', text: 'Summary is too long. Keep it under 150 words.' });
  }
  
  if (foundActionVerbs.length === 0) {
    suggestions.push({ type: 'info', section: 'summary', text: 'Add action verbs to make your summary more impactful' });
  }
  
  if (readability < 35) {
    suggestions.push({ type: 'warning', section: 'summary', text: 'Improve readability - use shorter sentences and simpler words' });
  }
  
  return Math.min(score, maxScore);
};

const scoreExperience = (experiences, internships, suggestions) => {
  let score = 0;
  const maxScore = 25;
  
  const allRoles = [...(experiences || []), ...(internships || [])];
  
  if (allRoles.length === 0) {
    suggestions.push({ type: 'error', section: 'experience', text: 'Add your work experience or internships' });
    return 0;
  }
  
  // Quantity scoring - more generous
  if (allRoles.length >= 1) score += 7;
  if (allRoles.length >= 2) score += 5;
  if (allRoles.length >= 3) score += 3;
  
  let metricsCount = 0;
  let actionVerbsCount = 0;
  let weakWordsFound = [];
  let dates = [];
  let rolesWithDescriptions = 0;
  
  allRoles.forEach((role, index) => {
    const desc = role.description || '';
    const descLower = desc.toLowerCase();
    
    if (desc && desc.length > 20) {
      rolesWithDescriptions++;
    }
    
    // Metrics detection
    const metricPatterns = [
      /\d+%/i,
      /\d+\s*(x|times)/i,
      /\$\d+/i,
      /\d+\s*(users?|customers?|clients?|employees?|students?|members?)/i,
      /\d+\s*(million|billion|k|percent)/i,
      /\d+\s*(year|month|day|hour|week)s?/i,
      /\d+\s*(increase|decrease|reduction|improvement|growth)/i,
    ];
    
    const hasMetrics = metricPatterns.some(pattern => pattern.test(desc));
    if (hasMetrics) metricsCount++;
    
    // Action verbs
    const foundVerbs = Object.values(ACTION_VERBS).flat().filter(verb => descLower.includes(verb));
    if (foundVerbs.length > 0) actionVerbsCount++;
    
    // Weak words
    const foundWeak = WEAK_WORDS.filter(w => descLower.includes(w));
    if (foundWeak.length > 0) {
      weakWordsFound.push(...foundWeak.slice(0, 1));
    }
    
    // Dates
    if (role.startDate) dates.push(role.startDate);
    if (role.endDate && role.endDate !== 'Present') dates.push(role.endDate);
  });
  
  // Description quality bonus
  if (rolesWithDescriptions >= 1) score += 3;
  if (rolesWithDescriptions >= 2) score += 2;
  
  // Metrics bonus - more generous
  if (metricsCount >= 1) score += 4;
  if (metricsCount >= 2) score += 3;
  if (metricsCount >= 3) score += 2;
  
  // Action verbs bonus
  if (actionVerbsCount >= 1) score += 3;
  if (actionVerbsCount >= 2) score += 2;
  
  // Date consistency
  if (checkConsistentDates(dates)) score += 2;
  
  // Suggestions
  if (metricsCount === 0) {
    suggestions.push({ type: 'warning', section: 'experience', text: 'Add measurable results (%, $, numbers) to showcase your impact' });
  }
  
  if (weakWordsFound.length > 0) {
    suggestions.push({ type: 'warning', section: 'experience', text: `Avoid weak words like "${weakWordsFound[0]}" - use action verbs instead` });
  }
  
  if (!checkConsistentDates(dates)) {
    suggestions.push({ type: 'warning', section: 'experience', text: 'Use consistent date format (e.g., "Jan 2020" or "2020")' });
  }
  
  return Math.min(score, maxScore);
};

const scoreEducation = (education, suggestions) => {
  let score = 0;
  const maxScore = 10;
  
  if (!education || education.length === 0) {
    suggestions.push({ type: 'error', section: 'education', text: 'Add your education details' });
    return 0;
  }
  
  const primary = education[0];
  
  // Presence
  score += 4;
  
  // Degree
  if (primary?.degree) {
    score += 3;
    // Check for specific degree types
    const degreeLower = primary.degree.toLowerCase();
    if (degreeLower.includes('phd') || degreeLower.includes('doctor')) score += 1;
    else if (degreeLower.includes('master') || degreeLower.includes('mba')) score += 1;
  }
  
  // CGPA/Grade
  if (primary?.cgpa || primary?.grade) {
    score += 2;
  }
  
  // Suggestions
  if (education.length >= 2) {
    suggestions.push({ type: 'info', section: 'education', text: 'Consider highlighting only relevant education for the job' });
  }
  
  return Math.min(score, maxScore);
};

const scoreSkills = (skills, suggestions) => {
  let score = 0;
  const maxScore = 20;
  
  if (!skills || typeof skills !== 'object') {
    suggestions.push({ type: 'error', section: 'skills', text: 'Add your technical and soft skills' });
    return 0;
  }
  
  const allSkills = Object.values(skills).flat().filter(Boolean);
  const categories = Object.keys(skills).filter(key => skills[key]?.length > 0);
  
  // Quantity scoring - more generous
  if (allSkills.length >= 2) score += 3;
  if (allSkills.length >= 5) score += 4;
  if (allSkills.length >= 10) score += 4;
  if (allSkills.length >= 15) score += 3;
  
  // Category diversity
  if (categories.length >= 2) score += 3;
  if (categories.length >= 4) score += 2;
  
  // Check for soft skills
  const softSkillsCount = allSkills.filter(s => 
    SOFT_SKILLS.some(ss => s.toLowerCase().includes(ss.toLowerCase()))
  ).length;
  
  if (softSkillsCount >= 1) score += 2;
  if (softSkillsCount >= 3) score += 1;
  
  // Suggestions
  if (allSkills.length < 5) {
    suggestions.push({ type: 'info', section: 'skills', text: `Add more skills. Currently ${allSkills.length} - aim for 10-15` });
  }
  
  if (categories.length < 2 && allSkills.length >= 5) {
    suggestions.push({ type: 'info', section: 'skills', text: 'Categorize skills for better ATS parsing' });
  }
  
  return Math.min(score, maxScore);
};

const scoreProjects = (projects, suggestions) => {
  let score = 0;
  const maxScore = 10;
  
  if (!projects || projects.length === 0) {
    suggestions.push({ type: 'warning', section: 'projects', text: 'Add projects to showcase your practical skills' });
    return 0;
  }
  
  // Quantity
  if (projects.length >= 1) score += 3;
  if (projects.length >= 2) score += 3;
  
  // Tech stack
  const hasTechStack = projects.some(p => p.techStack && p.techStack.length > 0);
  if (hasTechStack) score += 2;
  
  // Description quality
  projects.forEach(project => {
    const desc = project.description || '';
    const wordCount = countWords(desc);
    
    if (wordCount >= 20) score += 1;
    
    // Check for metrics in projects
    if (/\d+%|\d+\s*x|\$\d+|\d+\s*(user|download)/i.test(desc)) {
      score += 0.5;
    }
  });
  
  // Suggestions
  if (projects.length < 2) {
    suggestions.push({ type: 'warning', section: 'projects', text: 'Add at least 2 projects to strengthen your resume' });
  }
  
  if (!hasTechStack) {
    suggestions.push({ type: 'warning', section: 'projects', text: 'Add technology stack used in your projects' });
  }
  
  return Math.min(score, maxScore);
};

const scoreExtras = (certifications, achievements, suggestions) => {
  let score = 0;
  const maxScore = 10;
  
  const certs = certifications || [];
  const achievementsList = achievements || [];
  
  if (certs.length > 0) score += 3;
  if (achievementsList.length > 0) score += 3;
  if (certs.length + achievementsList.length >= 3) score += 4;
  
  // Quality check for achievements
  let quantifiedAchievements = 0;
  achievementsList.forEach(ach => {
    const text = ach.text || ach;
    if (/\d+%|\d+\s*x|\$\d+|\d+\s*(award|winner)/i.test(text)) {
      quantifiedAchievements++;
    }
  });
  
  if (quantifiedAchievements > 0) {
    score += 1;
  } else if (achievementsList.length > 0) {
    suggestions.push({ type: 'info', section: 'extras', text: 'Quantify your achievements with numbers where possible' });
  }
  
  return Math.min(score, maxScore);
};

const scoreKeywordAnalysis = (resumeData, targetJob, suggestions) => {
  let score = 0;
  const maxScore = 15;
  
  // Combine all text content
  const allText = [
    resumeData.summary || '',
    ...(resumeData.experience || []).map(e => e.description || ''),
    ...(resumeData.internships || []).map(i => i.description || ''),
    ...(resumeData.projects || []).map(p => p.description || ''),
    Object.values(resumeData.skills || {}).flat().join(' '),
  ].join(' ').toLowerCase();
  
  // Get keywords from job description if provided
  let targetKeywords = [];
  if (targetJob) {
    // Extract keywords from job description
    targetKeywords = extractKeywords(targetJob)
      .filter(k => k.count >= 1)
      .slice(0, 30)
      .map(k => k.word);
  } else {
    // Use industry standard keywords - but focus on relevant ones
    // For resume scoring without job desc, use software/IT keywords
    const softwareKeywords = INDUSTRY_KEYWORDS.software;
    Object.values(softwareKeywords).forEach(keywords => {
      targetKeywords.push(...keywords);
    });
    
    // Add some other relevant keywords
    targetKeywords.push(...INDUSTRY_KEYWORDS.devops?.programming || []);
    targetKeywords.push(...INDUSTRY_KEYWORDS.devops?.cloud || []);
  }
  
  // Remove duplicates and filter
  targetKeywords = [...new Set(targetKeywords.map(k => k.toLowerCase()))].filter(k => k.length > 2);
  
  // Calculate matches
  let matchCount = 0;
  const matchedKeywords = [];
  
  targetKeywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (allText.includes(kwLower)) {
      matchCount++;
      matchedKeywords.push(kw);
    }
  });
  
  // Score based on matches - adjusted thresholds
  const matchPercentage = targetKeywords.length > 0 
    ? (matchCount / targetKeywords.length) * 100 
    : 0;
  
  if (matchPercentage >= 10) score += 4;
  if (matchPercentage >= 20) score += 4;
  if (matchPercentage >= 30) score += 4;
  
  // Add bonus for high-value keywords
  const highValueKeywords = ['aws', 'docker', 'kubernetes', 'python', 'javascript', 'react', 'machine learning', 'node', 'django', 'laravel', 'mysql', 'mongodb', 'postgresql', 'sql', 'rest api', 'graphql', 'git', 'github', 'linux', 'agile', 'scrum'];
  const foundHighValue = matchedKeywords.filter(k => 
    highValueKeywords.some(hv => k.toLowerCase().includes(hv.toLowerCase()))
  );
  
  if (foundHighValue.length >= 2) score += 2;
  if (foundHighValue.length >= 4) score += 2;
  
  // Suggestions
  if (matchPercentage < 15) {
    suggestions.push({ type: 'warning', section: 'keywords', text: `Low keyword match (${Math.round(matchPercentage)}%). Add more relevant skills.` });
  } else if (matchPercentage < 30) {
    suggestions.push({ type: 'info', section: 'keywords', text: `Keyword match is ${Math.round(matchPercentage)}%. Good progress!` });
  }
  
  if (foundHighValue.length === 0 && targetJob) {
    suggestions.push({ type: 'info', section: 'keywords', text: 'Consider adding high-demand skills like AWS, Docker, Python' });
  }
  
  return {
    score: Math.min(score, maxScore),
    matchedKeywords: matchedKeywords.slice(0, 10),
    matchPercentage: Math.round(matchPercentage),
  };
};

const scoreReadability = (resumeData, suggestions) => {
  let score = 0;
  const maxScore = 8;
  
  const allText = [
    resumeData.summary || '',
    ...(resumeData.experience || []).map(e => e.description || ''),
    ...(resumeData.projects || []).map(p => p.description || ''),
  ].join(' ');
  
  const readability = calculateReadability(allText);
  
  // Score based on readability
  if (readability >= 50 && readability <= 80) {
    score += 5;
  } else if (readability >= 40 && readability <= 90) {
    score += 3;
  } else if (readability > 0) {
    score += 1;
  }
  
  // Check for bullet points (good for ATS)
  const bulletCount = (allText.match(/[•\-\*]\s/g) || []).length;
  if (bulletCount >= 5) score += 2;
  else if (bulletCount >= 3) score += 1;
  
  // Suggestions
  if (readability < 40 && readability > 0) {
    suggestions.push({ type: 'warning', section: 'readability', text: `Text is difficult to read (score: ${readability}). Use shorter sentences and simpler words.` });
  } else if (readability > 90) {
    suggestions.push({ type: 'info', section: 'readability', text: 'Text is very simple. Consider adding more professional terminology.' });
  }
  
  if (bulletCount < 3) {
    suggestions.push({ type: 'info', section: 'readability', text: 'Use bullet points to make your content scannable for recruiters and ATS' });
  }
  
  return {
    score: Math.min(score, maxScore),
    readabilityScore: readability,
    readabilityGrade: getReadabilityGrade(readability),
  };
};

const scoreFormatting = (resumeData, suggestions) => {
  let score = 0;
  const maxScore = 10;
  
  let formatIssues = [];
  
  // Check for standard section headers
  const hasStandardHeaders = [
    { key: 'summary', header: /summary|profile|objective/i },
    { key: 'experience', header: /experience|work\s*history|employment/i },
    { key: 'education', header: /education|academic/i },
    { key: 'skills', header: /skills|competencies|expertise/i },
  ];
  
  let headerScore = 0;
  hasStandardHeaders.forEach(({ key, header }) => {
    if (resumeData[key] && typeof resumeData[key] === 'string') {
      if (header.test(resumeData[key])) headerScore++;
    }
  });
  
  if (headerScore >= 2) score += 2;
  if (headerScore >= 3) score += 2;
  
  // Check resume length (1-2 pages optimal)
  const totalText = JSON.stringify(resumeData).length;
  if (totalText > 2000 && totalText < 8000) {
    score += 2;
  } else if (totalText <= 2000) {
    suggestions.push({ type: 'info', section: 'formatting', text: 'Resume may be too short. Add more details.' });
    score += 1;
  } else if (totalText > 10000) {
    suggestions.push({ type: 'info', section: 'formatting', text: 'Resume may be too long. Consider condensing.' });
    score += 1;
  }
  
  // Check for consistent formatting (job titles, dates)
  const experiences = resumeData.experience || [];
  const hasJobTitles = experiences.some(e => e.jobTitle && e.jobTitle.length > 0);
  const hasCompanies = experiences.some(e => e.company && e.company.length > 0);
  
  if (hasJobTitles) score += 1;
  if (hasCompanies) score += 1;
  
  // Visual design check - look for potential issues
  const allDescriptions = [
    resumeData.summary || '',
    ...experiences.map(e => e.description || ''),
    ...(resumeData.projects || []).map(p => p.description || ''),
  ].join(' ');
  
  // Check for excessive capitalization in descriptions
  const capsCount = (allDescriptions.match(/[A-Z]{3,}/g) || []).length;
  if (capsCount <= 2) score += 1;
  
  // Check for consistent bullet usage
  const bulletCount = (allDescriptions.match(/[•\-\*]\s/g) || []).length;
  const hasBullets = bulletCount > 0;
  if (hasBullets) score += 1;
  
  return {
    score: Math.min(score, maxScore),
    issues: formatIssues,
  };
};

const getGrade = (score) => {
  if (score >= 90) return { grade: 'Excellent', color: '#22c55e' };
  if (score >= 80) return { grade: 'Very Good', color: '#84cc16' };
  if (score >= 70) return { grade: 'Good', color: '#eab308' };
  if (score >= 60) return { grade: 'Fair', color: '#f97316' };
  if (score >= 50) return { grade: 'Needs Work', color: '#ef4444' };
  return { grade: 'Poor', color: '#dc2626' };
};

// ─── Main Scoring Function ─────────────────────────────────────────
const scoreResume = async (resumeData, options = {}) => {
  try {
    // Validate input
    if (!resumeData || typeof resumeData !== 'object') {
      return {
        score: 0,
        grade: 'Invalid',
        gradeColor: '#dc2626',
        breakdown: {},
        suggestions: [{ type: 'error', text: 'Invalid resume data provided' }],
        error: 'Invalid resume data',
      };
    }
    
    const suggestions = [];
    const targetJob = options.jobDescription || null;
    
    // Calculate all section scores
    const contactScore = scoreContactInfo(resumeData.basicInfo, suggestions);
    const summaryScore = scoreSummary(resumeData.summary, suggestions);
    const experienceScore = scoreExperience(resumeData.experience, resumeData.internships, suggestions);
    const educationScore = scoreEducation(resumeData.education, suggestions);
    const skillsScore = scoreSkills(resumeData.skills, suggestions);
    const projectsScore = scoreProjects(resumeData.projects, suggestions);
    const extrasScore = scoreExtras(resumeData.certifications, resumeData.achievements, suggestions);
    
    // Advanced scoring
    const keywordResult = scoreKeywordAnalysis(resumeData, targetJob, suggestions);
    const readabilityResult = scoreReadability(resumeData, suggestions);
    const formatResult = scoreFormatting(resumeData, suggestions);
    
    // Grammar check (async)
    const allText = [
      resumeData.summary || '',
      ...(resumeData.experience || []).map(e => e.description || ''),
      ...(resumeData.projects || []).map(p => p.description || ''),
    ].join(' ');
    const grammarResult = await checkGrammar(allText);
    
    // Job title matching (if job description provided)
    let jobTitleMatch = null;
    if (targetJob) {
      const resumeJobTitle = (resumeData.experience || [])[0]?.jobTitle || null;
      jobTitleMatch = matchJobTitles(resumeJobTitle, targetJob);
      if (!jobTitleMatch.match && jobTitleMatch.score > 0) {
        suggestions.push({ type: 'warning', section: 'jobmatch', text: jobTitleMatch.reason });
      }
    }
    
    // Skill gap analysis (if job description provided)
    let skillGap = null;
    if (targetJob) {
      skillGap = analyzeSkillGaps(resumeData, targetJob);
      if (skillGap.coverage < 50) {
        suggestions.push({ type: 'error', section: 'skillgap', text: `Low skill match (${skillGap.coverage}%). Add missing skills from job description.` });
      }
    }
    
    // Grammar scoring (add to total) - more generous
    const grammarScore = Math.round(grammarResult.score * 0.08); // 8 points max
    
    // Calculate total score
    const totalScore = (
      contactScore +
      summaryScore +
      experienceScore +
      educationScore +
      skillsScore +
      projectsScore +
      extrasScore +
      keywordResult.score +
      readabilityResult.score +
      formatResult.score +
      grammarScore
    );
    
    // Normalize to 100
    const maxPossible = 10 + 15 + 25 + 10 + 20 + 10 + 10 + 15 + 8 + 10 + 5;
    const finalScore = Math.round((totalScore / maxPossible) * 100);
    const normalizedScore = Math.min(100, Math.max(0, finalScore));
    
    const { grade, color: gradeColor } = getGrade(normalizedScore);
    
    // Build breakdown
    const breakdown = {
      contact: { score: contactScore, max: 10 },
      summary: { score: summaryScore, max: 15 },
      experience: { score: experienceScore, max: 25 },
      education: { score: educationScore, max: 10 },
      skills: { score: skillsScore, max: 20 },
      projects: { score: projectsScore, max: 10 },
      extras: { score: extrasScore, max: 10 },
      keywords: { score: keywordResult.score, max: 15 },
      readability: { score: readabilityResult.score, max: 8 },
      formatting: { score: formatResult.score, max: 10 },
      grammar: { score: grammarScore, max: 5 },
      total: { score: totalScore, max: maxPossible },
    };
    
    // Add grammar errors to suggestions if any
    if (grammarResult.totalErrors > 0 && grammarResult.totalErrors <= 5) {
      suggestions.push({ type: 'warning', section: 'grammar', text: `Found ${grammarResult.totalErrors} grammar/spelling issue(s). Review your content.` });
    } else if (grammarResult.totalErrors > 5) {
      suggestions.push({ type: 'error', section: 'grammar', text: `Found ${grammarResult.totalErrors} grammar/spelling issues. Please fix them.` });
    }
    
    // Add positive feedback if score is good
    if (normalizedScore >= 75) {
      suggestions.unshift({ type: 'success', text: `Excellent ATS score of ${normalizedScore}%! Your resume is well-optimized.` });
    }
    
    // Limit suggestions
    const limitedSuggestions = suggestions.slice(0, 12);
    
    return {
      score: normalizedScore,
      grade,
      gradeColor,
      breakdown,
      suggestions: limitedSuggestions,
      keywords: {
        matched: keywordResult.matchedKeywords,
        matchPercentage: keywordResult.matchPercentage,
      },
      readability: {
        score: readabilityResult.readabilityScore,
        grade: readabilityResult.readabilityGrade,
      },
      grammar: {
        score: grammarResult.score,
        errors: grammarResult.totalErrors,
        message: grammarResult.message,
      },
      jobTitleMatch: jobTitleMatch,
      skillGap: skillGap,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    return {
      score: 0,
      grade: 'Error',
      gradeColor: '#dc2626',
      breakdown: {},
      suggestions: [{ type: 'error', text: 'Error calculating ATS score' }],
      error: error.message,
    };
  }
};

// ─── Additional Helper Functions ───────────────────────────────────
const getSuggestionsByPriority = (suggestions) => {
  const priority = { error: 0, warning: 1, info: 2, success: 3 };
  return [...suggestions].sort((a, b) => priority[a.type] - priority[b.type]);
};

const compareWithJobDescription = (resumeData, jobDescription) => {
  return scoreResume(resumeData, { jobDescription });
};

const getIndustryAnalysis = (resumeData) => {
  const allSkillsText = Object.values(resumeData.skills || {}).flat().join(' ').toLowerCase();
  const results = {};
  
  Object.keys(INDUSTRY_KEYWORDS).forEach(industry => {
    let matchScore = 0;
    const matchedKeywords = [];
    
    Object.values(INDUSTRY_KEYWORDS[industry]).flat().forEach(kw => {
      if (allSkillsText.includes(kw.toLowerCase())) {
        matchScore++;
        matchedKeywords.push(kw);
      }
    });
    
    results[industry] = {
      score: matchScore,
      matchedKeywords: matchedKeywords.slice(0, 5),
    };
  });
  
  // Find best fit
  const bestFit = Object.entries(results)
    .sort((a, b) => b[1].score - a[1].score)[0];
  
  return {
    industries: results,
    bestFit: bestFit ? { industry: bestFit[0], ...bestFit[1] } : null,
  };
};

// ─── New Export Functions ───────────────────────────────────────────
const checkGrammarLocal = async (text) => {
  return checkGrammar(text);
};

const analyzeSkills = async (resumeData, jobDescription) => {
  return analyzeSkillGaps(resumeData, jobDescription);
};

const matchTitles = (resumeJobTitle, targetJobTitle) => {
  return matchJobTitles(resumeJobTitle, targetJobTitle);
};

const getSynonymMatches = (resumeSkills, allKeywords) => {
  return findSynonymMatches(resumeSkills, allKeywords);
};

module.exports = {
  scoreResume,
  compareWithJobDescription,
  getIndustryAnalysis,
  getSuggestionsByPriority,
  calculateReadability,
  getReadabilityGrade,
  calculateKeywordDensity,
  checkGrammar: checkGrammarLocal,
  analyzeSkills,
  matchTitles,
  getSynonymMatches,
  INDUSTRY_KEYWORDS,
  SOFT_SKILLS,
  ACTION_VERBS,
  WEAK_WORDS,
  SKILL_SYNONYMS,
  COMMON_TYPOS,
};
