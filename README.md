# vinayswaminathan.com — v3 (elevated build)

Static site. No framework, no bundler, no npm, no database.

- **GitHub Pages (review/testing):** push this folder to a repo, enable Pages.
  `.nojekyll` keeps `assets/` untouched; `CNAME` points the site at
  `vinayswaminathan.com` (harmless until the DNS is set).
- **Final host (cPanel):** upload the contents of this folder to `public_html/`.

    index.html          Arrival, Why welcome?, 1:1 Offerings, Group Offerings,
                        Meet Vinay, How to start (Alignment Call form)
    approach.html       The approach + FACE (Focus · Admit · Connect · Embody)
    offerings.html      1:1 offerings — anchors #body #mind #emotion #action #breath
    groupwork.html      Group Offerings
    about.html          About Vinay
    training.html       Training & background
    privacy.html        Privacy notice
    assets/css/site.css  One stylesheet
    assets/js/site.js    One script
    assets/fonts/        Gillius ADF No2 (OTF)
    assets/images/       Sigil + photography
    CNAME · .nojekyll    GitHub Pages / custom-domain config

## Design system

Deep royal-blue ground, warm off-white light. Never flat black, never a cold
white. The warmth of the text against the cool ground is what keeps it
welcoming.

    ivory #151C34 · parchment #111830 · sand #0E1428  (grounds, mid → deep)
    stone #33406B                                     (raised lines and cues)
    ink #F4EFE3 · ink-soft #E4DDCC · muted #B7AF9C · muted-light #9B927D
    night #0A0F20 · night-2 #0C1224                   (deepest inset bands)
    accent #6C8CFF · accent-dim #4C6EF5 · accent-lift #A9BEFF   (royal blue)
    clay #E0955C · clay-text #E8A870   (warm secondary accent, used sparingly)

All body text clears WCAG AA (7:1+) on every band; the accent clears AA as a
link colour on every band.

EB Garamond (Google Fonts) for ceremonial/display type — hero, page and section
titles, the header name, the footer line. Gillius ADF No2 for body and UI,
self-hosted from `assets/fonts/` (Regular 400, Bold 600, Italic 400 — the
condensed and bold-italic files are present but not loaded). The Regular face
is preloaded on every page.

Four type tiers (`--t-display`, `--t-heading`, `--t-sub`, `--t-body`) plus
`--t-small`; spacing tokens `--s-1`…`--s-5` and `--section-y`. Hierarchy comes
from scale, space and typeface contrast, not weight.

Progressive disclosure uses one native `<details class="accordion">` pattern.
`site.js` animates open/close (height, opacity, 4px settle; reverses mid-way;
skipped under reduced motion); without JS the native toggle still works. A hash
link to an element inside a closed accordion opens it.

Motion uses one ease-out curve and three durations (`--motion-fast` 180ms,
`--motion-base` 260ms, `--motion-slow` 500ms). Reveals are one block per
section (12px rise). The mobile menu fades/unclips rather than toggling
`display`, so closing animates too.
Anchor offset is a single rule: `[id] { scroll-margin-top: … }` driven by
`--header-h` (+ `--subnav-h` on the Approach page).

A fixed paper grain (inline SVG turbulence, `overlay`, 0.5) sits over the
bands (`body::before`, `z-index: 3`); a soft top-light / foot-shadow wash
(`body::after`) sits behind them. The sigil is
neon artwork on transparency — it already glows, so it gets only a soft blue
aura (`.aperture::before`) to seat it. Photographs get a scrim
(`.figure::after`) so they sit in the dark world rather than glaring.

## Two architectural rules

**Fail open.** CSS only hides content for motion once JavaScript has
confirmed the reveal engine is live (`html.motion-ready`). A 4s safety net
reveals everything regardless. With JS off, every page shows all of its
content; accordions remain native and openable, and the mobile menu sits in
the header flow.

## Accessibility

- `prefers-reduced-motion: reduce` removes transforms, opacity choreography
  and smooth scrolling; all animated content is legible without animation.
- FACE (Approach) is a tab selector built by `site.js` (real buttons, roving
  tabindex, Arrow/Home/End, `aria-selected`); without JS all four steps stay
  stacked and readable.
- Interior pages (Approach, 1:1 Offerings, Group Offerings, About, Training)
  share one section nav (`.subnav`) and one scroll-spy in `site.js`. From
  1100px it is a slim fixed index in the left gutter (the content column
  stays centred, inset equally to clear it); below that it is a horizontal bar under the header
  (50px + border = `--subnav-h`). Anchors land below the sticky bars.
- Emphasis: Gillius for explanation, EB Garamond (`.insight`) only for
  complete distilled sentences; `.anchor` (semibold) marks a short scanning
  phrase; the blue highlight sweep is kept to one per neighbourhood.
- Gillius ADF maps "oe" to "œ" through its required-ligature table; `body`
  sets `font-feature-settings: "rlig" 0` so "does" never reads "dœs".
- Mobile nav traps nothing, closes on Escape, returns focus to the toggle.
- All body text clears WCAG AA comfortably (7:1+ on every band); the royal-blue
  accent clears AA as a link colour on every band. Audited across all seven pages.

## Two CSS traps worth remembering

1. `overflow: hidden` on any ancestor disables every `position: sticky`
   below it. `body` uses `overflow-x: clip` for this reason.
2. A base rule declared *after* its own media query silently overrides the
   sticky inside it. Declare base rules first.

## The Alignment Call form → Web3Forms

The form delivers through [Web3Forms](https://web3forms.com) — no backend, so it
works the same on GitHub Pages and on the final host.

**One-time setup:**

1. Go to web3forms.com and create an access key for **vinay.swami91@gmail.com**
   (a verification email is sent to that address).
2. The key lives in the hidden `access_key` field in `index.html`.
3. That is all. The recipient address is bound to the key inside the Web3Forms
   dashboard and never appears anywhere in this repo.

**How it behaves:**

- With JavaScript, `site.js` validates inline, then POSTs in the background and
  shows the "Thank you" panel in place.
- Without JavaScript, the form does a normal POST and Web3Forms returns the
  visitor to `?sent=1` (via the hidden `redirect` field — update its domain if
  you want the no-JS path to work on a URL other than `vinayswaminathan.com`).
- Spam: a hidden honeypot (`website`) plus Web3Forms' own `botcheck`.

## Still to do before public launch

- Have the `privacy.html` wording reviewed.
- A purpose-made 1200×630 `social-card.jpg` and the matching `og:image` tags.
