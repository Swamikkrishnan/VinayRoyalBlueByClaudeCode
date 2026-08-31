# vinayswaminathan.com — v3 (elevated build)

Static site. No framework, no bundler, no npm, no database.

- **GitHub Pages (review/testing):** push this folder to a repo, enable Pages.
  `.nojekyll` keeps `assets/` untouched; `CNAME` points the site at
  `vinayswaminathan.com` (harmless until the DNS is set).
- **Final host (cPanel):** upload the contents of this folder to `public_html/`.

    index.html          Arrival, invitation, the five doorways, Meet Vinay,
                        go-deeper, Request an Alignment Call
    approach.html       The approach + FACE (Focus · Admit · Connect · Embody)
    offerings.html      1:1 offerings — anchors #body #mind #emotion #action #breath
    groupwork.html      Group work
    about.html          About Vinay
    training.html       Training & background
    privacy.html        Privacy notice
    assets/css/site.css  One stylesheet
    assets/js/site.js    One script
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

Newsreader for display, Archivo for UI/body. Hierarchy comes from scale and
space, not weight; `<strong>` lifts a phrase toward full white rather than
adding heavy weight. Body measure is capped at 36rem.

A fixed paper grain (inline SVG turbulence, `overlay`, 0.5) sits over the
bands (`body::before`, `z-index: 3`); a soft top-light / foot-shadow wash
(`body::after`) sits behind them. The sigil is
neon artwork on transparency — it already glows, so it gets only a soft blue
aura (`.aperture::before`) to seat it. Photographs get a scrim
(`.figure::after`) so they sit in the dark world rather than glaring.

## Two architectural rules

**Fail open.** CSS only hides content once JavaScript has confirmed the
matching system is live (`html.reveal-ready`, `#face.face-ready`). A 4s
safety net reveals everything regardless. With JS off, every page shows all
of its content — verified in the QA harness (`hidden: 0` on all seven pages).
The arrival sequence on the homepage is pure CSS with `animation-fill-mode:
both`, so it completes even if no script ever runs.

**Fail closed.** Development-only content is `display: none !important` by
default and appears only when `body` carries `show-dev`. The testimonial
block on index.html is marked this way and will not appear publicly.

## Accessibility

- `prefers-reduced-motion: reduce` removes transforms, opacity choreography
  and smooth scrolling; all animated content is legible without animation.
- FACE is a proper tablist (roving tabindex, Arrow/Home/End) and degrades to
  four stacked, fully readable panels without JS.
- Mobile nav traps nothing, closes on Escape, returns focus to the toggle.
- All body text clears WCAG AA comfortably (7:1+ on every band); the royal-blue
  accent clears AA as a link colour on every band. Audited across all seven pages.
- The return-CTA (`.recall`) is revealed by `site.js` only and is dismissible
  (per session); with no JS it stays hidden rather than becoming an overlay
  that cannot be closed.

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
2. In `index.html`, replace `WEB3FORMS_ACCESS_KEY` in the hidden
   `access_key` field with the real key.
3. That is all. The recipient address is bound to the key inside the Web3Forms
   dashboard and never appears anywhere in this repo.

**How it behaves:**

- With JavaScript, `site.js` validates inline, then POSTs in the background and
  shows the "Thank you" panel in place.
- Without JavaScript, the form does a normal POST and Web3Forms returns the
  visitor to `?sent=1` (via the hidden `redirect` field — update its domain if
  you want the no-JS path to work on a URL other than `vinayswaminathan.com`).
- Spam: a hidden honeypot (`website`) plus Web3Forms' own `botcheck`.

Until a real key is in place the form will not send — everything else on the
site is independent of it.

## Still to do before public launch

- Remove `class="show-dev"` from `<body>` on every page (hides the testimonial
  placeholders), or replace them with real, permissioned accounts.
- Have the `privacy.html` wording reviewed; set its "Last reviewed" line.
- A purpose-made 1200×630 `social-card.jpg` and the matching `og:image` tags.
