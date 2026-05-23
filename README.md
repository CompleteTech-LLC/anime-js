# Anime.js Scroll Clone

Greenfield Vite/React implementation of the Anime.js homepage-style scroll animation. The page uses Anime.js 4.4.1 for DOM motion and draggable interaction, Three.js for the fixed WebGL stage, and GLB module assets copied into `public/models`.

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
```

## What Is Implemented

- Full top-to-bottom scroll narrative with dark and light chapters.
- Fixed Three.js stage that loads the Anime.js module GLB assets.
- Intro, toolbox, feature, modules, and finish sections.
- Live feature demos for animation, timeline composition, scroll sync, staggering, SVG drawing, and draggable controls.
- Right-side chapter rail with progress, jump ticks, and a draggable scroll thumb.
- Responsive desktop and mobile layouts.

## Project Structure

```text
.
├── index.html
├── package.json
├── public/
│   └── models/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
└── vite.config.js
```

## Verification

The implementation was checked with:

```bash
npm run build
```

It was also loaded locally in Chrome at desktop and mobile viewports to confirm the scroll sections, WebGL canvas, and responsive layout render without console errors.
