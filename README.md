# Morrow

Morrow is a local React/Vite concept for a student and graduate opportunity network. Most pages contain sample data and interface-only interactions: no authentication, upload, application, analytics, or publishing service is connected.

The exception is `/discover/certifications`, which is backed by a real crawler service in `server/` that collects public listings from Coursera and Microsoft Learn into SQLite. See [server/README.md](server/README.md) for its crawl policy and provider notes.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173/`.

The certifications page falls back to a saved snapshot when the API is not running.
To browse live listings, start the crawler service in a second terminal:

```bash
npm run dev:api    # API on http://127.0.0.1:8787
npm run crawl      # populate the database (first run takes a few minutes)
```

## Main routes

- `/` - homepage
- `/candidates` and `/candidates/resume`
- `/jobs`, `/jobs/part-time`, `/jobs/internships`, `/jobs/entry-level`, `/jobs/recommended`
- `/employers`, `/employers/candidates`, `/employers/post-job`
- `/courses`
- `/discover/jobs`, `/discover/hackathons`, `/discover/certifications`
- `/portfolio-builder`
- `/projects`
- `/auth`
