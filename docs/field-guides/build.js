#!/usr/bin/env node
// Builds the branded E3 Compass Field Guide HTML from the Markdown source.
// Single source of truth is the .md; this wraps it in the E3 memo template.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const DIR = __dirname;
const SRC = process.argv[2] || path.join(DIR, 'E3_Compass_Governance_Field_Guide.md');
const OUT = process.argv[3] || SRC.replace(/\.md$/, '.html');
const MODULE_NAME = process.argv[4] || 'Governance';

const b64 = (p) => fs.readFileSync(p).toString('base64');
const ASSETS = path.join(DIR, 'assets');
const montLight = b64(path.join(ASSETS, 'montserrat-latin-300-normal.woff2'));
const montBold = b64(path.join(ASSETS, 'montserrat-latin-800-normal.woff2'));

// Official E3 vector monogram (navy), from e3-brand-assets/logos/svg/e3_monogram_navy.svg
const LOGO_NAVY = `<svg class="e3mark" viewBox="0 0 723 469" fill="#052652" fill-rule="evenodd" role="img" aria-label="E3"><path d="M0 0 C97.68 0 195.36 0 296 0 C296 27.39 296 54.78 296 83 C229.67000000000002 83 163.34 83 95 83 C95 102.14 95 121.28 95 141 C160.34 141 225.68 141 293 141 C293 167.07 293 193.14 293 220 C260.33 219.83499999999998 260.33 219.83499999999998 95 219 C95 238.8 95 258.6 95 279 C161.99 279 228.98000000000002 279 298 279 C298 306.06 298 333.12 298 361 C199.66 361 101.32 361 0 361 C0 241.87 0 122.73999999999998 0 0 Z" transform="translate(44.0,44.0)"/><path d="M0 0 C98.34000000000003 0 196.68000000000006 0 298 0 C288.9004616272356 17.061634448933187 288.9004616272356 17.061634448933187 285 23.6875 C284.05648044501424 25.304214341264974 283.11382835343056 26.92143513504435 282.171875 28.5390625 C281.66720703125 29.405634765625 281.16253906249995 30.27220703125 280.642578125 31.1650390625 C277.48466783925164 36.61534438921065 274.37049899528256 42.090721788648224 271.25 47.5625 C265.4125806364001 57.79407589486089 259.54228867949155 68.00604672522928 253.647705078125 78.204833984375 C249.39176395716618 85.57365378601932 245.16417455560418 92.95828299166836 240.94927978515625 100.35061645507813 C235.382926323957 110.11246990547647 229.78450939369975 119.85437245668236 224.125 129.5625 C223.53581787109374 130.5739306640625 222.94663574218748 131.585361328125 222.339599609375 132.62744140625 C220.28848413030653 136.1376354688696 218.25566870578177 139.6164969413273 216 143 C216.8030859375 143.0825 217.60617187499997 143.165 218.43359375 143.25 C223.00037687340898 144.21037498323605 226.8695363883685 145.98892186698646 231.0625 148 C231.4820495605469 148.200771484375 231.4820495605469 148.200771484375 233.605224609375 149.216796875 C258.9889523054112 161.67423353164406 278.44630096523315 183.38403724564958 288 210 C298.09894162061323 241.16340071047307 295.23250790267844 274.24821991391264 280.95703125 303.64794921875 C270.76712378735954 323.44377576508 254.7874483475896 341.9739685027792 236 354 C235.46503906249995 354.352236328125 234.93007812500002 354.70447265625 234.37890625 355.0673828125 C196.24512909121268 380.0359273807536 147.55164819322266 385.2782434238235 103.470703125 376.49609375 C69.9107681070135 369.28751582250885 37.53828251288752 349.9562512640685 18.37890625 320.953125 C6.970362243880913 302.5967348942811 1.673165991669407 284.38532793335503 -1 263 C25.730000000000018 262.67 52.45999999999998 262.34 80 262 C82.31 266.95 84.62 271.9 87 277 C95.90743477218501 290.87223448127173 107.92106855394888 299.935815116322 124 304 C141.3647369448205 307.5393094409825 158.18840885139343 306.66097604707255 174 298 C174.925546875 297.4959765625 175.85109375000002 296.991953125 176.8046875 296.47265625 C189.59485305174906 288.9438191869898 198.23432809427914 277.4124734783949 202.16796875 263.08203125 C205.33853191491892 249.30819189817717 202.98431772469849 235.25573254303248 195.75 223.1875 C186.43209095866598 209.6144781617777 174.05980424115455 202.3508139272251 158 199 C152.50459126014874 198.46007065851757 147.05676761178006 198.39377910491186 141.5390625 198.390625 C140.01205735847822 198.37559939084517 138.48506819805624 198.35886329071425 136.95809936523438 198.34051513671875 C132.9896967051589 198.29731961002923 129.0215129612368 198.27695048760924 125.05291748046875 198.26177978515625 C120.98306582050657 198.24203365351963 116.91344482557417 198.20008512072562 112.84375 198.16015625 C104.89589455465733 198.0853738728486 96.94813088317483 198.0347704912411 89 198 C90.31713424268673 194.620390851211 91.7178146989242 191.6574721394916 93.6953125 188.61328125 C93.96666015624999 188.192080078125 93.96666015624999 188.192080078125 95.33984375 186.060546875 C95.92894531249999 185.15369140625 96.51804687499998 184.2468359375 97.125 183.3125 C102.51577712986398 174.93372427310283 107.79964377981366 166.49823561769293 113 158 C118.50738051411457 149.01190739244092 124.09401613174873 140.08156371970645 129.7724609375 131.20068359375 C136.59822313327413 120.51916216103456 143.29296823128544 109.75629783654847 150 99 C153.3 93.72 156.60000000000002 88.44 160 83 C107.19999999999999 83 54.39999999999998 83 0 83 C0 55.61 0 28.22 0 0 Z" transform="translate(381.0,44.0)"/></svg>`;

const raw = fs.readFileSync(SRC, 'utf8');

// Split front matter (cover) from body at the first numbered section.
const splitAt = raw.indexOf('\n## 1.');
const front = raw.slice(0, splitAt);
const bodyMd = raw.slice(splitAt + 1);

// Pull the italic standfirst (the operating-question subtitle) and intro note from the front matter.
const subtitleMatch = front.match(/\*Who decides[^*]*\*/);
const coverSubtitle = subtitleMatch ? subtitleMatch[0].replace(/^\*|\*$/g, '') : '';
const introMatch = front.match(/\*This guide reflects[^*]*\*/);
const coverNote = introMatch ? introMatch[0].replace(/^\*|\*$/g, '') : '';

marked.setOptions({ gfm: true, breaks: false });
let bodyHtml = marked.parse(bodyMd);
// Drop the horizontal rules between sections; page breaks come from CSS on h2.
bodyHtml = bodyHtml.replace(/<hr>\s*/g, '');
// Tag the closing colophon paragraph (the final italic block) for styling.
bodyHtml = bodyHtml.replace(/<p><em>E3 Compass Field Guide\.([\s\S]*?)<\/em><\/p>/,
  '<p class="colophon"><em>E3 Compass Field Guide.$1</em></p>');

const CSS = `
:root{
  --navy:#052652; --navy-600:#041F43; --navy-400:#5A708D;
  --ink:#141C2C; --ink-soft:#374154; --muted:#6B768A;
  --line:#E2E6EC; --line-soft:#F1F3F6; --paper:#ffffff;
  --gold:#9A6E12; --rule:#052652;
}
@font-face{font-family:"Gilroy";font-weight:300;font-style:normal;font-display:swap;
  src:local("Gilroy Light"),local("Gilroy-Light"),local("Gilroy"),url("assets/Gilroy-Light.otf") format("opentype");}
@font-face{font-family:"Gilroy";font-weight:800;font-style:normal;font-display:swap;
  src:local("Gilroy ExtraBold"),local("Gilroy-ExtraBold"),url("assets/Gilroy-ExtraBold.otf") format("opentype");}
@font-face{font-family:"E3 Sans";font-weight:300;font-style:normal;font-display:swap;
  src:url(data:font/woff2;base64,${montLight}) format("woff2");}
@font-face{font-family:"E3 Sans";font-weight:800;font-style:normal;font-display:swap;
  src:url(data:font/woff2;base64,${montBold}) format("woff2");}

*{box-sizing:border-box;}
html{-webkit-text-size-adjust:100%;}
body{
  margin:0; background:var(--paper); color:var(--ink);
  font-family:"Gilroy","E3 Sans","Segoe UI",system-ui,sans-serif; font-weight:300;
  font-size:11pt; line-height:1.62; -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.doc{max-width:44rem;margin:0 auto;padding:56px 40px 96px;}

h1,h2,h3,h4{font-family:"Gilroy","E3 Sans","Segoe UI",system-ui,sans-serif;font-weight:800;color:var(--navy);
  line-height:1.12;letter-spacing:-0.01em;text-wrap:balance;}
h2{font-size:22pt;margin:0 0 14px;padding-bottom:0;}
h3{font-size:13.5pt;margin:26px 0 6px;color:var(--navy);letter-spacing:0;}
h4{font-size:8.6pt;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-400);margin:20px 0 6px;font-weight:800;}
p{margin:0 0 12px;}
strong{font-weight:800;color:var(--navy-600);}
em{font-style:italic;}
a{color:var(--navy);text-decoration:none;border-bottom:1px solid var(--line);}

/* Section numbering: each numbered section (h2) opens a new page in print. */
main h2{break-before:page;page-break-before:always;
  padding-top:6px;border-top:2px solid var(--rule);}
main > h2:first-of-type{break-before:auto;page-break-before:auto;}
section.lead h2{border-top:none;padding-top:0;}

/* The section number sits in the heading text already (e.g. "2. The E3 Point of View"). */

ul,ol{margin:0 0 14px;padding-left:1.1rem;}
li{margin:0 0 5px;padding-left:.2rem;}
li::marker{color:var(--navy-400);}

blockquote{margin:18px 0;padding:14px 18px;background:var(--line-soft);
  border-left:3px solid var(--navy);color:var(--ink-soft);}
blockquote p{margin:0;}
blockquote strong{color:var(--navy);}

/* Pull the CEO-question line and the two big statements to memo weight */
main section p:first-of-type{ }

table{width:100%;border-collapse:collapse;margin:16px 0 20px;font-size:9.6pt;line-height:1.45;}
th{font-family:"Gilroy","E3 Sans",sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.06em;
  font-size:7.8pt;color:var(--navy);text-align:left;vertical-align:bottom;
  padding:0 12px 7px 0;border-bottom:1.5px solid var(--navy);}
td{padding:9px 12px 9px 0;vertical-align:top;border-bottom:1px solid var(--line);color:var(--ink-soft);}
th:last-child,td:last-child{padding-right:0;}
tbody tr:last-child td{border-bottom:1px solid var(--line);}

code{font-family:"SFMono-Regular",Menlo,Consolas,monospace;font-size:8.4pt;color:var(--navy-600);
  background:var(--line-soft);padding:1px 5px;border-radius:2px;
  white-space:normal;overflow-wrap:anywhere;word-break:break-word;}
td code{background:transparent;padding:0;font-size:8pt;}

/* Play subtitle line renders as a p > em right under an h3 */
h3 + p em{color:var(--muted);font-style:normal;font-size:8.8pt;letter-spacing:.02em;}
h3 + p{margin-top:0;margin-bottom:12px;}

.colophon{margin-top:28px;padding-top:14px;border-top:1px solid var(--line);
  font-size:8.8pt;color:var(--muted);line-height:1.5;}
.colophon em{font-style:normal;}

/* ---- Cover ---- */
.cover{min-height:80vh;display:flex;flex-direction:column;padding-bottom:40px;}
.cover .e3mark{width:82px;height:auto;display:block;}
.cover .eyebrow{margin-top:44px;font-family:"Gilroy","E3 Sans",sans-serif;font-weight:800;
  font-size:10pt;letter-spacing:.34em;text-transform:uppercase;color:var(--navy-400);}
.cover h1{font-size:52pt;line-height:.98;margin:10px 0 0;color:var(--navy);}
.cover .role{margin-top:18px;font-family:"Gilroy","E3 Sans",sans-serif;font-weight:800;
  font-size:12pt;letter-spacing:.02em;color:var(--ink);}
.cover .rule{width:64px;height:3px;background:var(--navy);margin:30px 0;}
.cover .subtitle{font-size:15pt;line-height:1.32;color:var(--ink);max-width:32rem;font-style:italic;font-weight:300;}
.cover .note{margin-top:auto;font-size:9pt;line-height:1.5;color:var(--muted);max-width:33rem;padding-top:40px;}
.cover .metabar{margin-top:18px;display:flex;gap:22px;flex-wrap:wrap;
  font-family:"Gilroy","E3 Sans",sans-serif;font-weight:800;font-size:7.8pt;letter-spacing:.16em;
  text-transform:uppercase;color:var(--navy-400);border-top:1px solid var(--line);padding-top:14px;}
.tagline{font-family:"Gilroy","E3 Sans",sans-serif;font-weight:800;font-size:7.8pt;letter-spacing:.24em;
  text-transform:uppercase;color:var(--navy-400);margin-top:6px;}

@media print{
  .doc{max-width:none;margin:0;padding:0;}
  .cover{min-height:auto;height:9.0in;break-after:page;page-break-after:always;padding-bottom:0;}
  body{font-size:10.5pt;}
  h2{font-size:20pt;}
  a{border-bottom:none;color:var(--navy);}
  tr,td,th{break-inside:avoid;}
  h2,h3,h4{break-after:avoid;page-break-after:avoid;}
  table,blockquote,figure{break-inside:avoid;}
  p{orphans:2;widows:2;}
}
@media screen{
  body{background:#f4f5f7;}
  .doc{background:#fff;margin:24px auto;box-shadow:0 1px 3px rgba(5,38,82,.08),0 8px 40px rgba(5,38,82,.06);
    border-radius:2px;}
}
`;

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>E3 Compass — ${MODULE_NAME} Field Guide</title>
<style>${CSS}</style>
</head>
<body>
<div class="doc">
  <section class="cover">
    ${LOGO_NAVY}
    <div class="eyebrow">E3 Compass</div>
    <h1>${MODULE_NAME}</h1>
    <div class="role">Field Guide for Lead Operating Partners</div>
    <div class="rule"></div>
    <div class="subtitle">${coverSubtitle}</div>
    <div class="note">${coverNote}</div>
    <div class="metabar"><span>Internal &middot; E3</span><span>Compass Knowledge</span><span>Governance</span></div>
    <div class="tagline">Envision &middot; Execute &middot; Expand</div>
  </section>
  <main>
${bodyHtml}
  </main>
</div>
</body></html>`;

fs.writeFileSync(OUT, html);
console.log('Wrote', OUT, '(' + Math.round(html.length / 1024) + ' KB)');
