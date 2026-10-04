# Vinay Blue Replacement Asset Pack

This pack replaces the previous bright/ivory Light Primary and Light Secondary backgrounds with blue-family alternatives.

## Drop-in replacement backgrounds
- bg-light-primary-desktop.webp
- bg-light-primary-mobile.webp
- bg-light-secondary-desktop.webp
- bg-light-secondary-mobile.webp

The filenames intentionally match the prior project naming so Claude Code can replace the old light assets without changing the conceptual section map.

`bg-light-secondary-mobile.webp` is an exact-source vertical crop derived from the supplied desktop artwork, so it stays visually identical rather than inventing a new background.

## Updated transitions
Sequence:
Dark Primary → Light Primary (blue replacement) → Dark Secondary → Light Secondary (blue replacement) → Dark Primary

Desktop + mobile:
- transition-dark-primary-to-light-primary-*
- transition-light-primary-to-dark-secondary-*
- transition-dark-secondary-to-light-secondary-*
- transition-light-secondary-to-dark-primary-*

## Header
No new decorative header image is required for the next implementation.
Use a semi-transparent deep navy header over the page/background so texture can subtly show through while page text scrolls underneath without visually entering the navigation.

Suggested:
background: rgba(14, 20, 40, 0.78–0.9);
backdrop-filter: blur(12px) saturate(110%);
-webkit-backdrop-filter: blur(12px) saturate(110%);
