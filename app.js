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


/* ─────────────────────────────────────────────────────────────
   MEAL PLAN — DATA + STATE
   ──────────────────────────────────────────────────────────── */

/** All 40 MealDay objects once loaded from JSON. */
let mealPlan = [];

/** Currently selected day (1–40) in the detail view. */
let selectedDay = 1;

/** Active tab in detail view: 'mom' | 'baby' */
let activeMealTab = 'mom';

/**
 * Calculate the current journey day based on localStorage start date.
 * Day 1 on first open; increments each calendar day; caps at 40.
 */
function getCurrentDay() {
  let startDate = localStorage.getItem('navya_start_date');
  if (!startDate) {
    startDate = new Date().toISOString();
    localStorage.setItem('navya_start_date', startDate);
  }
  const daysSince = Math.floor((Date.now() - new Date(startDate)) / 86400000);
  return Math.min(Math.max(daysSince + 1, 1), 40);
}


/* ─────────────────────────────────────────────────────────────
   MEAL PLAN — DATA LOADING
   ──────────────────────────────────────────────────────────── */

/**
 * Fetch meal_plan.json, then render the meal plan home screen.
 */
async function loadMealPlan() {
  showMealLoading();
  try {
    const res = await fetch('meal_plan.json');
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    mealPlan = await res.json();
    if (!Array.isArray(mealPlan)) throw new Error('Unexpected data format');
    showMealPlanHome();
  } catch (err) {
    showError(err.message);
  }
}

/**
 * Quick loading state while fetching meal_plan.json.
 */
function showMealLoading() {
  setNavActive('meal-plan');
  setContent(`
    <div class="pt-6 pb-4 px-2">
      <div class="mb-10 text-center px-2">
        <h1 class="font-headline text-4xl text-on-surface mb-3">40-Day Meal Plan</h1>
        <div class="loading-status justify-center">
          <div class="loading-dot skeleton-pulse"></div>
          <p class="text-on-surface-variant">Loading your plan…</p>
        </div>
      </div>
      <div class="space-y-4">
        ${[1,2,3].map(() => `
          <div class="bg-surface-container-low rounded-3xl p-5">
            <div class="h-5 w-3/4 bg-surface-container-highest rounded-full skeleton-pulse mb-3"></div>
            <div class="h-4 w-1/2 bg-surface-container-high rounded-full skeleton-pulse"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `);
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: MEAL PLAN HOME
   ──────────────────────────────────────────────────────────── */

/**
 * Render the meal plan home: day strip + today card + phase overview.
 */
function showMealPlanHome() {
  setNavActive('meal-plan');
  const today = getCurrentDay();
  const todayData = mealPlan.find(d => d.day === today) || mealPlan[0];

  // Phase definitions for the overview cards
  const phases = [
    { num: 1, name: 'Phase 1 — Days 1–7',   theme: 'Rest, warmth & first healing foods',        icon: 'spa',             startDay: 1,  iconCls: 'phase-icon--1' },
    { num: 2, name: 'Phase 2 — Days 8–14',  theme: 'Milk establishment & strength building',    icon: 'water_drop',      startDay: 8,  iconCls: 'phase-icon--2' },
    { num: 3, name: 'Phase 3 — Days 15–21', theme: 'Strength rebuilding & gradual normalcy',    icon: 'fitness_center',  startDay: 15, iconCls: 'phase-icon--3' },
    { num: 4, name: 'Phase 4 — Days 22–35', theme: 'Gradual normalcy & full diet recovery',     icon: 'restaurant',      startDay: 22, iconCls: 'phase-icon--4' },
    { num: 5, name: 'Phase 5 — Days 36–40', theme: 'Milestone celebration & beyond',            icon: 'celebration',     startDay: 36, iconCls: 'phase-icon--5' },
  ];

  // 40 day pills
  const pillsHtml = mealPlan.map(d => {
    let cls = 'day-pill';
    if (d.day === today) cls += ' day-pill--today';
    else if (d.day < today) cls += ' day-pill--past';
    return `<button class="${cls}" data-day="${d.day}" type="button" aria-label="Day ${d.day}">${d.day}</button>`;
  }).join('');

  // Phase cards
  const phaseCardsHtml = phases.map(p => `
    <button class="phase-card" data-start-day="${p.startDay}" type="button">
      <div class="phase-icon ${p.iconCls}">
        <span class="material-symbols-outlined" style="font-size:1.25rem;">${p.icon}</span>
      </div>
      <div class="phase-card-body">
        <p class="phase-card-name">${esc(p.name)}</p>
        <p class="phase-card-theme">${esc(p.theme)}</p>
      </div>
      <span class="material-symbols-outlined">chevron_right</span>
    </button>
  `).join('');

  setContent(`
    <div>
      <!-- Page header -->
      <header class="meal-header">
        <h1>40-Day<br>meal plan</h1>
        <p>Personalised nourishment for you and your baby — day by day.</p>
      </header>

      <!-- Day progress strip -->
      <div class="day-strip-wrapper px-1">
        <p class="day-strip-label">Your journey — day ${today} of 40</p>
        <div class="day-strip" id="day-strip" role="list" aria-label="Day selector">
          ${pillsHtml}
        </div>
      </div>

      <!-- Today's summary card -->
      <div class="today-card mx-1">
        <p class="today-day-label">Today · Day ${today}</p>
        <h2>${esc(todayData.phase)}</h2>
        <p class="phase-theme">${esc(todayData.phase_theme)}</p>
        <p class="meal-preview">
          <strong>Breakfast</strong> ${esc(todayData.mom.meals.breakfast.name)}<br>
          <strong>Lunch</strong> ${esc(todayData.mom.meals.lunch.name)}<br>
          <strong>Dinner</strong> ${esc(todayData.mom.meals.dinner.name)}
        </p>
        <button class="view-plan-btn" id="view-today-btn" type="button">
          <span class="material-symbols-outlined" style="font-size:1.1rem;">restaurant_menu</span>
          View today's full plan
        </button>
      </div>

      <!-- Phase overview -->
      <p class="phase-section-label px-1">Browse by phase</p>
      <section class="phase-card-list px-1" aria-label="Meal plan phases">
        ${phaseCardsHtml}
      </section>

      <!-- Warm footer -->
      <div class="encouragement-banner mx-1">
        <h4>You are nourishing two lives.</h4>
        <p>Every meal you eat feeds your recovery and your baby. Small, warm, and consistent — that's all it takes.</p>
        <span class="material-symbols-outlined deco-icon">restaurant</span>
      </div>
    </div>
  `);

  // Wire today button
  document.getElementById('view-today-btn')
    .addEventListener('click', () => showDayDetail(today));

  // Wire day pills
  root().querySelectorAll('.day-pill').forEach(btn => {
    btn.addEventListener('click', () => showDayDetail(parseInt(btn.dataset.day, 10)));
  });

  // Wire phase cards
  root().querySelectorAll('.phase-card').forEach(btn => {
    btn.addEventListener('click', () => showDayDetail(parseInt(btn.dataset.startDay, 10)));
  });

  // Scroll today's pill into view
  const todayPill = root().querySelector('.day-pill--today');
  if (todayPill) {
    setTimeout(() => todayPill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 120);
  }
}


/* ─────────────────────────────────────────────────────────────
   SCREEN: DAY DETAIL
   Renders the Mom / Baby two-tab view for a given day.
   ──────────────────────────────────────────────────────────── */

/**
 * @param {number} day   1–40
 * @param {'mom'|'baby'} [tab]  Which tab to show first
 */
function showDayDetail(day, tab = 'mom') {
  const data = mealPlan.find(d => d.day === day);
  if (!data) { showError(`Could not find day ${day}`); return; }

  selectedDay = day;
  activeMealTab = tab;

  const m = data.mom;
  const b = data.baby;

  // ── Mom tab HTML ──────────────────────────────────────────
  const snacksHtml = (m.meals.snacks || [])
    .map(s => `<li class="snack-item">${esc(s)}</li>`)
    .join('');

  const avoidHtml = (m.foods_to_avoid || [])
    .map(f => `<li>${esc(f)}</li>`)
    .join('');

  const momHtml = `
    <div id="tab-mom">
      <!-- Focus card -->
      <div class="meal-focus-card">
        <p>${esc(m.focus)}</p>
      </div>

      <!-- Breakfast -->
      <h3 class="meal-section-heading">
        <span class="material-symbols-outlined">breakfast_dining</span>
        Breakfast
      </h3>
      <div class="meal-item-card">
        <p class="meal-item-name">${esc(m.meals.breakfast.name)}</p>
        <p class="meal-item-why">${esc(m.meals.breakfast.why)}</p>
        <p class="meal-item-tip">${esc(m.meals.breakfast.recipe_tip)}</p>
      </div>

      <!-- Lunch -->
      <h3 class="meal-section-heading">
        <span class="material-symbols-outlined">lunch_dining</span>
        Lunch
      </h3>
      <div class="meal-item-card">
        <p class="meal-item-name">${esc(m.meals.lunch.name)}</p>
        <p class="meal-item-why">${esc(m.meals.lunch.why)}</p>
        <p class="meal-item-tip">${esc(m.meals.lunch.recipe_tip)}</p>
      </div>

      <!-- Dinner -->
      <h3 class="meal-section-heading">
        <span class="material-symbols-outlined">dinner_dining</span>
        Dinner
      </h3>
      <div class="meal-item-card">
        <p class="meal-item-name">${esc(m.meals.dinner.name)}</p>
        <p class="meal-item-why">${esc(m.meals.dinner.why)}</p>
        <p class="meal-item-tip">${esc(m.meals.dinner.recipe_tip)}</p>
      </div>

      <!-- Snacks -->
      <h3 class="meal-section-heading">
        <span class="material-symbols-outlined">nutrition</span>
        Snacks
      </h3>
      <ul class="snacks-list">${snacksHtml}</ul>

      <!-- Avoid -->
      <div class="avoid-box">
        <div class="avoid-box__header">
          <span class="material-symbols-outlined" style="font-size:1rem;">block</span>
          Foods to avoid today
        </div>
        <ul>${avoidHtml}</ul>
      </div>

      <!-- Hydration -->
      <div class="hydration-card">
        <span class="material-symbols-outlined">water_drop</span>
        <p>${esc(m.hydration_tip)}</p>
      </div>

      <!-- Tradition -->
      <div class="tradition-card">
        <span class="material-symbols-outlined">auto_awesome</span>
        <p>${esc(m.traditional_note)}</p>
      </div>
    </div>
  `;

  // ── Baby tab HTML ─────────────────────────────────────────
  const signsWellHtml = (b.signs_feeding_well || [])
    .map(s => `<li>${esc(s)}</li>`).join('');

  const signsWatchHtml = (b.signs_to_watch || [])
    .map(s => `<li>${esc(s)}</li>`).join('');

  const babyHtml = `
    <div id="tab-baby">
      <!-- Feeding overview cards -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.25rem;">
        <div class="baby-info-card">
          <p class="baby-info-card__label">Feeding type</p>
          <p class="baby-info-card__value">${esc(b.feeding_type)}</p>
        </div>
        <div class="baby-info-card">
          <p class="baby-info-card__label">Feeds per day</p>
          <p class="baby-info-card__value">${esc(b.feeds_per_day)}</p>
        </div>
      </div>

      <!-- What to expect -->
      <h3 class="meal-section-heading meal-section-heading--baby">
        <span class="material-symbols-outlined" style="color:var(--secondary);">child_care</span>
        What to expect today
      </h3>
      <div class="meal-focus-card" style="background:rgba(255,218,212,0.15);">
        <p>${esc(b.what_to_expect)}</p>
      </div>

      <!-- Signs grid -->
      <div class="signs-grid">
        <div class="signs-box signs-box--well">
          <div class="signs-box__header">
            <span class="material-symbols-outlined">check_circle</span>
            Signs all is well
          </div>
          <ul>${signsWellHtml}</ul>
        </div>
        <div class="signs-box signs-box--watch">
          <div class="signs-box__header">
            <span class="material-symbols-outlined">warning</span>
            Signs to watch
          </div>
          <ul>${signsWatchHtml}</ul>
        </div>
      </div>

      <!-- Latch tip -->
      <h3 class="meal-section-heading meal-section-heading--baby">
        <span class="material-symbols-outlined" style="color:var(--secondary);">tips_and_updates</span>
        Today's feeding tip
      </h3>
      <div class="latch-tip-card">
        <p class="latch-tip-card__label">Latch &amp; feeding guidance</p>
        <p>${esc(b.latch_tip)}</p>
      </div>
    </div>
  `;

  // ── Assemble the full detail page ──────────────────────────
  setContent(`
    <div class="meal-detail-wrap">

      <!-- Back button -->
      <button class="detail-back-btn" id="meal-back-btn" type="button" aria-label="Back to meal plan">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Meal plan
      </button>

      <!-- Day badge + phase -->
      <div class="detail-badges">
        <span class="category-badge">Day ${day}</span>
        <span class="category-badge">${esc(data.phase.split('—')[0].trim())}</span>
      </div>

      <!-- Title -->
      <h1 class="detail-title">${esc(data.phase_theme)}</h1>
      <p class="detail-clinical">
        <span class="material-symbols-outlined" aria-hidden="true">restaurant_menu</span>
        ${esc(data.phase)}
      </p>

      <!-- Mom / Baby toggle -->
      <div class="meal-tabs" role="tablist" aria-label="Meal plan view">
        <button
          class="meal-tab ${tab === 'mom' ? 'meal-tab--active' : ''}"
          id="tab-btn-mom"
          role="tab"
          aria-selected="${tab === 'mom'}"
          type="button"
        >
          <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:4px;">person</span>
          For Mom
        </button>
        <button
          class="meal-tab meal-tab--baby ${tab === 'baby' ? 'meal-tab--active' : ''}"
          id="tab-btn-baby"
          role="tab"
          aria-selected="${tab === 'baby'}"
          type="button"
        >
          <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:4px;">child_care</span>
          For Baby
        </button>
      </div>

      <!-- Tab content -->
      <div id="meal-tab-content">
        ${tab === 'mom' ? momHtml : babyHtml}
      </div>

      <!-- Day navigation -->
      <div style="display:flex;gap:0.75rem;margin-top:1.5rem;">
        ${day > 1 ? `
          <button
            class="detail-back-btn"
            id="prev-day-btn"
            type="button"
            style="flex:1;justify-content:center;background:var(--surface-container-low);border-radius:var(--radius-pill);padding:0.75rem;"
          >
            <span class="material-symbols-outlined">arrow_back</span>
            Day ${day - 1}
          </button>
        ` : '<div style="flex:1;"></div>'}
        ${day < 40 ? `
          <button
            class="view-plan-btn"
            id="next-day-btn"
            type="button"
            style="flex:1;"
          >
            Day ${day + 1}
            <span class="material-symbols-outlined" style="font-size:1.1rem;">arrow_forward</span>
          </button>
        ` : ''}
      </div>

    </div>
  `);

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Wire back button
  document.getElementById('meal-back-btn')
    .addEventListener('click', showMealPlanHome);

  // Wire tab toggle
  const tabContent = document.getElementById('meal-tab-content');
  document.getElementById('tab-btn-mom').addEventListener('click', () => {
    document.getElementById('tab-btn-mom').classList.add('meal-tab--active');
    document.getElementById('tab-btn-mom').setAttribute('aria-selected', 'true');
    document.getElementById('tab-btn-baby').classList.remove('meal-tab--active');
    document.getElementById('tab-btn-baby').setAttribute('aria-selected', 'false');
    tabContent.innerHTML = momHtml;
  });

  document.getElementById('tab-btn-baby').addEventListener('click', () => {
    document.getElementById('tab-btn-baby').classList.add('meal-tab--active');
    document.getElementById('tab-btn-baby').setAttribute('aria-selected', 'true');
    document.getElementById('tab-btn-mom').classList.remove('meal-tab--active');
    document.getElementById('tab-btn-mom').setAttribute('aria-selected', 'false');
    tabContent.innerHTML = babyHtml;
  });

  // Wire prev/next day
  const prevBtn = document.getElementById('prev-day-btn');
  const nextBtn = document.getElementById('next-day-btn');
  if (prevBtn) prevBtn.addEventListener('click', () => showDayDetail(day - 1, activeMealTab));
  if (nextBtn) nextBtn.addEventListener('click', () => showDayDetail(day + 1, activeMealTab));
}


/* ─────────────────────────────────────────────────────────────
   NAV WIRING — update setNavActive to handle meal-plan tab
   ──────────────────────────────────────────────────────────── */

// Override setNavActive to add meal-plan support
const _origSetNavActive = setNavActive;
function setNavActive(tab) {
  // Handle the more/meal-plan tab visual state
  const moreBtn = document.getElementById('nav-more');
  if (moreBtn) {
    if (tab === 'meal-plan') {
      moreBtn.classList.add('nav--active');
      moreBtn.setAttribute('aria-current', 'page');
    } else {
      moreBtn.classList.remove('nav--active');
      moreBtn.setAttribute('aria-current', 'false');
    }
  }
  // Delegate to original for symptoms tab
  if (tab !== 'meal-plan') {
    ['symptoms', 'positions'].forEach(id => {
      const btn = document.getElementById(`nav-${id}`);
      if (!btn) return;
      btn.setAttribute('aria-current', id === tab ? 'page' : 'false');
    });
  } else {
    const symptomsBtn = document.getElementById('nav-symptoms');
    if (symptomsBtn) symptomsBtn.setAttribute('aria-current', 'false');
  }
}
