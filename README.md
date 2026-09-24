# Brian Birkinbine

A personal profile site with four dark, retro-computing visual styles.

## Live site

<https://brianbirkinbine.com/>

## Features

- Concise AI-first calling-card copy grounded in 20+ years of security experience
- Theme-matched prompt favicon
- Links to GitHub, LinkedIn, Instagram, Bluesky, X, Keybase, and email
- Plain-language privacy policy and terms of use
- Terminal, Arcade Night, Vector Field, and Red Grid City styles with distinct palettes, backgrounds, and layouts
- Vector Field as the first-visit default, with the visitor's style-selector choice persisted locally
- Responsive 96×105 halftone dot portrait derived from Brian's headshot without publishing the source photo
- Accessible labels, reduced-motion and forced-color support, and a light print layout
- Hidden arcade with five core games and two persistent secret-code exclusives at `/games/`, opened by pressing Enter on the homepage
- `JOSHUA` unlocks the missile-defense `DEFCON COMMAND`; the Konami Code unlocks the original pixel-scrolling `ORIGIN FLIGHT` homage
- Vector Lander with six fuel-balanced mountain and crater terrains, dynamic approach zoom, and an `F` hotkey for unlimited-fuel casual mode
- No tracking, build system, or runtime dependencies

## Project files

- `index.html` — page structure, metadata, and social-profile links
- `styles.css` — responsive layouts and artwork for all four visual styles
- `theme.js` — Vector Field default, accessible style cycling, and preference persistence
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
