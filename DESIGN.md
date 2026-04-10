```markdown
# Design System Document: Postpartum Support & Care

## 1. Overview & Creative North Star: "The Digital Sanctuary"

This design system is built on the Creative North Star of **"The Digital Sanctuary."** For a postpartum user, the world is often loud, exhausting, and overwhelming. This system rejects the frantic, cluttered layouts of traditional utility apps in favor of a high-end editorial experience that feels like a deep, restorative breath. 

We break the "standard template" look by utilizing **intentional asymmetry** and **tonal depth**. Instead of rigid grids, we use generous whitespace and overlapping elements to create a sense of organic flow. The interface does not "command" the user; it "cradles" the content, providing a professional yet deeply warm environment that honors the user’s emotional state.

---

## 2. Colors & Atmospheric Tones

The palette is a sophisticated blend of grounded earthiness and airy lightness. We avoid clinical whites in favor of warm, milky neutrals to reduce eye strain for sleep-deprived parents.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit against a `surface` background to create a soft "zone" without the harshness of a line.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper. 
- Use `surface-container-lowest` (pure white) for high-priority interactive cards.
- Use `surface-container` or `surface-dim` for background scaffolding.
- Nesting a `surface-container-high` element inside a `surface-container-low` area creates a natural focal point without needing structural dividers.

### Glass & Gradient Signature
To move beyond "out-of-the-box" flat design:
- **Glassmorphism:** For floating navigation or top bars, use `surface` at 80% opacity with a `20px` backdrop-blur. This allows the gentle sage and rose tones to bleed through, softening the interface.
- **The Glow Gradient:** Use a subtle linear gradient (from `primary` to `primary-container`) for main CTAs. This adds a "soulful" tactile quality that flat colors lack.

---

## 3. Typography: Editorial Clarity

The typography system balances the authority of a medical professional with the warmth of a doula.

- **Display & Headlines (`notoSerif`):** Chosen for its soft terminals and approachable elegance. Use `display-lg` for morning greetings or milestone celebrations. The serif adds a "premium" feel that honors the importance of the user's journey.
- **Body & Titles (`plusJakartaSans`):** A modern, high-legibility sans-serif with wide apertures. This is critical for users viewing the screen at 3 AM with tired eyes.
- **Hierarchy as Empathy:** Use `headline-sm` for most section headers to provide clear signposting. Ensure `body-lg` is the default for instructional text to maximize readability without squinting.

---

## 4. Elevation & Depth: Tonal Layering

We eschew traditional shadows in favor of **Tonal Layering**.

- **The Layering Principle:** Depth is achieved by "stacking." A card using `surface-container-lowest` placed on a `surface` background provides enough contrast to imply elevation naturally.
- **Ambient Shadows:** If a "floating" action button is required, shadows must be extra-diffused. Use a 24px blur at 6% opacity, using a tinted version of `on-surface` (a deep charcoal-green) rather than pure black.
- **The "Ghost Border" Fallback:** If a border is required for accessibility on form fields, use `outline-variant` at **20% opacity**. Never use 100% opaque borders.
- **Softness:** All containers must adhere to the `xl` (1.5rem) or `lg` (1rem) roundedness scale to maintain a "hand-held" organic feel.

---

## 5. Components

### Buttons
- **Primary:** Rounded `full` (pill-shape). Background: `primary` to `primary-container` gradient. Text: `on-primary`. Height: Minimum 56px to exceed the 44px tap target rule.
- **Secondary:** Surface-colored with a `surface-variant` background. No border.
- **Tertiary:** Text-only using `primary` color, bolded, with a minimum touch target area of 44px padding.

### Input Fields
- **Styling:** Use `surface-container-highest` as the fill. 
- **States:** On focus, transition the background to `surface-container-lowest` and add a "Ghost Border" of `primary` at 40% opacity. 
- **Labels:** Always persistent `label-md` above the field; never use placeholder text as a label.

### Cards & Lists (The "No-Divider" Rule)
- **Forbid divider lines.** Use vertical whitespace (32px or 48px) to separate list items. 
- **Breastfeeding Logs:** Use `surface-container-low` cards with a `primary-fixed` accent bar on the left edge to denote "active" or "recent" entries.

### Specialized Components
- **The "Calm" Progress Bar:** A thick (12px) bar using `primary-container` as the track and `primary` as the fill, with `full` rounded caps. Avoid "loading" animations; use slow, "breathing" fades.
- **Mood Toggles:** Large, circular `surface-container-high` buttons that transition to `secondary-container` when selected.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use `primary` (Sage Green) for success and growth-related actions.
- **Do** use `secondary` (Dusty Rose) for emotional or "body-focused" insights.
- **Do** prioritize a "Thumb Zone" layout—keep all frequent actions in the bottom 40% of the screen.
- **Do** use generous line-height (1.6x) for all body text to aid reading in low light.

### Don’t:
- **Don’t** use pure `#000000` for text. Use `on-surface` (#30332f) to keep the contrast high but the "vibration" low.
- **Don’t** use rapid-fire animations or haptics. Interactions should feel soft and deliberate.
- **Don’t** use 1px borders or tight grids. If the layout feels "crowded," add more `surface` space.
- **Don’t** use "Error Red" for non-critical warnings. Use `secondary` or `error_container` to keep the user from feeling panicked.