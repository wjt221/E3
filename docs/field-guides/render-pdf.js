#!/usr/bin/env node
// Renders a Field Guide HTML to a print-ready PDF (US Letter) using the
// pre-installed Chromium via playwright-core. Selectable text, page numbers,
// restrained footer, working internal references.
const path = require('path');
const { chromium } = require('playwright-core');

const HTML = process.argv[2] || path.join(__dirname, 'E3_Compass_Governance_Field_Guide.html');
const PDF = process.argv[3] || HTML.replace(/\.html$/, '.pdf');
const FOOTER_LEFT = process.argv[4] || 'E3 Compass · Governance Field Guide';
const EXEC = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + HTML, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const footer = `
    <div style="width:100%;font-family:Arial,sans-serif;font-size:7pt;color:#6B768A;
      padding:0 0.85in;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;">
      <span>${FOOTER_LEFT}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`;
  const emptyHeader = '<span></span>';

  await page.pdf({
    path: PDF,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: emptyHeader,
    footerTemplate: footer,
    margin: { top: '0.7in', bottom: '0.7in', left: '0.85in', right: '0.85in' },
  });
  await browser.close();
  console.log('Wrote', PDF);
})().catch((e) => { console.error(e); process.exit(1); });
