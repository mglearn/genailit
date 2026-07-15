/* gen-site.js — generate all non-activity pages of the Gen AI Literacy suite
   from the baked locales + a small standards-alignment map. Deterministic, so
   the site stays consistent as content changes. Produces:
     index.html                         suite landing (free cards + locked MORE)
     library.html                       searchable activity library
     correlation.html                   TEKS correlation guide (per band)
     guide.html                         suite curriculum guide
     grade35/index.html grade68/index.html   band hubs
     grade35/policy.html grade68/policy.html privacy/compliance
     grade35/implementation.html grade68/implementation.html  band implementation plans
     grade{band}/ai-gradeN.html         per-activity teacher launch pages (NO answers)
   Run:  node scripts/gen-site.js
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { SITE_URL, SUITE_EN } = require('./config');

// Gen AI suite palette — indigo primary, cyan accent, violet/teal locks.
const PALETTE = ':root{--navy:#4338ca;--navy-d:#312e81;--red:#c1121f;--red-d:#8b0d16;--gold:#06b6d4;--gold-d:#0e7490;--paper:#f5f6ff;--ink:#14203a;--ink-soft:#4b5a78;--card:#fff;--line:#e0e7ff;--good:#2f9e44;--bad:#e03131;--c1:#4338ca;--c2:#7c3aed;--c3:#0891b2;--c4:#06b6d4;--c5:#6d28d9;--bg-a:rgba(6,182,212,.12);--bg-b:rgba(67,56,202,.10)}';
const THEME_COLOR = '#4338ca';
const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// grade -> {band, icon, teks, tier}. FOCUS[grade] = [[focus, substrand] x4] aligned to L1..L4 order.
const META = {
  3: { band: 'grade35', icon: '🤖', teks: '§126.8', tier: 'free' },
  4: { band: 'grade35', icon: '🗑️', teks: '§126.9', tier: 'free' },
  5: { band: 'grade35', icon: '🧪', teks: '§126.10', tier: 'free' },
  6: { band: 'grade68', icon: '🖼️', teks: '§126.17', tier: 'paid' },
  7: { band: 'grade68', icon: '⚖️', teks: '§126.18', tier: 'paid' },
  8: { band: 'grade68', icon: '🛠️', teks: '§126.19', tier: 'paid' },
};
const FOCUS = {
  3: [['What an AI actually does (pattern-guessing)', '(c)(1)'], ['Learning from examples called data', '(c)(5)'], ['Verifying an AI answer', '(c)(12)'], ['Using an AI helper well', '(c)(11)']],
  4: [['One-sided data leads to wrong guesses', '(c)(6)'], ['Naming the examples an AI learns from (data)', '(c)(5)'], ['Improving fairness with better data', '(c)(6)'], ['Fixing an AI hallucination against a source', '(c)(11)']],
  5: [['Why clear, specific prompts work', '(c)(2)'], ['The parts of a strong prompt', '(c)(2)'], ['Habits of a smart prompt writer', '(c)(11)'], ['Refining a prompt and verifying facts', '(c)(3)']],
  6: [['What "AI-generated" media means', '(c)(4)'], ['Spotting the signs of a fake', '(c)(7)'], ['Naming a hallucination', '(c)(2)'], ['Verifying before you share', '(c)(7)']],
  7: [['Where AI bias begins', '(c)(5)'], ['Sources of bias in an AI', '(c)(6)'], ['Naming a stereotype', '(c)(4)'], ['Evaluating a one-sided answer', '(c)(6)']],
  8: [['The responsible move when creating with AI', '(c)(12)'], ['Responsible habits with AI tools', '(c)(11)'], ['Disclosing that AI helped', '(c)(3)'], ['A responsible create-with-AI process', '(c)(3)']],
};
const SUBSTRANDS = {
  '(c)(1)': 'Computational Thinking — Foundations',
  '(c)(2)': 'Computational Thinking — Applications',
  '(c)(3)': 'Creativity & Innovation — Innovative Design',
  '(c)(4)': 'Creativity & Innovation — Emerging Technologies',
  '(c)(5)': 'Data Literacy — Collect Data',
  '(c)(6)': 'Data Literacy — Analyze Data',
  '(c)(7)': 'Data Literacy — Communicate Results',
  '(c)(11)': 'Practical Technology Concepts — Processes',
  '(c)(12)': 'Practical Technology Concepts — Skills & Tools',
};
const STRAND_SUMMARY = 'Computational Thinking; Creativity &amp; Innovation; Data Literacy; and Practical Technology Concepts';

function loadBreakout(grade) {
  const p = path.join(ROOT, META[grade].band, 'locales', 'ai-grade' + grade + '.js');
  const fn = new Function('window', fs.readFileSync(p, 'utf8') + '\nreturn window.BREAKOUT;');
  return fn({});
}
const ACT = {};
for (const g of Object.keys(META)) ACT[g] = { grade: +g, ...META[g], B: loadBreakout(g) };

// ---- shared shell --------------------------------------------------------
const OG_DESC = 'Critical Thinking Online Breakouts for Generative AI Literacy — grades 3–8, TEKS-aligned, in 7 languages. Runs in the browser; no logins, no data collected.';
function assets(depth) { return depth ? '../assets' : 'assets'; }
function headMeta(depth, title, desc) {
  const a = assets(depth);
  return `<link rel="icon" href="${a}/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="${a}/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="apple-touch-icon" href="${a}/apple-touch-icon.png">
<link rel="manifest" href="${a}/site.webmanifest">
<meta name="theme-color" content="${THEME_COLOR}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SUITE_EN}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE_URL}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE_URL}/assets/og.png">`;
}
function shell({ depth = 0, title, extraHead = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
${headMeta(depth, title, OG_DESC)}
${FONTS}
<style>${PALETTE}</style>
<link rel="stylesheet" href="${assets(depth)}/site.css">${extraHead}
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>
`;
}
function footer(depth, policyHref) {
  return `<footer>
  ${SUITE_EN} · Aligned to Texas TEKS Technology Applications (adopted 2022, required K–8). Paraphrased alignment — not legal advice.<br>
  <a href="${depth ? '../' : ''}index.html">Suite home</a> · <a href="${depth ? '../' : ''}library.html">Library</a> · <a href="${depth ? '../' : ''}correlation.html">Standards correlation</a> · <a href="${depth ? '../' : ''}guide.html">Teacher guide</a>${policyHref ? ` · <a href="${policyHref}">Privacy &amp; compliance</a>` : ''}
</footer>`;
}

// ---- activity card -------------------------------------------------------
function card(grade, { depthToBand }) {
  const a = ACT[grade], U = a.B.UI.en;
  const href = `${depthToBand}ai-grade${grade}-student.html`;
  const teacher = `${depthToBand}ai-grade${grade}.html`;
  const locked = a.tier === 'paid';
  return `<a class="card${locked ? ' locked' : ''}" href="${locked ? teacher : href}">
    <span class="badge">Grade ${grade} · ${a.teks}</span>
    <div class="ico">${a.icon}</div>
    <div class="ctitle">${esc(U['header.h1'])}</div>
    <div class="cdesc">${esc(U['header.sub'])}</div>
    <span class="tier">${locked ? '🔒' : '<span class="freeflag">FREE</span>'}</span>
    <span class="cgo">${locked ? 'Licensed districts →' : 'Start the breakout →'}</span>
  </a>`;
}

// ---- SUITE LANDING -------------------------------------------------------
function suiteLanding() {
  const free = [3, 4, 5].map(g => card(g, { depthToBand: 'grade35/' })).join('\n    ');
  const paid = [6, 7, 8].map(g => card(g, { depthToBand: 'grade68/' })).join('\n    ');
  const body = `  <div class="hero">
    <div class="eyebrow">Generative AI Literacy · TEKS Technology Applications</div>
    <h1>${SUITE_EN}</h1>
    <p class="lede">A suite of Critical Thinking Online Breakouts for grades 3–8. Students read clues, reason through four locks, and learn to think clearly about AI — what it is, how it learns from data, and when to check its work. Multilingual, and it runs entirely in the browser.</p>
    <div class="btnrow">
      <a class="btn" href="grade35/index.html">Grades 3–5 (free)</a>
      <a class="btn ghost" href="grade68/index.html">Grades 6–8</a>
      <a class="btn ghost" href="library.html">🔎 Browse library</a>
      <a class="btn ghost" href="guide.html">Teacher guide</a>
    </div>
  </div>

  <h2>Free tier — Grades 3–5</h2>
  <p class="section-note">Fully free and open. No login, no account, nothing collected. Share the link and go.</p>
  <div class="cards">
    ${free}
  </div>

  <h2>More — Grades 6–8</h2>
  <p class="section-note">The middle-school band is included with a district license. Preview the premise and standards on each activity's teacher page.</p>
  <div class="cards">
    ${paid}
  </div>

  <div class="panel gold">
    <h3>Why "breakouts"?</h3>
    <p>Each activity is a mini escape-room: six clues (one is a decoy), four locks, and a short <em>reason</em> revealed after every lock that names <em>why</em> the answer follows from the evidence. The reasoning is the point — especially with AI, where a confident answer can still be wrong.</p>
  </div>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), shell({ depth: 0, title: SUITE_EN + ' — Grades 3–8', body }));
}

// ---- BAND HUB ------------------------------------------------------------
function bandHub(band, grades, opts) {
  const cards = grades.map(g => card(g, { depthToBand: '' })).join('\n    ');
  const paidNote = opts.paid ? `<div class="panel tip"><strong>Licensed band.</strong> These activities are served to licensed districts through an authenticated session. Teacher pages (premise + standards) are open to everyone.</div>` : '';
  const body = `  <div class="crumb"><a href="../index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow${opts.paid ? ' gold' : ''}">${opts.label}</div>
    <h1>${opts.title}</h1>
    <p class="lede">${opts.lede}</p>
    <div class="btnrow">
      <a class="btn ghost" href="implementation.html">Implementation plan</a>
      <a class="btn ghost" href="../correlation.html">Standards correlation</a>
    </div>
  </div>
  ${paidNote}
  <div class="cards">
    ${cards}
  </div>
${footer(1, 'policy.html')}`;
  fs.writeFileSync(path.join(ROOT, band, 'index.html'), shell({ depth: 1, title: opts.title + ' — ' + SUITE_EN, body }));
}

// ---- TEACHER LAUNCH PAGE (no answers) ------------------------------------
function teacherPage(grade) {
  const a = ACT[grade], U = a.B.UI.en, locks = a.B.CONTENT.en.locks, focus = FOCUS[grade];
  const rows = locks.map((l, i) => `<tr><td><span class="lk">Lock ${i + 1}</span><br><span class="small">${esc(l.title)}</span></td>
      <td>${esc(focus[i][0])}</td>
      <td><span class="pill sub">${focus[i][1]}</span> ${esc(SUBSTRANDS[focus[i][1]])}</td></tr>`).join('\n    ');
  const substrandsUsed = [...new Set(focus.map(f => f[1]))].sort();
  const body = `  <div class="crumb"><a href="index.html">‹ ${esc(a.band === 'grade35' ? 'Grades 3–5' : 'Grades 6–8')} hub</a> · <a href="../index.html">Suite home</a></div>
  <div class="hero">
    <div class="eyebrow${a.tier === 'paid' ? ' gold' : ''}">Teacher launch · Grade ${grade} · TEKS ${a.teks}</div>
    <h1>${esc(U['header.h1'])}</h1>
    <p class="lede">${esc(U['header.sub'])}</p>
    <div class="btnrow">
      <a class="btn" href="ai-grade${grade}-student.html">${a.tier === 'paid' ? 'Open activity (licensed)' : 'Launch student activity'}</a>
      <a class="btn ghost" href="../correlation.html">Correlation</a>
    </div>
  </div>

  <div class="panel gold">
    <h3>The premise</h3>
    <p>${esc(U['brief.p'])}</p>
  </div>

  <h2>Standards alignment</h2>
  <p class="section-note">Aligned to Texas TEKS Technology Applications, Grade ${grade}, <strong>${a.teks}</strong> — the AI-adjacent strands (${STRAND_SUMMARY}), subsections ${substrandsUsed.join(', ')}. Skills are paraphrased; read the official standard at <a href="https://tea.texas.gov" target="_blank" rel="noopener">tea.texas.gov</a>. This page shows the reasoning focus of each lock — <strong>not the answers.</strong></p>
  <div class="tbl-wrap"><table>
    <caption>What each lock asks students to reason about</caption>
    <thead><tr><th>Lock</th><th>Reasoning focus</th><th>TEKS substrand</th></tr></thead>
    <tbody>
    ${rows}
    </tbody>
  </table></div>

  <h2>In the classroom</h2>
  <div class="panel">
    <ul>
      <li><strong>Warm up (5 min).</strong> Ask: "${esc(U['brief.h'])}" — what does this mean when working with AI? Surface prior experience before the activity.</li>
      <li><strong>Model one clue.</strong> Open a single clue together and think aloud: what does this tell us, and which lock might it help?</li>
      <li><strong>Reason, don't guess.</strong> Require students to say <em>why</em> before checking a lock. After each solve, read the revealed <em>reason</em> and compare it to their thinking.</li>
      <li><strong>Spot the decoy.</strong> One clue is true but useless. Debrief which one and how they knew — a core evaluation skill that mirrors judging an AI's output.</li>
      <li><strong>Language support.</strong> The 🌐 picker offers 7 languages; pair newcomers to discuss clues in their home language, then answer.</li>
      <li><strong>Extend.</strong> Have students find (or safely describe) a real example of the focus skill — a biased result, a hallucination, a good prompt — without using any real product's screenshots.</li>
    </ul>
  </div>
  <div class="disclaimer">Answers are intentionally not shown here. The full answer key (with the reasoning for every lock) is on the password-gated <a href="../answer-key.html">answer-key page</a>. This alignment is a good-faith paraphrase for lesson planning and is not legal advice.</div>
${footer(1, 'policy.html')}`;
  fs.writeFileSync(path.join(ROOT, a.band, 'ai-grade' + grade + '.html'), shell({ depth: 1, title: U['header.h1'] + ' — Teacher launch (Grade ' + grade + ')', body }));
}

// ---- CORRELATION GUIDE ---------------------------------------------------
function correlation() {
  function bandTable(label, grades) {
    const rows = grades.map(g => {
      const a = ACT[g], U = a.B.UI.en, locks = a.B.CONTENT.en.locks, focus = FOCUS[g];
      const lockList = locks.map((l, i) => `<div class="lk">Lock ${i + 1}: <span style="font-weight:600">${esc(l.title)}</span> — ${esc(focus[i][0])} <span class="pill sub">${focus[i][1]}</span></div>`).join('');
      const subs = [...new Set(focus.map(f => f[1]))].sort();
      return `<tr>
        <td><span class="lk">${esc(U['header.h1'])}</span><br><span class="small">Grade ${g}${a.tier === 'paid' ? ' · licensed' : ' · free'}</span></td>
        <td>${lockList}</td>
        <td><strong>${a.teks}</strong><br><span class="small">${subs.join(' ')}</span></td>
      </tr>`;
    }).join('\n    ');
    return `<h2>${label}</h2>
  <div class="tbl-wrap"><table>
    <caption>Activity · locks &amp; reasoning focus · TEKS section</caption>
    <thead><tr><th>Activity</th><th>Locks (reasoning focus · substrand)</th><th>TEKS §</th></tr></thead>
    <tbody>
    ${rows}
    </tbody>
  </table></div>`;
  }
  const legend = Object.entries(SUBSTRANDS).map(([k, v]) => `<div><span class="pill sub">${k}</span> ${v}</div>`).join('');
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Standards correlation</div>
    <h1>TEKS Correlation Guide</h1>
    <p class="lede">How each breakout aligns to the Texas TEKS Technology Applications AI-adjacent strands (${STRAND_SUMMARY}) — adopted 2022, implemented 2024–25, required K–8. This suite deliberately complements, rather than duplicates, the Digital Citizenship strand.</p>
  </div>
  <div class="panel tip"><strong>Substrands used across the suite:</strong>${legend}</div>
  ${bandTable('Grades 3–5 (free tier)', [3, 4, 5])}
  ${bandTable('Grades 6–8 (licensed tier)', [6, 7, 8])}
  <div class="disclaimer">Skills are <strong>paraphrased</strong> to respect TEA's copyright — no official standard text is reproduced. Cite the § number and read the source at <a href="https://tea.texas.gov" target="_blank" rel="noopener">tea.texas.gov</a>. Alignment is a good-faith mapping for planning and is not legal advice.</div>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'correlation.html'), shell({ depth: 0, title: 'TEKS Correlation Guide — ' + SUITE_EN, body }));
}

// ---- CURRICULUM GUIDE ----------------------------------------------------
function guide() {
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Teacher guide</div>
    <h1>Curriculum Guide</h1>
    <p class="lede">Purpose, design, and how to run the ${SUITE_EN} across grades 3–8.</p>
  </div>

  <h2>Purpose</h2>
  <p>The suite builds <strong>generative-AI literacy through reasoning</strong>. Every activity aligns to the Texas TEKS Technology Applications AI-adjacent strands — ${STRAND_SUMMARY} — but the deeper goal is <em>critical thinking</em>: students weigh evidence, reject a decoy, and justify each answer before they check it. The through-line across all six grades is simple and durable: <em>AI makes guesses from patterns in data, it can be confidently wrong, so you verify.</em></p>

  <h2>The CLEAR reasoning focus</h2>
  <p>Each lock is designed so a correct guess is not enough — students should be able to explain the <em>reason</em>, which the activity reveals after every solve. Encourage this habit:</p>
  <div class="panel">
    <ul>
      <li><strong>C</strong>ollect — read all six clues first.</li>
      <li><strong>L</strong>ocate — which clue(s) speak to this lock?</li>
      <li><strong>E</strong>valuate — is the evidence strong, or is it the decoy?</li>
      <li><strong>A</strong>rgue — say why before checking.</li>
      <li><strong>R</strong>eflect — compare your reason to the revealed reason.</li>
    </ul>
  </div>

  <h2>How to deploy</h2>
  <div class="panel">
    <ul>
      <li><strong>Any device, any time.</strong> Each activity is one self-contained page — no install, no login, no data collected. Share the URL or embed it in your LMS.</li>
      <li><strong>Whole-class or independent.</strong> Project and solve together for younger grades; assign independently or in pairs for older ones.</li>
      <li><strong>Multilingual.</strong> The 🌐 picker offers English, Spanish, Vietnamese, Arabic, Hindi, Urdu, and Chinese (translations are AI-seeded, pending native review).</li>
      <li><strong>No live AI required.</strong> Activities teach <em>about</em> AI without sending students to any AI product — no accounts, no chatbots, no real product screenshots.</li>
    </ul>
  </div>

  <h2>Free vs. licensed</h2>
  <div class="panel gold">
    <p><strong>Free tier — Grades 3–5.</strong> Fully open and static. Use them with anyone, anywhere.</p>
    <p><strong>Licensed tier — Grades 6–8</strong> (and future "More" activities). Included with a district license and served through an authenticated session. Teacher pages and this guide remain open so you can evaluate before you buy.</p>
  </div>

  <h2>A note on accuracy</h2>
  <p>AI moves fast, but these activities teach durable ideas — patterns, data, bias, verification, disclosure — not product features. Content uses generic terms (an AI helper, a chatbot, an image generator) and avoids brand names so it stays accurate as tools change.</p>

  <div class="btnrow">
    <a class="btn" href="grade35/implementation.html">Grades 3–5 plan</a>
    <a class="btn" href="grade68/implementation.html">Grades 6–8 plan</a>
    <a class="btn ghost" href="correlation.html">Correlation guide</a>
  </div>
${footer(0)}`;
  fs.writeFileSync(path.join(ROOT, 'guide.html'), shell({ depth: 0, title: 'Curriculum Guide — ' + SUITE_EN, body }));
}

// ---- IMPLEMENTATION PLAN (per band) --------------------------------------
function implementation(band, grades, opts) {
  const list = grades.map(g => {
    const U = ACT[g].B.UI.en;
    return `<li><strong>Grade ${g} — ${esc(U['header.h1'])}.</strong> ${esc(U['header.sub'])} <span class="small">(TEKS ${ACT[g].teks})</span></li>`;
  }).join('\n      ');
  const body = `  <div class="crumb"><a href="index.html">‹ ${esc(opts.hub)}</a> · <a href="../index.html">Suite home</a></div>
  <div class="hero">
    <div class="eyebrow${opts.paid ? ' gold' : ''}">Implementation plan</div>
    <h1>${opts.title}</h1>
    <p class="lede">${opts.lede}</p>
  </div>

  <h2>The activities</h2>
  <div class="panel"><ul>
      ${list}
  </ul></div>

  <h2>Pacing</h2>
  <div class="panel">
    <ul>
      <li><strong>One activity ≈ 25–40 minutes</strong>, including debrief. Younger classes may need two sittings.</li>
      <li>Run one per grading period, or cluster them into a two-week AI-literacy unit.</li>
      <li>Order matches the grade sequence; each grade deepens the pattern → data → bias → responsible-use arc.</li>
    </ul>
  </div>

  <h2>Prerequisites</h2>
  <div class="panel">
    <ul>
      <li>A browser and the activity link. No accounts, installs, or logins.</li>
      <li>${opts.prereq}</li>
      <li>Teachers: skim the activity's teacher launch page and the <a href="../correlation.html">correlation guide</a> first.</li>
    </ul>
  </div>

  <h2>Extension &amp; differentiation</h2>
  <div class="panel">
    <ul>
      <li><strong>Home-language pairs.</strong> Use the 🌐 picker so newcomers reason in their strongest language, then answer.</li>
      <li><strong>Author-a-clue.</strong> Students write a new clue (or a real-world example) for the skill they found hardest.</li>
      <li><strong>Reason aloud.</strong> Require a spoken/written justification before each lock check; grade the reasoning, not the click.</li>
      <li>${opts.extend}</li>
    </ul>
  </div>
${footer(1, 'policy.html')}`;
  fs.writeFileSync(path.join(ROOT, band, 'implementation.html'), shell({ depth: 1, title: opts.title + ' — ' + SUITE_EN, body }));
}

// ---- POLICY --------------------------------------------------------------
function policy(band, label) {
  const body = `  <div class="crumb"><a href="index.html">‹ ${esc(label)} hub</a> · <a href="../index.html">Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Privacy &amp; compliance</div>
    <h1>Privacy &amp; Compliance</h1>
    <p class="lede">What these activities do — and, more importantly, do not do — with student data.</p>
  </div>

  <div class="panel tip">
    <h3>The short version</h3>
    <p>Each breakout runs <strong>entirely in the student's browser</strong>. There are no accounts, no logins, and no analytics. We do not collect, transmit, or store any personal information — and the activities never send students to a live AI service.</p>
  </div>

  <h2>What we collect</h2>
  <div class="panel"><ul>
    <li><strong>Nothing personal.</strong> No names, no emails, no student records — ever.</li>
    <li><strong>No AI calls.</strong> These pages teach <em>about</em> AI; they do not connect to any chatbot or model, so no student input is sent anywhere.</li>
    <li><strong>No tracking.</strong> No cookies for advertising, no third-party analytics, no fingerprinting.</li>
    <li><strong>Local only.</strong> Your chosen language is remembered in your own browser (localStorage) so the picker stays put. It never leaves the device and you can clear it anytime.</li>
    <li>Every page sends <span class="pill">referrer: no-referrer</span> so navigation is not leaked to other sites.</li>
  </ul></div>

  <h2>Compliance posture</h2>
  <div class="panel"><ul>
    <li>Because no personal data is collected, the activities are designed to sit comfortably within <strong>COPPA</strong> and <strong>FERPA</strong> expectations and Texas student-data-privacy requirements.</li>
    <li>Fonts load from Google Fonts; if your district blocks external font CDNs the pages still work (they fall back to system fonts).</li>
    <li>Content is 100% original / open-licensed. No real AI-product UIs, logos, or brand names; no copyrighted media; no photos of children.</li>
  </ul></div>

  <div class="disclaimer">This notice describes the design intent of the activities and is provided for district review; it is not legal advice. Confirm fit with your district's privacy officer.</div>
${footer(1, null)}`;
  fs.writeFileSync(path.join(ROOT, band, 'policy.html'), shell({ depth: 1, title: 'Privacy & Compliance — ' + SUITE_EN, body }));
}

// ---- SEARCHABLE LIBRARY --------------------------------------------------
// Curated, leak-safe search keywords per grade (no answers / no paid content).
const KEYWORDS = {
  3: ['artificial intelligence', 'ai', 'machine learning', 'patterns', 'prediction', 'guessing', 'data', 'examples', 'check', 'verify'],
  4: ['data', 'training data', 'bias', 'one-sided data', 'hallucination', 'made-up facts', 'accuracy', 'trusted sources', 'fairness'],
  5: ['prompt', 'prompting', 'prompt engineering', 'instructions', 'algorithm', 'refine', 'iterate', 'compare', 'verify', 'task details format'],
  6: ['generative ai', 'deepfake', 'ai-generated', 'fake images', 'synthetic media', 'hallucination', 'misinformation', 'verify', 'reverse image search', 'voice cloning'],
  7: ['bias', 'training data', 'stereotype', 'fairness', 'representation', 'misinformation', 'evaluate', 'critical thinking', 'whose view is missing'],
  8: ['responsible ai', 'disclosure', 'attribution', 'citing ai', 'academic honesty', 'verify', 'plagiarism', 'copyright', 'privacy', 'data privacy', 'ethics'],
};
function buildCatalog() {
  return Object.keys(META).map(g => {
    const a = ACT[g], U = a.B.UI.en, focus = FOCUS[g];
    const subs = [...new Set(focus.map(f => f[1]))].sort();
    const clueNames = a.B.CONTENT.en.clues.map(c => c.nm);
    const lockTitles = a.B.CONTENT.en.locks.map(l => l.title);
    const hay = [U['header.h1'], U['header.sub'], a.teks, ...focus.map(f => f[0]), ...lockTitles, ...clueNames,
      ...(KEYWORDS[g] || []), ...subs.map(s => SUBSTRANDS[s])].join(' ').toLowerCase();
    return {
      grade: +g, band: a.band === 'grade35' ? '3-5' : '6-8', teks: a.teks, tier: a.tier, icon: a.icon,
      title: U['header.h1'], sub: U['header.sub'], focus: focus.map(f => f[0]), subs,
      href: (a.band === 'grade35' ? 'grade35/' : 'grade68/') + (a.tier === 'paid' ? `ai-grade${g}.html` : `ai-grade${g}-student.html`),
      hay,
    };
  });
}
function library() {
  const catalog = buildCatalog();
  const subLegend = Object.entries(SUBSTRANDS).map(([k, v]) => `<button class="chip" data-sub="${k}" title="${esc(v)}">${k}</button>`).join('');
  const body = `  <div class="crumb"><a href="index.html">‹ Suite home</a></div>
  <div class="hero">
    <div class="eyebrow">Activity library</div>
    <h1>Find an activity</h1>
    <p class="lede">Search all ${catalog.length} breakouts by title, skill, standard, or keyword — then filter by grade band, tier, and TEKS strand.</p>
  </div>

  <div class="panel">
    <input id="q" class="search" type="search" placeholder="Search: patterns, data, prompt, bias, hallucination, §126.17 …" aria-label="Search activities" autocomplete="off">
    <div class="filters">
      <span class="fgroup"><span class="flabel">Band</span>
        <button class="chip" data-band="3-5">Grades 3–5</button>
        <button class="chip" data-band="6-8">Grades 6–8</button></span>
      <span class="fgroup"><span class="flabel">Tier</span>
        <button class="chip" data-tier="free">Free</button>
        <button class="chip" data-tier="paid">Licensed</button></span>
      <span class="fgroup"><span class="flabel">Strand</span>${subLegend}</span>
      <button id="clear" class="chip clear">Clear</button>
    </div>
  </div>

  <p id="count" class="section-note"></p>
  <div id="grid" class="cards"></div>
  <p id="empty" class="section-note" style="display:none">No activities match. <a href="#" id="reset">Clear filters</a>.</p>
${footer(0)}`;

  const extraHead = `
<style>
  .search{width:100%;border:2px solid var(--line);border-radius:12px;padding:13px 16px;font-size:1.05rem;font-family:inherit;font-weight:700;color:var(--navy)}
  .search:focus{outline:none;border-color:var(--c3)}
  .filters{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:14px}
  .fgroup{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .flabel{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);font-weight:800;margin-right:2px}
  .chip{background:#fff;border:2px solid var(--line);border-radius:100px;padding:6px 13px;font-family:inherit;font-weight:700;
    font-size:.82rem;color:var(--navy);cursor:pointer;transition:.14s}
  .chip:hover{border-color:var(--c3)}
  .chip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
  .chip.clear{color:var(--ink-soft);border-style:dashed}
  mark{background:var(--gold);color:var(--navy-d);padding:0 2px;border-radius:3px}
</style>`;

  const script = `
<script id="catalog" type="application/json">${JSON.stringify(catalog)}</script>
<script>
(function(){
  'use strict';
  var CAT = JSON.parse(document.getElementById('catalog').textContent);
  var grid = document.getElementById('grid'), count = document.getElementById('count'), empty = document.getElementById('empty');
  var state = { q:'', band:new Set(), tier:new Set(), sub:new Set() };
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function hi(text, q){ if(!q) return esc(text); try{ return esc(text).replace(new RegExp('('+q.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&')+')','ig'),'<mark>$1</mark>'); }catch(e){ return esc(text); } }
  function matches(a){
    if(state.band.size && !state.band.has(a.band)) return false;
    if(state.tier.size && !state.tier.has(a.tier)) return false;
    if(state.sub.size && ![...state.sub].every(s=>a.subs.indexOf(s)>=0)) return false;
    if(state.q){ var toks=state.q.toLowerCase().split(/\\s+/).filter(Boolean); if(!toks.every(t=>a.hay.indexOf(t)>=0)) return false; }
    return true;
  }
  function render(){
    var list = CAT.filter(matches);
    grid.innerHTML = list.map(function(a){
      var locked = a.tier==='paid';
      return '<a class="card'+(locked?' locked':'')+'" href="'+a.href+'">'
        + '<span class="badge">Grade '+a.grade+' · '+esc(a.teks)+'</span>'
        + '<div class="ico">'+a.icon+'</div>'
        + '<div class="ctitle">'+hi(a.title,state.q)+'</div>'
        + '<div class="cdesc">'+hi(a.sub,state.q)+'</div>'
        + '<div class="small" style="margin-top:8px">'+a.focus.map(f=>'<span class="pill">'+hi(f,state.q)+'</span>').join('')+'</div>'
        + '<span class="tier">'+(locked?'🔒':'<span class="freeflag">FREE</span>')+'</span>'
        + '<span class="cgo">'+(locked?'Licensed districts →':'Start the breakout →')+'</span></a>';
    }).join('');
    count.textContent = list.length + ' of ' + CAT.length + ' activities';
    empty.style.display = list.length ? 'none' : 'block';
  }
  document.getElementById('q').addEventListener('input', function(e){ state.q = e.target.value.trim(); render(); });
  function toggleChip(btn){
    var dim = btn.dataset.band!=null?'band':btn.dataset.tier!=null?'tier':btn.dataset.sub!=null?'sub':null;
    if(!dim) return; var val = btn.dataset[dim];
    if(state[dim].has(val)){ state[dim].delete(val); btn.classList.remove('on'); }
    else { state[dim].add(val); btn.classList.add('on'); }
    render();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-band],.chip[data-tier],.chip[data-sub]'), function(b){ b.addEventListener('click', function(){ toggleChip(b); }); });
  function clearAll(){ state={q:'',band:new Set(),tier:new Set(),sub:new Set()}; document.getElementById('q').value='';
    Array.prototype.forEach.call(document.querySelectorAll('.chip.on'), function(c){c.classList.remove('on');}); render(); }
  document.getElementById('clear').addEventListener('click', clearAll);
  document.getElementById('reset').addEventListener('click', function(e){ e.preventDefault(); clearAll(); });
  render();
})();
</script>`;

  fs.writeFileSync(path.join(ROOT, 'library.html'), shell({ depth: 0, title: 'Activity Library — ' + SUITE_EN, extraHead, body: body + script }));
}

// ---- run -----------------------------------------------------------------
suiteLanding();
library();
bandHub('grade35', [3, 4, 5], { paid: false, label: 'Grades 3–5 · Free', title: 'Grades 3–5', lede: 'The free tier. What AI is, how it learns from data, and how to prompt it and check its work — one breakout per grade, ready to share.' });
bandHub('grade68', [6, 7, 8], { paid: true, label: 'Grades 6–8 · Licensed', title: 'Grades 6–8', lede: 'The middle-school band: spotting AI-generated media, tracing where bias comes from, and creating with AI responsibly. Included with a district license.' });
correlation();
guide();
implementation('grade35', [3, 4, 5], { paid: false, hub: 'Grades 3–5', title: 'Grades 3–5 Implementation Plan', lede: 'Pacing, prerequisites, and extensions for the free elementary band.', prereq: 'Students should be comfortable reading short paragraphs and clicking/tapping tiles.', extend: 'Connect to a class agreement on checking facts and giving credit; revisit the "AI guesses from patterns" idea across the year.' });
implementation('grade68', [6, 7, 8], { paid: true, hub: 'Grades 6–8', title: 'Grades 6–8 Implementation Plan', lede: 'Pacing, prerequisites, and extensions for the licensed middle-school band.', prereq: 'Students should be able to evaluate short arguments and are ready for real vocabulary: training data, bias, hallucination, disclosure.', extend: 'Bridge to a media-literacy or intro-to-CS unit; have students evaluate a teacher-vetted example of AI output using the Grade 6–8 criteria.' });
policy('grade35', 'Grades 3–5');
policy('grade68', 'Grades 6–8');
for (const g of Object.keys(META)) teacherPage(+g);

console.log('Generated: index.html, library.html, correlation.html, guide.html, band hubs, implementation plans, policy pages, and 6 teacher launch pages.');
