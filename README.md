# Brian Birkinbine

A minimal personal profile site with a VT100-inspired terminal aesthetic.

## Live site

<https://brianbirkinbine.com/>

## Features

- Links to GitHub, LinkedIn, Instagram, Bluesky, X, Keybase, and email
- Plain-language privacy policy and terms of use
- System-aware light and dark themes with a persistent manual toggle
- Green-phosphor terminal styling, subtle scanlines, and responsive layout
- Responsive ANSI half-block portrait derived from Brian's headshot without publishing the source photo
- Accessible labels and reduced-motion support
- Hidden monochrome vector arcade at `/games/`, opened by pressing Enter on the homepage
- No tracking, build system, or runtime dependencies

## Project files

- `index.html` — page structure, metadata, and social-profile links
- `styles.css` — responsive VT100-inspired presentation
- `theme.js` — system-theme detection and manual theme selection
- `CNAME` — custom domain served by GitHub Pages
- `.nojekyll` — direct static-file publishing through GitHub Pages

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Publishing

GitHub Pages publishes the root of the `main` branch. The site is served from the
custom domain `brianbirkinbine.com`, configured by the `CNAME` file; the
`bbirkinbine.github.io` address redirects there.

## Design credit

The visual direction was inspired by
[terminal.css](https://github.com/Gioni06/terminal.css), an MIT-licensed CSS
framework by Jonas D.
