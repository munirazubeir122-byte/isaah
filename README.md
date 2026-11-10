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

## Admin dashboard (`/admin`)

Staff sign in at `https://islaah.co.ke/admin/` to edit stories (text, picture,
audio per language), page text, contact details and team accounts, and to see
anonymous page counts. Edits are live as soon as they are saved.

- **Server:** a Cloudflare Worker (`worker/`) serves the built site and the API.
  Content lives in D1 (database `islaah`, tables in `migrations/`), uploads in
  Workers KV (`MEDIA`). The home page gets the content embedded, so visitors
  load nothing extra.
- **Accounts:** admins create people from the dashboard and send them a one-time
  link. Passwords are peppered and hashed with PBKDF2; the pepper is the Worker
  secret `PEPPER` (local: `.dev.vars`, never committed). Five wrong passwords
  lock an account for 15 minutes.
- **Shipped text** in `src/data/` is the fallback: anything never edited in the
  dashboard is shown from there.

```bash
npm run db:migrate:local                         # create local test tables
npm run worker                                   # build + run at http://localhost:8787
npm run admin:invite -- you@example.com          # local admin sign-in link
npm run admin:invite -- you@example.com --remote # first admin on the live site
npm run db:migrate:remote                        # apply new migrations to the live database
```

Built with React, TypeScript, Vite, Tailwind CSS and Cloudflare Workers.
