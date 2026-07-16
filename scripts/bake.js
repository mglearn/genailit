/* bake.js — assemble a browser locale file from a per-grade content source.
   ---------------------------------------------------------------------------
   Unlike the sibling Digital Citizenship suite (which seeds shared chrome from
   its verified Grade 3 locale), this baker sources the suite-agnostic shared
   chrome directly:
     - the 21 non-English COMMON strings from assets/build-ml.js (the canonical
       shared dictionary), and
     - their English equivalents from SHARED_EN below.
   A per-grade JSON source (grade{band}/src/ai-gradeN.json) supplies only:
     - the 11 grade/suite-specific English chrome strings,
     - header.eyebrow in all 7 languages,
     - the English CONTENT (6 clues incl. >=1 decoy, 4 locks each with a reason).
   CONTENT[es..zh] and the 10 grade-specific non-English chrome keys are left to
   the translation pass (grade{band}/i18n/ai-gradeN.<lang>.json overlays); until
   then the engine falls back to English for missing keys, giving a clean
   22-key non-English UI baseline (21 COMMON + header.eyebrow).

   Run:  node scripts/bake.js            (bakes every src/*.json it finds)
         node scripts/bake.js ai-grade4  (bakes one)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { COMMON, LANGS: NONEN } = require('../assets/build-ml.js');
const { SUITE_EN } = require('./config');

const ROOT = path.join(__dirname, '..');
const BANDS = { gradek2: [0, 1, 2], grade35: [3, 4, 5], grade68: [6, 7, 8] };  // K == grade 0

// English shared chrome — the 21 suite-agnostic keys, byte-matched to COMMON's
// key set. (COMMON in build-ml.js holds only the non-English values.)
const SHARED_EN = {
  'sect.clues': '🔍 The Clues',
  'sect.cluesHint': 'Tap each clue to read it. You can open them again anytime.',
  'sect.locks': '🔒 The Locks',
  'sect.locksHint': 'Use the clues to open each lock.',
  'crumb.teacher': '‹ Teacher launch',
  'ui.reset': '↺ Reset',
  'ui.check': 'Check',
  'ui.gotit': 'Got it',
  'ui.playagain': 'Play Again',
  'ui.solved': '🔓 Solved!',
  'ui.pcount': '{n} of {total} locks open',
  'ui.wordph': 'Type your answer',
  'ui.clear': 'clear',
  'fb.digit': "That number doesn't match the clues. Check again.",
  'fb.word': 'Check the clues for the word that fits.',
  'fb.mc': "That one isn't supported by the clues. Look again.",
  'fb.multiExtra': "One pick isn't strong evidence. Strong means facts the clues really show.",
  'fb.multiMissing': "You're missing a piece of strong evidence. Find them all.",
  'fb.seq': "That order doesn't match the clues. Try again.",
  'footer.privacy': 'Privacy & compliance',
  'footer.disclaimer': 'Translations are AI-seeded and pending native-speaker review.',
};

function bandOf(grade) {
  for (const [b, gs] of Object.entries(BANDS)) if (gs.includes(grade)) return b;
  throw new Error('no band for grade ' + grade);
}

// overlay.chrome.* -> UI[lang] key (adds the 10 grade-specific + crumb.suite keys)
function applyChrome(ui, ch) {
  const map = { h1: 'header.h1', sub: 'header.sub', briefLabel: 'brief.label', briefH: 'brief.h',
    briefP: 'brief.p', footerText: 'footer.text', winStamp: 'win.stamp', winH: 'win.h', winP: 'win.p', crumbSuite: 'crumb.suite' };
  for (const [k, key] of Object.entries(map)) if (ch[k] != null) ui[key] = ch[k];
}

// Build a localized CONTENT[lang] by cloning the EN structure and swapping ONLY
// text fields from the overlay. Structure (id, type, color, answerIndex, strong
// flags, pad keys/order, seq answer order, digit answers) always comes from EN.
function pick(t, fallback) { return (t == null || t === '') ? fallback : t; }
function localizeContent(en, ov) {
  const oc = ov.clues || [], ol = ov.locks || [];
  const clues = en.clues.map((c, i) => {
    const t = oc[i] || {};
    return Object.assign({}, c, { nm: pick(t.nm, c.nm), title: pick(t.title, c.title), body: pick(t.body, c.body) });
  });
  const locks = en.locks.map((l, i) => {
    const t = ol[i] || {};
    const nl = Object.assign({}, l, { title: pick(t.title, l.title), q: pick(t.q, l.q), reason: pick(t.reason, l.reason) });
    if (l.type === 'mc' && Array.isArray(t.options)) nl.options = l.options.map((o, j) => pick(t.options[j], o));
    if (l.type === 'multi' && Array.isArray(t.items)) nl.items = l.items.map((it, j) => Object.assign({}, it, { t: pick(t.items[j], it.t) }));
    if (l.type === 'seq' && Array.isArray(t.pads)) nl.pads = l.pads.map((p, j) => Object.assign({}, p, { e: pick(t.pads[j], p.e) }));
    if (l.type === 'word' && Array.isArray(t.answer)) nl.answer = [...new Set([...l.answer, ...t.answer].map(String))];
    return nl;
  });
  return { clues, locks };
}

function bakeOne(srcPath) {
  const S = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const c = S.chrome;

  // ---- English UI: shared chrome + grade/suite-specific chrome
  const UI = {
    en: Object.assign({}, SHARED_EN, {
      'crumb.suite': SUITE_EN,
      'header.eyebrow': c.eyebrow.en,
      'header.h1': c.h1,
      'header.sub': c.sub,
      'brief.label': c.briefLabel,
      'brief.h': c.briefH,
      'brief.p': c.briefP,
      'footer.text': c.footerText,
      'win.stamp': c.winStamp,
      'win.h': c.winH,
      'win.p': c.winP,
    }),
  };

  const enContent = { clues: S.clues, locks: S.locks };
  const CONTENT = { en: enContent };
  const i18nDir = path.join(path.dirname(path.dirname(srcPath)), 'i18n');

  for (const lg of NONEN) {
    // 21 COMMON shared keys + the per-grade eyebrow + the 10 grade/suite chrome
    // keys (English default) = a uniform 32-key set; overlay overrides below.
    UI[lg] = {};
    for (const k of Object.keys(COMMON)) UI[lg][k] = COMMON[k][lg];
    UI[lg]['header.eyebrow'] = c.eyebrow[lg];
    for (const k of ['header.h1', 'header.sub', 'brief.label', 'brief.h', 'brief.p', 'footer.text', 'win.stamp', 'win.h', 'win.p', 'crumb.suite']) UI[lg][k] = UI.en[k];

    // text-only translation overlay, if present — structure always comes from EN
    const ovPath = path.join(i18nDir, S.id + '.' + lg + '.json');
    if (fs.existsSync(ovPath)) {
      const ov = JSON.parse(fs.readFileSync(ovPath, 'utf8'));
      applyChrome(UI[lg], ov.chrome || {});
      CONTENT[lg] = localizeContent(enContent, ov);
    } else {
      CONTENT[lg] = { clues: [], locks: [] };  // untranslated — engine falls back to EN
    }
  }

  const B = { id: S.id, grade: S.grade, tier: S.tier || 'free', icon: S.icon || '', teks: S.teks || '', confetti: S.confetti, UI, CONTENT };
  const out = 'window.BREAKOUT = ' + JSON.stringify(B, null, 1) + ';\n';
  const dest = path.join(ROOT, bandOf(S.grade), 'locales', S.id + '.js');
  fs.writeFileSync(dest, out);
  return path.relative(ROOT, dest);
}

const only = process.argv[2];
const sources = [];
for (const band of Object.keys(BANDS)) {
  const d = path.join(ROOT, band, 'src');
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) if (f.endsWith('.json') && (!only || f === only + '.json')) sources.push(path.join(d, f));
}
if (!sources.length) { console.error('No source JSON found' + (only ? ' for ' + only : '')); process.exit(1); }
for (const s of sources.sort()) console.log('baked', bakeOne(s));
