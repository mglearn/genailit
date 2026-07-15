# Gen AI Literacy Breakouts

A suite of **Critical Thinking Online Breakouts (CTOBs)** for **Generative AI
Literacy**, aligned to the **Texas TEKS Technology Applications** standard
(adopted 2022, required K–8), grades **3–8**, in **7 languages**. Sibling to the
Digital Citizenship Breakouts — same escape-room engine, same build pipeline,
different curriculum: this suite lives in the **AI-adjacent TEKS strands**
(Computational Thinking, Creativity & Innovation, Data Literacy, Practical
Technology Concepts) rather than the Digital Citizenship strand.

Each activity is a self-contained escape-room: six clues (one a decoy), four
locks, and a revealed *reason* after every lock — the reasoning is the point.
Runs entirely in the browser; no logins, no data collected.

## The activities

| Grade | Title | TEKS | Tier |
|-------|-------|------|------|
| 3 | Meet the Machine that Guesses | §126.8 | free |
| 4 | Garbage In, Garbage Out | §126.9 | free |
| 5 | The Prompt Lab | §126.10 | free |
| 6 | Real or Generated? | §126.17 | licensed |
| 7 | Bias in the Machine | §126.18 | licensed |
| 8 | Build with AI, Responsibly | §126.19 | licensed |

Grade 3 is built and verified; Grades 4–8 are specced in [`plan.md`](plan.md).
Languages: English, Spanish, Vietnamese, Arabic (RTL), Hindi, Urdu, Chinese.
Non-English text is AI-seeded and pending native-speaker review.

## Build pipeline

Content flows **src JSON + translation overlays → baker → locale JS → student
HTML**. Structure always comes from English, so a translation can never break a
lock.

```bash
npm install                      # jsdom (test harness only)
node scripts/bake.js             # src/*.json + i18n/*.json -> locales/*.js
node scripts/gen-html.js         # -> *-student.html
node solve-test.js               # QUALITY GATE — must print ALL PASS
```

### Authoring a new activity

1. Write `grade{band}/src/ai-gradeN.json` (see `ai-grade3.json` — 6 clues incl.
   one `"decoy": true`, 4 locks each with a `reason`).
2. Run the pipeline above. `solve-test.js` enforces the invariants (6 clues + a
   decoy, 4 locks each with a reason, mc/seq/multi structure, UI-key parity, and
   that every lock renders and solves to the win screen with zero console errors).
3. Translation overlays (`i18n/ai-gradeN.<lang>.json`) come in a later pass.

## Content rules

100% original / OER content. TEKS skills are paraphrased — cite the § and read
the source at [tea.texas.gov](https://tea.texas.gov); alignment is a good-faith
mapping for planning, not legal advice. **No real AI-product UIs, screenshots,
logos, or brand names** — activities use generic terms (an AI helper, a chatbot,
an image generator). No photos of children.

## Relationship to the Digital Citizenship suite

The `assets/` engine is copied from the DigCit suite and must not be edited here
(fix it there, re-copy). The two suites are deployed independently with the same
free/paid hosting model (see that suite's `hosting/`).
