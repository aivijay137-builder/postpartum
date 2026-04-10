# Postpartum Symptom → Solution Web App

A mobile-first responsive web app designed to help new mothers in the first 40 days after delivery quickly understand common breastfeeding symptoms and get structured, easy-to-read guidance.

This MVP focuses on a simple flow:

**Mother selects a symptom → sees a structured solution card**

Examples include:
- Engorgement
- Cracked or bleeding nipples
- Cluster feeding
- Latch issues
- Low milk supply concerns
- Mastitis warning signs

---

## Project Purpose

New mothers often face urgent breastfeeding concerns, especially in the early postpartum period, but existing information is fragmented, overwhelming, or hard to use during stressful moments.

This project aims to provide:
- A calm, mobile-friendly experience
- Plain-language symptom selection
- Structured solution cards
- Clear red-flag guidance
- A simple web app that works without complexity

---

## Core Idea

This project is based on *: Symptom → Solution Engine** from a broader postpartum care app concept.

The goal is to help a mother:
1. Open the app
2. Tap **Symptoms**
3. Choose the symptom closest to what she is experiencing
4. Read a structured solution card with:
   - What this likely is
   - Immediate relief steps
   - Do’s
   - Don’ts
   - Red flags
   - When to expect improvement

---

## MVP Scope

This repository currently focuses on the breastfeeding symptom workflow only.

### Included in MVP
- Responsive web app UI
- Symptom list screen
- Symptom detail / solution card screen
- Loading state
- Error state
- JSON-based symptom content
- Mobile-first design assets generated from Stitch

### Not included yet
- AI chatbot
- User login
- Bookmarks / saved cards
- CMS integration
- Analytics
- Multi-language support
- Native mobile app

---

## Target User

This app is intended for:
- New mothers in the first 40 days postpartum
- First-time mothers needing reassurance
- Mothers facing breastfeeding pain points or confusion
- Users who need quick, structured guidance on mobile

---

## How the App Works

### User Flow
1. User lands on the app
2. Bottom navigation highlights **Symptoms**
3. User sees a list of symptom cards
4. User taps one symptom
5. App opens a detail screen with the full solution card
6. User can go back to the symptoms list

---

## Data Model

The app is driven by a JSON file:

`bf_symptom_cards.json`

Each symptom card can contain fields such as:
- `id`
- `slug`
- `title_user`
- `title_clinical`
- `severity`
- `category`
- `what_it_is`
- `immediate_relief_steps`
- `dos`
- `donts`
- `red_flags`
- `when_to_expect_improvement`
- `disclaimer`

This makes the MVP easy to edit without needing a database in the first version.

---

## Project Files

Typical files in this project include:

- `bf_symptom_cards.json` — symptom and solution data
- `DESIGN.md` — design guidance exported from Stitch
- `app shell.html` — app shell reference screen
- `symptoms_list.html` — symptoms list reference screen
- `symptom detail.html` — symptom detail reference screen
- `symptoms-loading.html` — loading state reference
- `symptom error state.html` — error state reference
- PNG files — visual design references
- `index.html` — main app entry point
- `styles.css` — app styling
- `app.js` — logic for loading JSON and rendering screens

---

## Design Principles

This app is being built with the following principles:

- **Mobile-first** — designed for one-handed phone use
- **Fast to understand** — a mother should reach useful guidance in seconds
- **Plain language** — symptom labels should match how real mothers describe problems
- **Structured guidance** — information should be scannable, not overwhelming
- **Trust and safety** — red flags should be clear and prominent

---

## Tech Approach

The current MVP is intentionally simple:
- Static responsive web app
- HTML, CSS, and JavaScript
- JSON as the initial data source
- Design assets created with Google Stitch

A future version may expand to:
- Next.js
- Supabase
- Sanity CMS
- Resend
- PostHog
- Claude API for free-text symptom support

---

## Why JSON First

This project starts with a JSON-based content model because it is the fastest way to:
- Build the UI
- Test symptom card structure
- Validate flows with real users
- Improve content before moving to a CMS

This is a practical MVP choice for an early-stage build.

---

## Important Medical Note

This is a health-adjacent product. Any breastfeeding advice shown to users should be reviewed by a certified lactation consultant (IBCLC) before public launch.

The current product and content structure are intended for MVP build and workflow validation. Clinical review is a required step before going live.

---

## Planned Next Steps

Possible next steps for this project:
- Finalize `index.html`, `styles.css`, and `app.js`
- Connect the symptom list to `bf_symptom_cards.json`
- Render dynamic symptom detail pages
- Improve loading and error states
- Add bookmarks
- Move content from JSON to CMS
- Add free-text symptom search or AI support
- Test with real postpartum users

---

## Vision

This project is the first step toward a broader postpartum care support experience for the first 40 days after delivery, beginning with one of the highest-stress problem spaces: breastfeeding guidance.
