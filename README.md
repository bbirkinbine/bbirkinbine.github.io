# Brian Birkinbine

A minimal personal profile site with a VT100-inspired terminal aesthetic.

## Live site

<https://brianbirkinbine.com/>

## Features

- Links to GitHub, LinkedIn, Instagram, Bluesky, X, Keybase, and email
- Plain-language privacy policy and terms of use
- System-aware light and dark themes with a persistent manual toggle
- Green-phosphor terminal styling, subtle scanlines, and responsive layout
- Responsive 96×105 halftone dot portrait derived from Brian's headshot without publishing the source photo
- Accessible labels and reduced-motion support
- Hidden monochrome vector arcade with a five-game selector at `/games/`, opened by pressing Enter on the homepage
- Vector Lander with six fuel-balanced terrains, dynamic approach zoom, and an `F` hotkey for unlimited-fuel casual mode
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

GitHub Pages may cache a deployed page for up to ten minutes. The arcade checks
`games/version.json` with a cache-busting request and reloads a versioned `/games/`
URL when a newer build is available. Update that version together with the arcade
asset query strings whenever the game code changes. During development, use a
hard reload (`Command+Shift+R` on macOS or `Ctrl+Shift+R` on Windows/Linux).

## Design credit

The visual direction was inspired by
[terminal.css](https://github.com/Gioni06/terminal.css), an MIT-licensed CSS
framework by Jonas D.
