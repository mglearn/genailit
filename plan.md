# Gen AI Literacy CTOBs — Build Plan (Claude Code Handoff)

A suite of **Critical Thinking Online Breakouts (CTOBs)** for **Generative AI
Literacy**, aligned to the **Texas TEKS Technology Applications** standard
(adopted 2022, required K–8), grades **3–8**, multilingual (7 languages),
indigo/cyan themed. This is the **sibling suite** to the Digital Citizenship
breakouts and reuses the same engine (`assets/breakout.js|css`, `i18n.js`,
`build-ml.js`) and build pipeline. A Grade 3 reference activity is already built
and verified. The job: replicate it across grades 4–8, add teacher materials,
translate, and set up the same free/paid split + hosting.

---

## 0. Ground truth (verified — do not re-litigate)

- **Standard:** TX Technology Applications TEKS, **adopted 2022, implemented
  2024–25, required K–8.** Five strands, each present at every grade:
  *Computational Thinking; Creativity & Innovation; Data Literacy, Management &
  Representation; Digital Citizenship; Practical Technology Concepts.*
- **This suite aligns to the AI-adjacent strands — NOT Digital Citizenship.**
  The DigCit strand `(c)(8)(9)(10)` is the sibling suite's domain; we stay out
  of it and cross-reference instead of duplicating. Our home strands (subsection
  numbers are consistent across §126.8–126.19):
  - `(c)(1)` Computational Thinking — **Foundations** (decomposition, pattern
    recognition, abstraction, algorithms) → *how AI finds patterns to guess*
  - `(c)(2)` Computational Thinking — **Applications** → *prompts as algorithms*
  - `(c)(3)` Creativity & Innovation — **Innovative Design Process** → *creating with AI*
  - `(c)(4)` Creativity & Innovation — **Emerging Technologies** → *what generative AI is*
  - `(c)(5)` Data Literacy — **Collect Data** → *AI learns from examples (data)*
  - `(c)(6)` Data Literacy — **Organize/Manage/Analyze Data** → *bias & quality in data*
  - `(c)(7)` Data Literacy — **Communicate & Publish Results** → *spotting generated media*
  - `(c)(11)` Practical Technology Concepts — **Processes**
  - `(c)(12)` Practical Technology Concepts — **Skills & Tools**
- **TAC citations (per grade):** Gr3 §126.8, Gr4 §126.9, Gr5 §126.10,
  Gr6 §126.17, Gr7 §126.18, Gr8 §126.19.
- **COPYRIGHT RULE (hard):** Align *to* TEKS; **never paste TEA's official
  standard text** — paraphrase skills, cite the § number, link tea.texas.gov.
  Every asset public-domain / OER / self-authored.
- **AI-CONTENT RULE (hard):** **No real AI-product UIs, screenshots, logos, or
  brand names** (no ChatGPT/Gemini/Copilot imagery or names in required content).
  Use generic terms: *an AI helper, a chatbot, an image generator, a guessing
  machine.* Clue visuals = emoji or self-made clean SVG only. No photos of children.
- **Bands:** two — `grade35` (3–5, free) and `grade68` (6–8, paid).
- **Path depth:** activities live one level below suite root, so asset refs are
  `../assets/…`.
- **Palette:** indigo `#4338ca` primary, cyan `#06b6d4` accent, violet/teal lock
  colors — set in `scripts/gen-html.js` (ROOTVARS). Distinct from the sibling
  suite's navy/gold on purpose.

## 1. Repo layout

```
genailit/
  assets/                 # engine — copied from the DigCit suite, never edit
    breakout.js  breakout.css  i18n.js  build-ml.js  site.css  favicons…
  grade35/                # free band (Grades 3–5)
    src/ai-grade3.json    # DONE + verified   (author English here)
    src/ai-grade4.json    # TODO
    src/ai-grade5.json    # TODO
    i18n/ai-gradeN.<lang>.json   # text-only translation overlays (translation pass)
    locales/ai-gradeN.js  # BAKED (do not hand-edit)
    ai-gradeN-student.html # GENERATED student pages
    ai-gradeN.html         # TODO teacher launch pages (premise + standards, NO answers)
    index.html  policy.html  implementation.html   # TODO
  grade68/                # paid band (Grades 6–8) — same shape, all TODO
  index.html              # TODO suite landing (3 free cards + locked MORE)
  correlation.html        # TODO standards correlation guide
  guide.html              # TODO curriculum guide
  answer-key.html         # TODO AES-256 (answers only; client-side is fine here)
  scripts/                # build + verification tooling  (bake, gen-html, config DONE)
  hosting/                # TODO — clone from DigCit (nginx + Node auth gateway)
  solve-test.js           # DONE — the quality gate (renders + solves every activity)
```

## 2. Per-activity content spec (clone Grade 3 exactly)

Each activity = one `src/ai-gradeN.json` → baked to `locales/ai-gradeN.js` →
generated `ai-gradeN-student.html`. Author the JSON; the pipeline does the rest.

Rules per activity:
- **6 clues, exactly one decoy** (true-but-useless, like Grade 3's "Pizza Friday").
- **4 locks**, each ending in a one-sentence `reason` (why the answer follows).
- Prefer **click-based locks** (`mc`, `multi`, `seq`) — identical logic in every
  language. Use `word` sparingly (accept English + reasonable variants); `digit`
  only where a number genuinely fits (Gr5+).
- Keep **structural fields identical across languages** (id, ico, type, color,
  answerIndex, item order + strong flags, seq pads, answer arrays). Translate
  only text.
- Reading level: **Gr3–5 short sentences; Gr6–8 on-level.**
- **Verify claims about AI are accurate and current** — no magical thinking, no
  fear-mongering; "AI guesses from patterns in data and can be confidently wrong"
  is the through-line.

### Grade themes (author English first)

- **Gr3 "Meet the Machine that Guesses"** §126.8 — *DONE.* What AI is
  (pattern-guessing tool, not alive), it learns from examples called data, it can
  be wrong so you check it, your idea comes first. Strands `(c)(1),(5),(11),(12)`.
- **Gr4 "Garbage In, Garbage Out"** §126.9 — AI is only as good as its data;
  one-sided or thin data → wrong/unfair guesses; better examples improve results;
  AI can "make things up" (hallucinate). Strands `(c)(5),(6),(1)`. *(Data-literacy focus.)*
- **Gr5 "The Prompt Lab"** §126.10 — a prompt is a clear set of instructions (an
  algorithm); refine and try again; compare two outputs; always verify before
  using. Strands `(c)(2),(11),(3)`. *(Good place for a `seq` or `digit` lock.)*
- **Gr6 "Real or Generated?"** §126.17 — generative AI can create realistic text,
  images, and voices that are not real; how to spot generated media; verify
  against trusted sources. Strands `(c)(7),(4),(2)`. **PAID.**
- **Gr7 "Bias in the Machine"** §126.18 — where bias comes from (skewed training
  data, whose examples are missing, who built it); evaluate AI output critically;
  AI can amplify stereotypes and misinformation. Strands `(c)(5),(6),(4)`.
  **PAID.** *(Bridges from the DigCit Gr7 "Spot the Spin.")*
- **Gr8 "Build with AI, Responsibly"** §126.19 — using generative AI as a
  creation tool: disclose/attribute AI help, verify facts, respect others' work,
  know the limits and the data-privacy of AI tools; the innovative design process
  with AI. Strands `(c)(3),(4),(11),(12)`. **PAID.**

## 3. Shared UI translations (don't re-translate)

`assets/build-ml.js` exports `COMMON` (21 shared chrome/feedback keys × 6
non-English languages) and `mergeCommon`. `scripts/bake.js` already merges these
into every locale's `UI[es..zh]`, plus a translated `header.eyebrow`, yielding a
clean **22-key non-English baseline**. The 10 grade-specific chrome keys
(header.h1, header.sub, brief.*, win.*, footer.text, crumb.suite) are
**English-only until the translation pass** — the engine falls back to English.

## 4. Translation pass (after all 6 English activities exist + verify)

- Fill `i18n/ai-gradeN.<lang>.json` overlays: clues + locks text, plus the 10
  chrome keys per language. Structure comes from English; translate text only.
- Do all languages for a grade together (so UI-key parity stays 32/32 across
  languages — mixing translated + untranslated within a grade breaks parity).
- Mark all non-English **"AI-seeded; native-review pending"** (footer.disclaimer
  already says this).

## 5. Verification — REQUIRED (the quality gate)

`node solve-test.js` renders each real student HTML in jsdom with the actual
engine (locale → i18n → breakout) in EN + ZH (fallback) + AR (RTL), drives all
four locks, and asserts the win screen fires with **zero console errors**. It
also asserts per file: 6 clues incl. ≥1 decoy; 4 locks each with a `reason`;
mc answerIndex in range; seq answers reference existing pads; multi has strong +
non-strong; UI key parity across languages; translated CONTENT structurally
identical to English. Must print **ALL PASS** before anything ships.

## 6. Teacher materials (author after Gr3–5 verified)

Same set as the DigCit suite — port `scripts/gen-site.js`, remapping the
substrand legend to the AI-adjacent strands above:
- Suite-level **curriculum guide** (purpose, CLEAR-style reasoning, deploy, free/paid).
- **Two implementation plans**, one per band (3–5, 6–8).
- **Per-activity teacher launch pages** (`ai-gradeN.html`) — premise + standards
  alignment + classroom suggestions. **NO answers.**
- **Correlation guide** (`correlation.html`) — table per band: Activity | Locks |
  TEKS § · substrand | reasoning focus. Paraphrase, cite §, link tea.texas.gov,
  "aligned to / not legal advice" disclaimer.
- **Answer key** (`answer-key.html`) — AES-256 client-side, password-gated
  (client-side crypto is fine for answer keys only).

## 7. Free/paid split + hosting (same model as the DigCit suite)

**Free tier = Grades 3, 4, 5** (fully static). **Paid tier = Grades 6, 7, 8** +
any future "MORE" activities. Do **NOT** gate paid content client-side. Paid HTML
must never leave the server without server-side session auth. Clone `hosting/`
(nginx + Node gateway, per-district accounts) from the DigCit suite; keep free
and paid trees physically separate. Ship the free static tier first, add the
auth app + paid tier once Gr6–8 is verified.

## 8. Suggested execution order

1. Build Gr4 + Gr5 English (clone Gr3) → `node scripts/bake.js && node scripts/gen-html.js && node solve-test.js` → free tier content complete.
2. Port `gen-site.js`: band hubs, suite landing, policy, teacher launch pages, correlation, guide; remap substrand legend.
3. Build Gr6–8 English (paid) → verify.
4. Translation pass (all 6) → re-verify EN + one non-EN + one RTL each.
5. Answer key (AES-256).
6. Hosting: free static (nginx); then auth app + paid tier (clone from DigCit).
7. Re-theme favicon/OG image to the AI suite (currently the DigCit padlock is reused).

## 9. Definition of done (per activity)

- [ ] `src/ai-gradeN.json`: 6 clues (1 decoy), 4 locks, every lock has a `reason`
- [ ] Baked locale + generated student HTML (indigo/cyan palette, `../assets/` paths)
- [ ] `node solve-test.js` → PASS in EN + ZH + AR, zero console errors
- [ ] 100% original / OER content; no real AI-product UIs, logos, or brand names
- [ ] Teacher launch page with standards alignment, no answers
```
