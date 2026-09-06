# AGENTS.md — Repository Conventions & Operating Guide

> **Note for AI Agents**: This file is the single source of truth for architectural constraints, styling rules, intentional section divergences, and operating procedures across this repository. Treat this document as strict operational law.

---

## 1. Stack & Architecture

- **Static Architecture**: Plain static HTML5, CSS3, and vanilla ES6+ JavaScript.
- **Zero Build Tools**: No bundler (Vite, Webpack), no CSS preprocessor (Sass/PostCSS), no JavaScript framework (React, Vue), and no package manager (`npm`, `yarn`, `pnpm`). Do not introduce `package.json`, `node_modules`, or build scripts.
- **Hosting & Deployment**: Hosted via GitHub Pages, serving directly from the `main` branch root directory.
- **Custom Domain**: Configured via `CNAME` at repository root (`andrespalaciovera.me`).
- **Clean URLs (Extensionless Linking)**:
  - GitHub Pages resolves extensionless URLs automatically.
  - **Rule**: All internal navigation links must omit `.html` (e.g., use `<a href="./petcare">`, `<a href="./clinbase">`, `<a href="./cro-audits/">`, and `<a href="./abettertreat">`).
  - Never add `.html` to internal anchor `href` attributes.

---

## 2. Design System & Design Tokens

- **Single Source of Truth**: [`css/tokens.css`](file:///css/tokens.css) defines all shared variables:
  - Base colors (`--bg-color`, `--text-color`, `--white`)
  - Typography (`--font-mono`: `'Space Mono'`, `--font-display`: `'Boldonse'`)
  - Border scale (`--border-thin`, `--border-medium`, `--border-thick`)
  - Card borders (`--card-border`, `--card-border-subtle`)
  - Radius scale (`--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`, `--radius-full`)
  - Dot-grid defaults (`--dot-color`, `--dot-size`, `--dot-spacing`)
- **Import Requirement**: All page stylesheets ([`css/index.css`](file:///css/index.css), [`css/style.css`](file:///css/style.css), [`css/cro-audits.css`](file:///css/cro-audits.css)) import tokens via:
  ```css
  @import "./tokens.css";
  ```
- **Zero Token Duplication**:
  - Always inspect `css/tokens.css` before introducing any new color, radius, or font rule.
  - Never hardcode duplicate values across stylesheets when a token exists or should be added to `tokens.css`.

---

## 3. Intentional Per-Section Differences (DO NOT "FIX")

The following differences are deliberate decisions agreed upon with the site owner. Do not refactor or "standardize" them:

- **Canvas Mode & Dot Grid**:
  - **Case studies** ([`css/style.css`](file:///css/style.css) for `petcare.html`, `clinbase.html`): Uses a dark canvas (`background-color: #121212`) with a tighter dot-grid. This is an intentional immersive treatment for long-form narrative studies.
  - **Homepage & Audits** ([`css/index.css`](file:///css/index.css), [`css/cro-audits.css`](file:///css/cro-audits.css)): Uses a light canvas (`--bg-color: #f8f8f8`) with standard dot-grid spacing.
- **`<h2>` Logotype Treatment in Case Studies**:
  - In `css/style.css`, `h2` uses `'Space Mono'` as a deliberate "brand name" / logotype styling (e.g., `"PetCare.co"`).
  - Do **not** replace this with the display font `Boldonse` used for section headings on other pages.
- **Per-Page Heading Scale**:
  - Heading sizes (`h1`–`h4`) are deliberately tailored to content density:
    - **Homepage**: Compact scale (optimized for modular card grids).
    - **Case Studies**: Large, narrative scale (optimized for long-form reading pacing).
    - **CRO Audits**: Medium scale (optimized for fast scanning).
  - Do **not** consolidate or unify into a single global type scale.
- **Body Text Density in Audits**:
  - `cro-audits.css` intentionally uses `font-size: 15px; line-height: 1.6;` for body copy.
  - The rest of the site uses `16px / 1.5`–`1.6`. This denser setting is deliberate for fast-read audit formats.

---

## 4. The `/cro-audits/` Section Conventions

### 4.1 Scrolling & Interactivity Constraints
- **100% Plain Vertical Native Scroll**:
  - **Never** import, adapt, or initialize GSAP, `ScrollTrigger`, scroll-pinning, or horizontal pinning in `/cro-audits/`.
  - **Never** adapt the mobile stepper or lightbox system from `js/script.js` or `js/petcare.js`. Those are strictly exclusive to long-form case studies.
  - Keep audit pages completely dependency-free and lightweight.

### 4.2 File & URL Structure
- **Flat File Convention**:
  - Store individual audit pages directly inside `cro-audits/` as flat HTML files (e.g., `cro-audits/abettertreat.html`), served cleanly as `/cro-audits/abettertreat`.
  - **Do not** create nested subdirectories with individual `index.html` files for audits.
  - Hub page is `cro-audits/index.html` (accessible as `/cro-audits/`).

### 4.3 Screenshot Assets & Naming
- **Directory Location**: All audit screenshots live under `assets/cro-audits/<store-name>/` (e.g., `assets/cro-audits/abettertreat/`).
- **Descriptive Naming**:
  - Files must be named descriptively based on content (e.g., `pdp-benefit-clarity.png`, `pdp-safety-signals.png`, `pdp-reviews-trust.png`).
  - **Never** use sequential or generic identifiers (e.g., `image1.png`, `screenshot-02.png`).

### 4.4 Finding Block Visual & Layout Rules
- **Image Styling**:
  - Images inside `.finding-figure` must **not** have borders or drop shadows (`border: none; box-shadow: none;`). Screenshots already include native UI borders and visual framing.
  - Only apply border-radius and width constraints.
- **Desktop Layout**:
  - 2-column flex row (`.finding-layout`).
  - **Left Column**: Screenshot figure (`.finding-figure`, capped width ~172px; ~25% smaller than original draft sizing).
  - **Right Column**: Content container (`.finding-content`) containing the `.finding-body` paragraph, immediately followed by stacked callout boxes (`.why-matters-box`, and `.gaps-box` where applicable).
- **Mobile Layout (`<= 480px`)**:
  - Full-width stacked layout.
  - Strict display order: `finding-pill` -> `h2` title -> `finding-body` paragraph -> screenshot image (`.finding-figure`) -> `why-matters-box` (and `gaps-box` where present). The image sits directly between the body copy and the callout boxes.

### 4.5 Homepage Entry Point ("Teardown Lab: CRO Audits")
- **Visual & Semantic Subordination**:
  - Must remain strictly subordinate to the primary client work section ("See it in action!").
  - Uses `<h3>` for `.audit-section-title` (vs `<h2>` for "See it in action!").
  - Card styling uses a lighter/subtle dashed border (`.audit-entry-card` with `border: 1.5px dashed var(--text-color)`) compared to the solid 2px border on `.case-card`.
  - Stays in its own dedicated container (`.grid-audits`), completely separate from `.grid-cases`.
  - **Never** place audit cards inside `.grid-cases`.
  - **Never** hijack, replace, or reuse the `"New Product Case Study — Confidential"` placeholder card in `index.html` (that card is reserved for a future, unrelated client case study).

---

## 5. Agent Operating Rules & Working Guidelines

- **No Plausible Fabrications**:
  - Never invent placeholder copy that reads like real data (store metrics, findings, client testimonials, emails, or phone numbers).
  - Always use unambiguous bracketed placeholders: `[PLACEHOLDER — pending]` or `[PLACEHOLDER — contact info pending]`.
- **Pre-Flight Planning for Sitewide Changes**:
  - Before making multi-file or sitewide changes, audit existing conventions first and provide a concise plan for user approval before writing code.
- **Active Outreach Protection (High-Stakes Pages)**:
  - `index.html`, `petcare.html`, and `clinbase.html` are live production pages actively used in client outreach.
  - When proposing changes to these three pages, explicitly flag the impact and request visual confirmation/review before committing changes.
- **Direct File Editing**:
  - Prefer direct file edits over generating ad-hoc Python, Bash, or base64-injection scripts.
