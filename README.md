# Brian Birkinbine

A minimal personal profile site with a VT100-inspired terminal aesthetic.

## Live site

<https://bbirkinbine.github.io/>

## Features

- Links to GitHub, LinkedIn, Instagram, Bluesky, X, and email
- System-aware light and dark themes with a persistent manual toggle
- Green-phosphor terminal styling, subtle scanlines, and responsive layout
- Accessible labels and reduced-motion support
- No tracking, build system, or runtime dependencies

## Project files

- `index.html` — page structure, metadata, and social-profile links
- `styles.css` — responsive VT100-inspired presentation
- `theme.js` — system-theme detection and manual theme selection
- `.nojekyll` — direct static-file publishing through GitHub Pages

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Publishing

GitHub Pages publishes the root of the `main` branch. The site currently uses
the standard `bbirkinbine.github.io` address and has no custom-domain redirect.

## Design credit

The visual direction was inspired by
[terminal.css](https://github.com/Gioni06/terminal.css), an MIT-licensed CSS
framework by Jonas D.
