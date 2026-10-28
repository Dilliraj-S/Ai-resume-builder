/**
 * buildPreviewHTML
 * ────────────────
 * Gets pages from the preview for PDF generation.
 * IMPORTANT: Only gets visible pages from .preview-page-scaler wrappers,
 * NOT the hidden measure container pages.
 */
export function buildPreviewHTML(fontSize = 11, fontFamily = 'Inter') {
  // Get expected page count from UI label (e.g., "Page 1 of 2" or "1 Page")
  const wrapper = document.querySelector('.preview-wrapper');
  let expectedPages = 1;
  if (wrapper) {
    const pageText = wrapper.textContent || '';
    // Match "Page X of Y" or just "Y Page" 
    let match = pageText.match(/of\s+(\d+)/);
    if (!match) match = pageText.match(/^(\d+)\s+Page/i);
    if (match) expectedPages = parseInt(match[1], 10);
  }

  // APPROACH: Query .preview-page-scaler elements (visible pages only)
  // The hidden measure container does NOT have this wrapper
  const scalers = document.querySelectorAll('.preview-page-scaler');
  let finalPages = [];
  
  scalers.forEach((scaler) => {
    const page = scaler.querySelector('.preview-page');
    if (page) {
      finalPages.push(page);
    }
  });

  // FALLBACK: If no scalers found, try filtering all pages
  if (finalPages.length === 0) {
    const allPages = document.querySelectorAll('.preview-page');
    finalPages = Array.from(allPages).filter(page => {
      // Skip pages in hidden measure containers
      if (page.closest('[data-measure="true"]')) return false;
      return true;
    });
  }

  // CRITICAL: Limit to exactly expectedPages from the UI
  // This ensures PDF matches the preview
  if (expectedPages > 0 && finalPages.length > expectedPages) {
    finalPages = finalPages.slice(0, expectedPages);
  }

  if (!finalPages.length) {
    return null;
  }

  const pagesHTML = finalPages.map(p => p.outerHTML).join('\n');

  const styleText = collectStyles();

  const fontsLink = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Inter:wght@300;400;500;600;700&family=Lato:wght@300;400;700&family=Nunito:wght@300;400;600;700&family=Poppins:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&family=Playfair+Display:wght@400;600;700&family=Cormorant:wght@400;600;700&family=DM+Mono:wght@400;500&family=Fira+Code:wght@400;600&family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  `;

  // Serialize only the visible pages (limited to expected count)

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${fontsLink}
    <style>
      /* ── Reset ─────────────────────────────────────────────────────── */
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        width: 210mm !important;
        height: auto !important;
      }

      /* ── PDF page setup ─────────────────────────────────────────────── */
      @page {
        size: A4;
        margin: 0;
      }

      /* ── Hide UI chrome ─────────────────────────────────────────────── */
      .preview-wrapper  { padding: 0 !important; }
      .preview-label    { display: none !important; }
      .preview-edit-btn { display: none !important; }

      /* ── Each .preview-page = exactly one PDF page ──────────────────── */
      .preview-page {
        width: 794px !important;    /* match live preview fixed width */
        height: 1123px !important;  /* match live preview fixed height (297mm@96dpi) */
        max-height: 1123px !important;
        min-height: 1123px !important;
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: hidden !important;
        display: block !important;
        position: relative !important;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .preview-page + .preview-page {
        page-break-before: always;
        break-before: page;
      }

      .page-body {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: 1123px !important;
        overflow: hidden !important;
        font-family: '${fontFamily}', sans-serif !important;
        font-size: ${fontSize}px !important;
      }

      /* ── PDF spacing must EXACTLY match live preview ────────────────── */
      /* Do NOT override tpl-section padding — let collected styles handle it */
      /* Only reset UI-only styles that don't belong in PDF */
      .preview-editable    { box-shadow: none !important; outline: none !important; }
      .preview-page-scaler { transform: none !important; width: 794px !important; height: 1123px !important; }

      /* ── Collected live styles ──────────────────────────────────────── */
      ${styleText}
    </style>
  </head>
  <body>
    ${pagesHTML}
  </body>
</html>`;
}

/**
 * collectStyles
 * Reads all CSSOM rules from same-origin stylesheets.
 * Cross-origin sheets (e.g. Google Fonts) are silently skipped.
 */
function collectStyles() {
  let css = '';
  const sheets = Array.from(document.styleSheets || []);
  sheets.forEach(sheet => {
    try {
      const rules = sheet.cssRules || sheet.rules;
      if (!rules) return;
      for (const rule of rules) {
        css += `${rule.cssText}\n`;
      }
    } catch {
      // CORS-protected stylesheet — skip
    }
  });
  return css;
}