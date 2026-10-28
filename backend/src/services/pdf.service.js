const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

/**
 * generatePDF
 * ───────────
 * Renders HTML with Puppeteer and returns a PDF buffer.
 *
 * IMPORTANT: When called with htmlContent from buildPreviewHTML() the HTML
 * already contains @page { size: A4; margin: 0 } and each .preview-page is
 * exactly 297mm tall. Puppeteer must use ZERO margins so it doesn't add extra
 * whitespace that pushes content and creates phantom extra pages.
 *
 * When called without htmlContent (legacy buildResumeHTML path) the PDF uses
 * default margins from the options parameter.
 */
const generatePDF = async (htmlContent, options = {}) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });

    const page = await browser.newPage();

    // CRITICAL: viewport must be exactly 794px wide — same as live preview.
    // This ensures text wraps at identical breakpoints so PDF layout matches screen.
    // height=1123 = 297mm at 96dpi (one A4 page).
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Wait for fonts to load fully
    await page.evaluate(() => new Promise((resolve) => {
      if (document.fonts) {
        document.fonts.ready.then(resolve);
      } else {
        setTimeout(resolve, 1000);
      }
    }));

    // Extra settle for CSS grid/flexbox layout
    await new Promise(r => setTimeout(r, 300));

    const pdf = await page.pdf({
      // Use pixel dimensions instead of 'A4' format to exactly match
      // the 794×1123px live preview page size — avoids any mm→px rounding.
      width: '794px',
      height: '1123px',
      printBackground: true,
      margin: {
        top:    options.marginTop    ?? '0px',
        right:  options.marginRight  ?? '0px',
        bottom: options.marginBottom ?? '0px',
        left:   options.marginLeft   ?? '0px',
      },
      preferCSSPageSize: true,
    });

    return pdf;
  } catch (error) {
    logger.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  } finally {
    if (browser) await browser.close();
  }
};

// ─── Legacy HTML builder (used when htmlContent is NOT sent from frontend) ───
const buildResumeHTML = (resumeData, templateId = 'modern-01', templateMeta = null) => {
  const template = getTemplateStyles(templateId, templateMeta);
  const bodyContent = buildResumeBody(resumeData, template);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${resumeData.basicInfo?.fullName || 'Resume'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=${template.fontFamily}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: '${template.bodyFont}', Georgia, serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
    }
    :root {
      --tpl-primary: ${template.primary};
      --tpl-accent:  ${template.accent};
      --tpl-font:    '${template.bodyFont}';
    }
    ${template.css}
    @page { size: A4; margin: 10mm; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
};

const buildResumeBody = (data, template) => {
  const info = data.basicInfo || {};
  const sections = {};

  const sectionHeader = (title) => `
    <h2 class="tpl-section-title">${title}</h2>
    <div class="tpl-divider"></div>`;

  const contactHTML = (info) => [
    info.email    && `<span>✉ ${info.email}</span>`,
    info.phone    && `<span>📞 ${info.phone}</span>`,
    info.linkedin && `<span>🔗 ${info.linkedin}</span>`,
    info.github   && `<span>🐙 ${info.github}</span>`,
    info.portfolio && `<span>🌐 ${info.portfolio}</span>`,
  ].filter(Boolean).join('');

  const headerClassic = `
    <header class="tpl-header">
      <div class="tpl-name">${info.fullName || ''}</div>
      <div class="tpl-contact">${contactHTML(info)}</div>
    </header>`;

  const headerMinimal = `
    <header class="tpl-header tpl-header--minimal">
      <div class="tpl-name">${info.fullName || ''}</div>
      <div class="tpl-contact">${contactHTML(info)}</div>
    </header>`;

  const headerCompact = `
    <header class="tpl-header tpl-header--compact">
      <div class="tpl-name">${info.fullName || ''}</div>
      <div class="tpl-contact">${contactHTML(info)}</div>
    </header>`;

  if (data.summary) {
    sections.summary = `
      <section class="tpl-section">
        ${sectionHeader('Professional Summary')}
        <p class="tpl-summary">${data.summary}</p>
      </section>`;
  }

  const experiences = data.experience || [];
  if (experiences.length > 0) {
    const items = experiences.map(exp => `
      <div class="tpl-entry">
        <div class="tpl-entry-header">
          <div>
            <strong class="tpl-job-title">${exp.jobTitle || ''}</strong>
            <span class="tpl-company"> · ${exp.company || ''}</span>
          </div>
          <span class="tpl-date">${exp.startDate || ''} – ${exp.currentlyWorking ? 'Present' : (exp.endDate || '')}</span>
        </div>
        <div class="tpl-desc">${formatBullets(exp.description)}</div>
      </div>`).join('');
    sections.experience = `
      <section class="tpl-section">
        ${sectionHeader('Work Experience')}${items}
      </section>`;
  }

  const internships = data.internships || [];
  if (internships.length > 0) {
    const items = internships.map(i => `
      <div class="tpl-entry">
        <div class="tpl-entry-header">
          <div>
            <strong class="tpl-job-title">${i.role || ''}</strong>
            <span class="tpl-company"> · ${i.company || ''}</span>
          </div>
          <span class="tpl-date">${i.startDate || ''} – ${i.endDate || ''}</span>
        </div>
        <div class="tpl-desc">${formatBullets(i.description)}</div>
      </div>`).join('');
    sections.internships = `
      <section class="tpl-section">
        ${sectionHeader('Internship Experience')}${items}
      </section>`;
  }

  const education = data.education || [];
  if (education.length > 0) {
    const items = education.map(edu => `
      <div class="tpl-entry">
        <div class="tpl-entry-header">
          <div>
            <strong>${edu.college || ''}</strong>
            <span class="tpl-company"> · ${edu.degree || ''}</span>
          </div>
          <div style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap;margin-left:12px">
            ${edu.year ? `<span class="tpl-date">${edu.year}</span>` : ''}
            ${edu.cgpa ? `<span class="tpl-cgpa">CGPA: ${edu.cgpa}</span>` : ''}
          </div>
        </div>
      </div>`).join('');
    sections.education = `
      <section class="tpl-section">
        ${sectionHeader('Education')}${items}
      </section>`;
  }

  const projects = data.projects || [];
  if (projects.length > 0) {
    const items = projects.map(p => `
      <div class="tpl-entry">
        <div class="tpl-project-header">
          <strong class="tpl-job-title">${p.title || ''}</strong>
          ${p.startDate || p.currentlyWorking ? `<span class="tpl-date">${p.startDate || ''} – ${p.currentlyWorking ? 'Currently Doing' : (p.endDate || '')}</span>` : ''}
          ${p.techStack?.length ? `<div class="tpl-tech-stack">${p.techStack.map(t => `<span class="tpl-tech-badge">${t}</span>`).join('')}</div>` : ''}
        </div>
        <div class="tpl-desc">${formatBullets(p.description)}</div>
      </div>`).join('');
    sections.projects = `
      <section class="tpl-section">
        ${sectionHeader('Projects')}${items}
      </section>`;
  }

  const skills = data.skills || {};
  const skillEntries = Object.entries(skills).filter(([, v]) => v?.length > 0);
  if (skillEntries.length > 0) {
    const rows = skillEntries.map(([cat, vals]) => `
      <div class="tpl-skill-row">
        <span class="tpl-skill-cat">${capitalize(cat)}:</span>
        <span class="tpl-skill-vals">${vals.join(' | ')}</span>
      </div>`).join('');
    sections.skills = `
      <section class="tpl-section">
        ${sectionHeader('Skills')}
        <div class="tpl-skills">${rows}</div>
      </section>`;
  }

  const certs = data.certifications || [];
  if (certs.length > 0) {
    const items = certs.map(c => `
      <div class="tpl-cert-entry">
        <strong>${c.name || ''}</strong>
        <span class="tpl-company">${c.organization ? ` · ${c.organization}` : ''}</span>
        ${c.year ? `<span class="tpl-date" style="margin-left:8px">(${c.year})</span>` : ''}
      </div>`).join('');
    sections.certifications = `
      <section class="tpl-section">
        ${sectionHeader('Certifications')}${items}
      </section>`;
  }

  const achievements = data.achievements || [];
  if (achievements.length > 0) {
    const items = achievements.map(a => `<li>${a.text || a}</li>`).join('');
    sections.achievements = `
      <section class="tpl-section">
        ${sectionHeader('Achievements')}
        <ul class="preview-bullets">${items}</ul>
      </section>`;
  }

  const sideSections = [
    sections.education, sections.skills, sections.certifications, sections.achievements,
  ].filter(Boolean).join('');

  if (template.layout === 'columns') {
    return `
      ${headerCompact}
      ${sections.summary || ''}
      <div class="tpl-columns">
        <div>${[sections.experience, sections.internships, sections.projects].filter(Boolean).join('')}</div>
        <div>${sideSections}</div>
      </div>`;
  }

  if (template.layout === 'sidebar') {
    const mainSections = [sections.summary, sections.experience, sections.internships, sections.projects, sections.education]
      .filter(Boolean).join('');
    return `
      <div class="tpl-layout-grid">
        <aside class="tpl-side">
          <div class="tpl-side-header">
            <div class="tpl-side-name">${info.fullName || ''}</div>
            <div class="tpl-side-contact">${contactHTML(info).replace(/<span>/g, '<span>').split('</span>').join('</span>\n')}</div>
          </div>
          ${[sections.skills, sections.certifications, sections.achievements].filter(Boolean).join('')}
        </aside>
        <main class="tpl-main">${mainSections}</main>
      </div>`;
  }

  // classic / minimal
  const mainSections = [
    sections.summary, sections.experience, sections.internships,
    sections.education, sections.projects,
  ].filter(Boolean).join('');

  return [
    template.layout === 'minimal' ? headerMinimal : headerClassic,
    mainSections,
    sideSections,
  ].filter(Boolean).join('');
};

const formatBullets = (text) => {
  if (!text) return '';
  if (text.includes('*') || text.includes('\n')) {
    const lines = text.split('\n').filter(l => l.trim());
    return `<ul class="preview-bullets">${lines.map(l =>
      `<li>${l.replace(/^[*\-]\s*/, '')}</li>`
    ).join('')}</ul>`;
  }
  return `<p>${text}</p>`;
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const getTemplateStyles = (templateId, templateMeta) => {
  if (templateMeta) {
    return {
      fontFamily: templateMeta.font || 'Inter',
      bodyFont:   templateMeta.font || 'Inter',
      layout:     templateMeta.layout || 'classic',
      primary:    templateMeta.primaryColor || '#1e3a5f',
      accent:     templateMeta.accentColor  || '#3b82f6',
      css:        buildPdfCSS(templateMeta.primaryColor, templateMeta.accentColor),
    };
  }
  const templates = {
    'modern-01': { fontFamily:'Inter',  bodyFont:'Inter',  layout:'classic', primary:'#1e3a5f', accent:'#3b82f6' },
    'minimal-01':{ fontFamily:'Lato',   bodyFont:'Lato',   layout:'minimal', primary:'#111827', accent:'#6b7280' },
  };
  const t = templates[templateId] || templates['modern-01'];
  return { ...t, css: buildPdfCSS(t.primary, t.accent) };
};

const buildPdfCSS = (primary = '#1e3a5f', accent = '#3b82f6') => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; font-size: 10pt; line-height: 1.5; color: #1a1a1a; background: white; width: 210mm; }
  :root { --tpl-primary: ${primary}; --tpl-accent: ${accent}; }
  .tpl-header { background: var(--tpl-primary); color: white; padding: 18px 20px; }
  .tpl-header--compact { background: var(--tpl-primary); padding: 16px 20px; }
  .tpl-header--minimal { background: white; color: #111; border-bottom: 1px solid rgba(0,0,0,0.08); padding: 14px 20px 10px; }
  .tpl-name { font-size: 22pt; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 6px; font-family: 'Syne', sans-serif; }
  .tpl-contact { display: flex; flex-wrap: wrap; gap: 10px; font-size: 9pt; opacity: 0.9; }
  .tpl-section { padding: 6px 20px 1px; }
  .tpl-section-title { font-size: 10pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--tpl-primary); font-family: 'Syne', sans-serif; margin-bottom: 4px; }
  .tpl-divider { height: 2px; background: var(--tpl-primary); width: 32px; margin-bottom: 10px; border-radius: 1px; }
  .tpl-entry { margin-bottom: 10px; }
  .tpl-entry-header { display: grid; grid-template-columns: minmax(0,1fr) auto; column-gap: 10px; align-items: baseline; margin-bottom: 4px; }
  .tpl-job-title { font-weight: 700; font-size: 10.5pt; }
  .tpl-company { color: #555; font-size: 10pt; }
  .tpl-date { font-size: 9pt; color: #777; white-space: nowrap; margin-left: 8px; }
  .tpl-cgpa { font-size: 9pt; color: #555; }
  .tpl-summary { font-size: 10pt; color: #333; line-height: 1.6; }
  .tpl-cert-entry { margin-bottom: 6px; font-size: 10pt; }
  .preview-bullets { margin: 2px 0 2px 14px; padding: 0; list-style: none; }
  .preview-bullets li { position: relative; padding-left: 12px; font-size: 9.5pt; margin-bottom: 3px; color: #222; line-height: 1.5; }
  .preview-bullets li::before { content: '*'; position: absolute; left: 0; color: var(--tpl-accent); font-weight: 700; }
  .tpl-project-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px; }
  .tpl-tech-stack { display: flex; flex-wrap: wrap; gap: 4px; }
  .tpl-tech-badge { padding: 1px 6px; border-radius: 10px; background: rgba(15,76,129,0.08); color: var(--tpl-primary); font-size: 8pt; font-weight: 600; }
  .tpl-skills { display: flex; flex-direction: column; gap: 4px; }
  .tpl-skill-row { display: flex; align-items: baseline; gap: 8px; }
  .tpl-skill-cat { font-weight: 700; font-size: 9pt; color: var(--tpl-primary); min-width: 72px; text-transform: capitalize; flex-shrink: 0; }
  .tpl-skill-vals { font-size: 9.5pt; color: #333; line-height: 1.5; }
  .tpl-columns { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px; padding: 4px 0 10px; }
  .tpl-layout-grid { display: grid; grid-template-columns: 190px 1fr; min-height: 277mm; }
  .tpl-side { background: #f0f4f8; border-right: 1px solid #e5e7eb; padding: 16px 14px; display: flex; flex-direction: column; gap: 12px; }
  .tpl-side-header { padding-bottom: 8px; border-bottom: 2px solid var(--tpl-primary); }
  .tpl-side-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14pt; margin-bottom: 6px; color: var(--tpl-primary); }
  .tpl-side-contact { display: flex; flex-direction: column; gap: 6px; font-size: 9pt; color: #333; }
  .tpl-main { padding: 6px 0; }
  .tpl-edu-meta { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; margin-left: 12px; }
  .page-break { page-break-before: always; }
`;

module.exports = { generatePDF, buildResumeHTML };