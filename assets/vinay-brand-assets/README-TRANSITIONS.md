# Vinay Swaminathan — Section Transition Assets

Designed for this repeating section order:

1. Dark Primary
2. Light Primary
3. Dark Secondary
4. Light Secondary
5. back to Dark Primary

Use each transition between the matching adjacent section backgrounds.

## Desktop
- transition-dark-primary-to-light-primary-desktop.webp
- transition-light-primary-to-dark-secondary-desktop.webp
- transition-dark-secondary-to-light-secondary-desktop.webp
- transition-light-secondary-to-dark-primary-desktop.webp

## Mobile
- transition-dark-primary-to-light-primary-mobile.webp
- transition-light-primary-to-dark-secondary-mobile.webp
- transition-dark-secondary-to-light-secondary-mobile.webp
- transition-light-secondary-to-dark-primary-mobile.webp

Recommended implementation:
- place transition as a pseudo-element straddling the section boundary
- desktop visible height around 90–150px
- mobile visible height around 60–100px
- background-size: cover
- pointer-events: none
- do not insert a blank spacer section
