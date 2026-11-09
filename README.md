# ISLAAH · Leaving the Path

Investigative audio journalism: anonymised testimonies from young people who
left armed groups in Kenya, Somalia, Tanzania, the DRC and Mozambique.

Source protection is built in:

- **No faces.** Every image is a hand-drawn illustration of places and objects,
  never people (`scripts/make-illustrations.mjs`).
- **No real voices.** Testimonies are re-voiced by a synthetic narrator
  (`scripts/generate-audio.mjs`).
- **Quick exit.** The button (or Esc) leaves for Google, and moving between
  pages adds no browser history, so Back cannot reveal what was being read.
- **No forms, no tracking.** Contributors reach the team over encrypted channels.

The four stories in `src/data/` are illustrative samples, not real testimonies.

## Run it

```bash
npm install
npm run dev            # preview at http://localhost:5173
npm run build          # production files in dist/
```

## Regenerate media

```bash
npm run illustrations  # redraw all images
npm run audio          # narrate stories (needs AZURE_SPEECH_KEY / AZURE_SPEECH_REGION in .env.local)
```

`.env.local` holds the Azure key and is never committed.

Built with React, TypeScript, Vite and Tailwind CSS.
