/* ============================================================
   POSTPARTUM GUIDE – app.js
   Plain ES6 single-page app. No frameworks, no build step.
   Serves from the same folder as index.html.

   Flow:
     init()
       └─ loadCards()
             ├─ showLoading()       while fetch is in-flight
             ├─ showSymptomList()   on success
             └─ showError()         on failure  →  retry → loadCards()

     Card tap → showSymptomDetail(slug)
     Back btn → showSymptomList()
   ============================================================ */


/* ─────────────────────────────────────────────────────────────
   STATE
   ──────────────────────────────────────────────────────────── */

/** All 25 SymptomCard objects once loaded from JSON. */
let allCards = [];


/* ─────────────────────────────────────────────────────────────
   ENTRY POINT
   ──────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', init);

function init() {
  loadCards();
}


/* ─────────────────────────────────────────────────────────────
   DATA LOADING
   ──────────────────────────────────────────────────────────── */

/**
 * Fetch bf_symptom_cards.json, then render list or error.
 * Called on first load and again if the user taps "Try again".
 */
async function loadCards() {
  showLoading();
  try {
    const res = await fetch('bf_symptom_cards.json');
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    allCards = await res.json();

    // Guard: make sure we got an array
    if (!Array.isArray(allCards)) throw new Error('Unexpected data format');

    showSymptomList();
  } catch (err) {
    showError(err.message);
  }
}


/* ─────────────────────────────────────────────────────────────
   RENDER HELPERS
   ──────────────────────────────────────────────────────────── */

/** Shorthand for the root container. */
const root = () => document.getElementById('app-root');

/**
 * Write HTML into #app-root and trigger the screen-enter animation
 * defined in styles.css.
 * @param {string} html
 */
function setContent(html) {
  const el = root();
  el.innerHTML = html;
  // Attach animation to the first child so only new content animates
  const first = el.firstElementChild;
  if (first) {
    first.classList.remove('screen-enter'); // reset if re-rendering same screen
    void first.offsetWidth;                 // force reflow so animation replays
    first.classList.add('screen-enter');
  }
}

/**
 * Safely escape a string so it can't inject HTML.
 * Used for all data coming out of the JSON.
 * @param {string|null|undefined} str
 * @returns {string}
 */
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}


/* ─────────────────────────────────────────────────────────────
   SEVERITY PILL HELPER
   Maps the severity string from JSON → readable label + CSS class
   ──────────────────────────────────────────────────────────── */

const SEVERITY_MAP = {
  red:    { label: 'Urgent Care',      cls: 'severity-pill--red'    },
  yellow: { label: 'Attention Needed', cls: 'severity-pill--yellow' },
  green:  { label: 'All Good',         cls: 'severity-pill--green'  },
};

/**
 * Returns an HTML string for a coloured severity pill.
 * @param {string} severity  'red' | 'yellow' | 'green'
 * @returns {string}
 */
function severityPill(severity) {
  const s = SEVERITY_MAP[severity] ?? SEVERITY_MAP.green;
  return `<span class="severity-pill ${s.cls}">${s.label}</span>`;
}


/* ─────────────────────────────────────────────────────────────
   CATEGORY LABEL HELPER
   Maps the slug-style category value → display text
   ──────────────────────────────────────────────────────────── */

const CATEGORY_MAP = {
  'breast':         'Breast',
  'nipple':         'Nipple',
  'baby-behaviour': 'Baby Behaviour',
  'emotional':      'Emotional',
};

/**
 * Returns a human-readable category label.
 * Falls back gracefully to the raw value if not in the map.
 * @param {string} cat
 * @returns {string}
 */
function formatCategory(cat) {
  return CATEGORY_MAP[cat] ?? cat;
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: LOADING
   Structure matches symptoms-loading.html exactly:
   – Page header with pulsing dot
   – 5 skeleton cards (varied widths, last two fading out)
   – Each card has title bar, sub-label bar, icon square, two pill bars
   Uses .skeleton-pulse breathing animation from styles.css.
   Tailwind classes work here because the CDN is loaded on the page.
   ──────────────────────────────────────────────────────────── */

function showLoading() {
  // Title-bar widths, sub-label widths, pill widths, opacity — one entry per card
  const cards = [
    { title: 'w-3/4', sub: 'w-1/2', pill1: 'w-24', pill2: 'w-32', extra: '' },
    { title: 'w-2/3', sub: 'w-2/5', pill1: 'w-20', pill2: 'w-28', extra: '' },
    { title: 'w-5/6', sub: 'w-1/3', pill1: 'w-24', pill2: 'w-24', extra: '' },
    { title: 'w-3/5', sub: 'w-1/2', pill1: 'w-28', pill2: 'w-20', extra: '' },
    { title: 'w-1/2', sub: 'w-1/4', pill1: 'w-24', pill2: '',      extra: 'opacity-60' },
  ];

  const skeletons = cards.map(c => `
    <div class="bg-surface-container-low rounded-3xl p-6 transition-all ${c.extra}">
      <div class="flex justify-between items-start mb-6">
        <div class="space-y-3 flex-1">
          <div class="h-6 ${c.title} bg-surface-container-highest rounded-full skeleton-pulse"></div>
          <div class="h-4 ${c.sub}  bg-surface-container-high  rounded-full skeleton-pulse"></div>
        </div>
        <!-- Icon-placeholder square (matches the arrow_forward icon area in real cards) -->
        <div class="w-10 h-10 bg-surface-container-high rounded-2xl skeleton-pulse flex-shrink-0 ml-4"></div>
      </div>
      <div class="flex gap-3">
        <div class="h-8 ${c.pill1} bg-primary-container/30   rounded-full skeleton-pulse"></div>
        ${c.pill2 ? `<div class="h-8 ${c.pill2} bg-secondary-container/30 rounded-full skeleton-pulse"></div>` : ''}
      </div>
    </div>
  `).join('');

  setContent(`
    <div class="pt-6 pb-4 px-2">

      <!-- Page heading + animated loading indicator -->
      <div class="mb-10 text-center md:text-left px-2">
        <h1 class="font-headline text-4xl text-on-surface mb-3">Breastfeeding symptoms</h1>
        <div class="loading-status justify-center md:justify-start">
          <div class="loading-dot skeleton-pulse"></div>
          <p class="text-on-surface-variant">Loading symptoms…</p>
        </div>
      </div>

      <!-- Skeleton card list -->
      <div class="space-y-8">
        ${skeletons}
      </div>

    </div>
  `);
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: ERROR
   Structure matches symptom error state.html:
   – SVG organic blob behind the icon circle
   – cloud_off icon (light weight, secondary colour)
   – Heading + body copy
   – Primary gradient "Try again" button
   – Secondary "Back to home" text link (only shown if cards
     were previously loaded so there is a list to return to)
   – Two ambient background blobs (fixed, pointer-events-none)
   ──────────────────────────────────────────────────────────── */

/**
 * @param {string} [message]  Optional technical detail shown in tiny print.
 */
function showError(message = '') {
  setContent(`
    <div class="flex flex-col items-center justify-center text-center px-8 pt-12 pb-32 min-h-[55vh]">

      <!-- Icon illustration: SVG organic blob + icon circle -->
      <div class="relative mb-12">

        <!-- Soft atmospheric glow behind everything -->
        <div class="absolute -inset-10 bg-secondary-container/20 blur-3xl rounded-full"></div>

        <!-- Centred icon circle, layered on top of SVG -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-24 h-24 rounded-full bg-surface-container-low
                      border border-outline-variant/20
                      flex items-center justify-center">
            <span
              class="material-symbols-outlined text-secondary text-5xl"
              style="font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24;"
            >cloud_off</span>
          </div>
        </div>

        <!-- Organic blob SVG (decorative backdrop shape) -->
        <svg
          class="w-48 h-48 text-surface-container-high/40"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M45.7,-77.6C58.1,-69.5,66.4,-54.6,73.4,-39.8C80.4,-25.1,86.1,-10.5,85.6,3.9
               C85,18.3,78.2,32.5,69.5,45.3C60.8,58.1,50.1,69.5,37.3,75.8C24.4,82.1,9.4,83.4,
               -5,82.4C-19.4,81.4,-33.1,78.1,-46.3,71.5C-59.5,64.9,-72.1,55,-79.1,42.2
               C-86.2,29.4,-87.7,13.7,-85.4,-1.3C-83.1,-16.3,-77,-30.6,-68.2,-43.3
               C-59.4,-56,-47.9,-67.2,-34.5,-74.6C-21,-82,-10.5,-85.7,2.5,-90
               C15.4,-94.3,33.3,-85.8,45.7,-77.6Z"
            fill="currentColor"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      <!-- Copy -->
      <div class="max-w-md mx-auto">
        <h1 class="text-3xl md:text-4xl text-on-surface font-semibold leading-tight mb-6 font-headline">
          We couldn't load the symptom cards right now.
        </h1>
        <p class="text-lg text-on-surface-variant leading-relaxed mb-12">
          Please check your connection or try again in a moment.
        </p>

        <!-- Buttons -->
        <div class="flex flex-col gap-6 items-center">

          <!-- Primary CTA – gradient pill button matching DESIGN.md -->
          <button
            id="retry-btn"
            type="button"
            class="group relative w-full sm:w-64 h-14
                   bg-gradient-to-r from-primary to-primary-dim
                   text-on-primary rounded-full font-semibold
                   shadow-[0_12px_24px_rgba(70,103,67,0.15)]
                   hover:shadow-[0_16px_32px_rgba(70,103,67,0.20)]
                   transition-all flex items-center justify-center gap-3"
          >
            <span class="material-symbols-outlined text-xl group-hover:rotate-45 transition-transform">
              refresh
            </span>
            Try again
          </button>

          <!-- Secondary link – only shown when a previous list load succeeded -->
          ${allCards.length > 0 ? `
            <button
              id="back-home-btn"
              type="button"
              class="text-primary font-bold px-8 py-3 rounded-full
                     hover:bg-primary-container/30 transition-colors
                     flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-lg">arrow_back</span>
              Back to symptoms
            </button>
          ` : ''}

          <!-- Technical detail (non-alarming, tiny) -->
          ${message ? `
            <p class="text-[0.6875rem] text-on-surface-variant opacity-60 text-center">
              ${esc(message)}
            </p>
          ` : ''}

        </div>
      </div>

    </div>

    <!-- Ambient background glows – fixed so they fill the viewport -->
    <div class="fixed top-[20%] -left-20 w-80 h-80 bg-primary-container/10
                rounded-full blur-[100px] pointer-events-none -z-10"
         aria-hidden="true"></div>
    <div class="fixed bottom-[10%] -right-20 w-96 h-96 bg-secondary-container/15
                rounded-full blur-[120px] pointer-events-none -z-10"
         aria-hidden="true"></div>
  `);

  document.getElementById('retry-btn')
    .addEventListener('click', loadCards);

  // Only wired up when the button is actually rendered
  const backBtn = document.getElementById('back-home-btn');
  if (backBtn) backBtn.addEventListener('click', showSymptomList);
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: SYMPTOM LIST
   Renders all 25 cards from allCards.
   Matches the "symptoms_list.html" design.
   ──────────────────────────────────────────────────────────── */

function showSymptomList() {
  // Keep the Symptoms tab looking active in the bottom nav
  setNavActive('symptoms');

  // Build one card button per SymptomCard
  const cardsHtml = allCards.map(card => `
    <button
      class="symptom-card"
      data-slug="${esc(card.slug)}"
      aria-label="View symptom: ${esc(card.title_user)}"
      type="button"
    >
      <div class="symptom-card__top">
        <div>
          <p class="symptom-card__category">${esc(formatCategory(card.category))}</p>
          <p class="symptom-card__title">${esc(card.title_user)}</p>
          <p class="symptom-card__clinical">Clinical: ${esc(card.title_clinical)}</p>
        </div>
        ${severityPill(card.severity)}
      </div>
      <div class="symptom-card__action">
        View guide
        <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
      </div>
    </button>
  `).join('');

  setContent(`
    <div>
      <!-- Page heading -->
      <header class="symptoms-header">
        <h1>Breastfeeding<br>symptoms</h1>
        <p>Tap the symptom that feels closest to what you're experiencing.</p>
      </header>

      <!-- Card list -->
      <section class="symptom-card-list" aria-label="Breastfeeding symptom cards">
        ${cardsHtml}
      </section>

      <!-- Warm encouragement banner at the bottom of the list -->
      <div class="encouragement-banner" aria-hidden="true">
        <h4>You're doing great, Mama.</h4>
        <p>It's normal to have questions. We're here to guide you through every feed.</p>
        <span class="material-symbols-outlined deco-icon">favorite</span>
      </div>
    </div>
  `);

  // Wire up each card button → detail screen
  root().querySelectorAll('.symptom-card').forEach(btn => {
    btn.addEventListener('click', () => showSymptomDetail(btn.dataset.slug));
  });
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: SYMPTOM DETAIL
   Matches the "symptom detail.html" design.
   Renders all rich fields from the matching SymptomCard.
   ──────────────────────────────────────────────────────────── */

/**
 * Find the card by slug and render the full detail view.
 * @param {string} slug  e.g. 'engorgement'
 */
function showSymptomDetail(slug) {
  const card = allCards.find(c => c.slug === slug);

  // Guard: unknown slug (shouldn't happen in practice)
  if (!card) {
    showError(`Could not find symptom: ${slug}`);
    return;
  }

  // ── Build sub-sections ──────────────────────────────────────

  // Numbered relief steps
  const stepsHtml = (card.immediate_relief_steps ?? [])
    .sort((a, b) => a.order - b.order)
    .map(step => `
      <div class="step-card">
        <div class="step-number" aria-hidden="true">${step.order}</div>
        <div class="step-body">
          <p class="step-title">${esc(step.title)}</p>
          <p class="step-desc">${esc(step.description)}</p>
        </div>
      </div>
    `).join('');

  // Do's bullet items
  const dosHtml = (card.dos ?? [])
    .map(d => `<li>${esc(d)}</li>`)
    .join('');

  // Don'ts bullet items
  const dontsHtml = (card.donts ?? [])
    .map(d => `<li>${esc(d)}</li>`)
    .join('');

  // Red flag bullet items
  const redFlagsHtml = (card.red_flags ?? [])
    .map(f => `<li>${esc(f)}</li>`)
    .join('');

  // ── Assemble the full detail page ──────────────────────────

  setContent(`
    <div style="padding:1.25rem 1rem 2rem;">

      <!-- ── Back button ──────────────────────────────────── -->
      <button class="detail-back-btn" id="back-btn" type="button" aria-label="Back to symptoms list">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Symptoms
      </button>

      <!-- ── Severity pill + category badge ───────────────── -->
      <div class="detail-badges">
        ${severityPill(card.severity)}
        <span class="category-badge">${esc(formatCategory(card.category))}</span>
      </div>

      <!-- ── Main title (what the mother feels) ────────────── -->
      <h1 class="detail-title">${esc(card.title_user)}</h1>

      <!-- ── Clinical name ─────────────────────────────────── -->
      <p class="detail-clinical">
        <span class="material-symbols-outlined" aria-hidden="true">clinical_notes</span>
        Clinical: ${esc(card.title_clinical)}
      </p>

      <!-- ── "What this likely is" intro card ─────────────── -->
      <div class="detail-intro-card">
        <h3>What this likely is</h3>
        <p>${esc(card.what_it_is)}</p>
        ${card.peak_timing ? `
          <p>
            <strong style="color:var(--primary-dim);font-weight:700;">Typical timing:</strong>
            ${esc(card.peak_timing)}
          </p>` : ''}
      </div>

      <!-- ── Immediate relief steps ───────────────────────── -->
      <section aria-labelledby="steps-heading">
        <div class="detail-section-header">
          <div class="detail-section-divider" aria-hidden="true"></div>
          <h3 id="steps-heading">Immediate relief steps</h3>
          <div class="detail-section-divider" aria-hidden="true"></div>
        </div>
        <div class="step-list">
          ${stepsHtml || '<p style="color:var(--on-surface-variant);font-size:0.875rem;">No specific steps listed.</p>'}
        </div>
      </section>

      <!-- ── Do's and Don'ts bento grid ───────────────────── -->
      <section aria-label="Dos and Don'ts">
        <div class="dos-donts-grid">

          <div class="dos-box">
            <div class="dos-box__header">
              <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
              Do's
            </div>
            <ul>${dosHtml}</ul>
          </div>

          <div class="donts-box">
            <div class="donts-box__header">
              <span class="material-symbols-outlined" aria-hidden="true">cancel</span>
              Don'ts
            </div>
            <ul>${dontsHtml}</ul>
          </div>

        </div>
      </section>

      <!-- ── Red flags callout ─────────────────────────────── -->
      <section class="red-flags-box" aria-labelledby="red-flags-heading">
        <div class="red-flags-box__header">
          <span class="material-symbols-outlined" aria-hidden="true">warning</span>
          <h3 id="red-flags-heading">Red flags — see a doctor if…</h3>
        </div>
        <ul>${redFlagsHtml}</ul>
        ${card.recommended_action_if_red_flags ? `
          <p class="red-flags-action">${esc(card.recommended_action_if_red_flags)}</p>
        ` : ''}
      </section>

      <!-- ── When to expect improvement ───────────────────── -->
      ${card.when_to_expect_improvement ? `
        <div class="improvement-block">
          <span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span>
          <h4>When to expect improvement</h4>
          <p>${esc(card.when_to_expect_improvement)}</p>
        </div>
      ` : ''}

      <!-- ── Medical disclaimer ────────────────────────────── -->
      <footer class="disclaimer-footer">
        <span class="disclaimer-label">Medical Disclaimer</span>
        <p>${esc(card.disclaimer)}</p>
      </footer>

    </div>
  `);

  // Scroll smoothly to the top so the user sees the back button
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Wire up the back button → return to list
  document.getElementById('back-btn')
    .addEventListener('click', showSymptomList);
}


/* ─────────────────────────────────────────────────────────────
   NAVIGATION STATE
   Sets aria-current on the active bottom nav tab.
   Kept simple and extensible: pass the tab name as a string.
   ──────────────────────────────────────────────────────────── */

/**
 * Mark one bottom-nav tab as the current page.
 * @param {'symptoms'|'positions'|'more'} tab
 */
function setNavActive(tab) {
  ['symptoms', 'positions', 'more'].forEach(id => {
    const btn = document.getElementById(`nav-${id}`);
    if (!btn) return;
    btn.setAttribute('aria-current', id === tab ? 'page' : 'false');
  });
}
