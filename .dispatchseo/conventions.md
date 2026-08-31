# Site facts — open-formation-civique.fr

Read completely before any SEO run. Discovered by reading this repo's actual
files (2026-08-31) — not assumed.

## Product

Open Formation Civique is a free, open source (GitHub: HugoGresse/open-formation-civique)
site of revision fiches and quizzes to prepare France's *formation civique*
and *examen de connaissance* (CSP — Contrat d'Intégration Républicaine — and
Carte de Résident / naturalisation). No login, no ads, no paid tier — the
"product" IS the free content itself (`website/src/content/docs/a-propos.mdx`).
Editor: Hugo Gresse (`a-propos.mdx`).

**Remit test for this site**: a page is on-remit if, read well, its natural
conclusion is "...and here are the fiches/quiz that cover it" — i.e. the
reader's next step is using this site's own content, not a third-party
product. There is no commercial upsell to protect against — the failure mode
here is the opposite: publishing thin/generic civic-content pages that don't
actually help someone pass the CSP/naturalisation test.

**Positioning** (read fresh each research run):
- `website/src/content/docs/a-propos.mdx` — what the site is, who runs it, sourcing
- `website/astro.config.mjs` — `siteTitle`/`siteDescription` (site-wide meta)
- `README.md` (repo root)

**Capability** (what actually exists to point new searches at):
- `website/src/content/docs/*/index.md` — one per section, lists what's covered
- `crawler/formation-civique-data.json` — the official source data the fiches are generated from
- `website/src/data/quizzes/*.json` — quiz question banks (CSP + Carte de Résident variants)

**Facets** (most direct first — measure weekly against DR, per the research playbook):
1. **CSP / examen de connaissance preparation** — revision fiches + quiz for the Contrat d'Intégration Républicaine test
2. **Carte de Résident / naturalisation exam prep** — same content, framed for the residency-card and naturalization track
3. **Droits et devoirs en France** — rights/duties explainers for newcomers (broader than just exam prep)
4. **Vivre en France** — practical life-in-France topics (démarches administratives, emploi, santé, parentalité) that overlap the exam syllabus
5. **Histoire, institutions et culture françaises** — the general-knowledge/culture-générale portion of the syllabus

Never: hosting stack, Astro/Starlight, crawler internals, or anything about
*how the site is built* — those are engineering topics, not this site's remit.

## Stack & build

- Astro 7 (main branch currently on Astro 5/Starlight 0.37 pending an
  upgrade PR — build commands below work on either) + Starlight, content
  collection `docs` (`website/src/content.config.ts`, stock `docsSchema()`,
  no schema extension).
- **This is a monorepo.** The real app is `website/` — its own
  `package.json`/`package-lock.json` (npm). Repo root has no package.json;
  ignore the stray root `package-lock.json` (empty stub) and `crawler/`
  (an unrelated scraper, not part of the built site).
- Package manager: npm. Install: `npm ci` (run inside `website/`).
- Build/verify: `npm run build:no-pdf` inside `website/` — plain
  `npm run build` also runs a slow Chromium-based PDF export
  (`scripts/build-pdf.js`); always prefer `build:no-pdf` for verification.
- Serve a production build: `npm run preview --prefix website` → port 4321
  (Astro's default; `.dispatchseo/serve` already encodes this).
- No CI validators beyond what this pipeline itself adds (no pre-existing
  lint/test gate on PRs at time of writing).

## Guides

- **Content dir**: `website/src/content/docs/`, split into 5 thematic
  sections that mirror the site's sidebar (`website/astro.config.mjs`
  `sidebar` block): `principes-et-valeurs/`, `systeme-institutionnel/`,
  `droits-et-devoirs/`, `histoire-geographie-culture/`, `vivre-en-france/`.
  Plus `quiz/` (quiz pages, generated) and a few standalone static pages at
  the content root (`a-propos.mdx`, `mentions-legales.mdx`,
  `politique-de-confidentialite.mdx`, `index.mdx`).
- **New SEO guides go inside the existing section that matches their topic**
  (never invent a 6th section without also adding it to `SECTION_LABELS` in
  `website/src/components/Head.astro` — see below). Most SEO opportunities in
  this niche (practical CSP/Carte de Résident procedures) fit `vivre-en-france/`
  or `droits-et-devoirs/`; general-knowledge queries fit
  `histoire-geographie-culture/` or `systeme-institutionnel/`.
- **⚠️ CRITICAL — the content dir is gitignored.** Repo root `.gitignore`
  excludes `website/src/content/docs/` entirely (comment: "Generated content
  (regenerated from JSON on build)"), because it's normally generated from
  `crawler/formation-civique-data.json` by `website/scripts/generate-pages.ts`.
  **Any new guide `.md`/`.mdx` file added there is invisible to a plain
  `git add` and will silently never be committed.** Every guide-build PR
  MUST force-add its new file(s): `git add -f website/src/content/docs/<section>/<slug>.md`.
  This is the exact pattern already used for the hand-written static pages
  (`a-propos.mdx`, `mentions-legales.mdx`, `politique-de-confidentialite.mdx`)
  — confirm with `git log --all -- <path>` if ever in doubt.
- **Frontmatter contract** (Starlight's stock `docsSchema()`, no custom
  fields): `title` (string, required), `description` (string, required —
  used as meta description). Optional: `template: doc`, `next: false`,
  `prev: false` (static pages set these; thematic fiches generally don't).
  No custom `date`/`author`/`tags` fields exist or are read anywhere.
- **Cover images — no convention exists yet, so this is the one to use**:
  place a page's cover under `website/public/covers/<slug>.png` (served at
  `/covers/<slug>.png`), and set it via Starlight's native `head` frontmatter
  array rather than a schema change:
  ```yaml
  head:
    - tag: meta
      attrs: { property: 'og:image', content: '/covers/<slug>.png' }
  ```
  Generate it with `.dispatchseo/generate-cover.mjs` exactly as shipped
  (`--out website/public/covers`). Do not add a raw `cover:` frontmatter key
  — `docsSchema()` is not extended in `content.config.ts`, so an unknown key
  either gets silently stripped or fails the build.
- **What renders automatically**: sitemap entry with tuned priority/changefreq
  by section (`website/astro.config.mjs` `serializeSitemapEntry`); Starlight's
  built-in right-side "On this page" ToC on every doc page (this IS the
  reading rail — no custom sidebar/CTA component needed); per-page
  BreadcrumbList + LearningResource JSON-LD and OG/Twitter meta
  (`website/src/components/Head.astro`, keyed off the top-level section
  folder via `SECTION_LABELS` — a new top-level section needs a new entry
  there or it loses its breadcrumb label).
- **Internal linking**: existing fiches cross-link with plain Markdown links
  to sibling pages within a section; no auto-generated "related posts".
- **Exemplar pages to read before drafting**:
  `website/src/content/docs/vivre-en-france/emploi.md` (typical fiche shape),
  `website/src/content/docs/systeme-institutionnel/democratie-et-droit-de-vote.md`,
  `website/src/content/docs/a-propos.mdx` (voice reference for a standalone page).

## Tools

No public tools/calculators surface exists yet (`website/src/pages` only has
`slides/`; no `/tools`, `/outils`, `/calculateurs` route or registry). Intended
plan for the first tool build to scaffold (per the build-tool playbook — this
is deliberately NOT scaffolded during setup, to avoid pre-guessing UI the
owner hasn't seen):
- **Public base path**: `/outils/` (French, matching the site's other French
  routes — never `/tools`).
- **Registry**: create `website/src/data/tools.ts` (or `.json`, matching the
  `website/src/data/quizzes/` convention) — slug, title, h1, one-line value
  statement, meta description, FAQ items, widget component reference.
- **Index page**: new Astro page or Starlight doc at `/outils/` listing
  registry entries as cards.
- **Detail template**: new dynamic route `website/src/pages/outils/[slug].astro`
  (mirroring `website/src/pages/slides/[quiz].astro`'s dynamic-route shape)
  rendering: title → value line → widget → CTA back to the fiches/quiz
  content → description → FAQ.
- **Sitemap**: covered automatically once pages exist (astro-sitemap covers
  every built route already).
- Good first-tool candidates given the niche: a CSP/Carte de Résident
  eligibility checker, a naturalization *délai* (waiting-time) estimator, a
  quiz-score practice tracker — but the actual pick is a research-run
  decision, not fixed here.

## Design system

- Starlight's own CSS custom-property theme (no site-specific `@theme`
  block) — Starlight defaults are used as-is; the only overrides are
  `website/src/styles/quiz.css` and `website/src/styles/content.css`
  (`customCss` in `astro.config.mjs`). `content.css` currently only
  constrains in-content image sizing.
- Logo/favicon: `website/public/favicon.png`, `website/public/logo/`.
- Custom components (`website/src/components/`): `Footer.astro`,
  `Head.astro` (see above — per-page SEO/structured-data logic lives here,
  do not touch it for a normal guide), `Quiz.astro`, `QuizCard.astro`,
  `QuizSummary.astro` (quiz UI — a useful reference if a future tool needs
  a similar multi-question interactive shape).
- Icon language: none custom — relies on Starlight's defaults.

## Voice & writing rules

- French, formal/neutral register matching official government-style
  explainer text (see any existing fiche). Frequent **bold** for key terms
  and legal/constitutional article references (e.g. "l'article 4 de la
  Constitution française").
- **Non-breaking space before French double punctuation** (`?`, `!`, `:`,
  `;`) — e.g. `ce site&nbsp;?` in `a-propos.mdx`. Use `&nbsp;` (or ` `)
  before these marks in new prose, per French typographic convention already
  followed in this repo.
- No visible byline on fiche/quiz pages; `a-propos.mdx` is the only page
  crediting Hugo Gresse by name. Do not add an author line to guide pages.
- No humanizer skill present in this repo.
- Section separators use a plain `* * *` markdown thematic break (seen in
  existing fiches) rather than a custom component.

## Analytics

- Plausible (`website/astro.config.mjs` → Starlight `head`), script tag with
  `data-domain="open-formation-civique.fr"` pointed at
  `https://plausible.gresse.io/js/script.js`. No custom event tracking
  helper exists — page-view only.
