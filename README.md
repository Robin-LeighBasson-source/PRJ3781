# Morrow

Morrow is a student and graduate opportunity network built with React/Vite and an
Express API in `server/`. Accounts and user data are stored in MongoDB.

## What works

- **Accounts** - sign up and log in as a candidate or an employer (see [Accounts](#accounts)).
- **Resumes** - candidates upload a resume and answer profile questions on
  `/candidates/resume`; employers can browse candidates who opted in.
- **Jobs** - employers create, publish, edit and close jobs from
  `/employers/post-job`. Published jobs appear on `/jobs` next to listings
  collected by the job crawler, and candidates apply from `/jobs/posted/:id`.
- **Projects** - employers post short, often paid, projects. Candidates apply on
  `/projects/:id`, and the employer selects applicants and marks work completed.
- **Portfolios** - candidates build a portfolio on `/portfolio-builder` from their
  resume and completed projects, and share it at `/portfolio/:slug`.
- **Discover** - certifications come from a crawler that collects public Coursera
  and Microsoft Learn listings into SQLite (see [server/README.md](server/README.md)).
  Courses, hackathons and crawled jobs are collected with Firecrawl into
  `public/data/*.json`.

Still sample data or interface only: the job listings on the homepage and on
`/discover/jobs`, and the recommendations on `/jobs/recommended`, which are not yet
personalised.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173/`.

Sign-up, resumes, jobs, projects and portfolios need the API and a MongoDB
database. Set `MONGODB_URI` in `server/.env`, then start the API in a second
terminal with `npm run dev:api`.

`npm run dev` first runs the job crawler (`npm run crawl:jobs`), which needs a
`FIRECRAWL_API_KEY` in `jobCrawler.env` at the repository root. Refresh the other
Firecrawl listings with `npm run crawl:hackathons`, or
`node server/src/crawl/courseCrawler.js` for courses.

Format the repository or check formatting without writing changes:

```bash
npm run fmt
npm run fmt:check
```

The certifications page falls back to a saved snapshot when the API is not running.
To browse live listings, populate the certifications database:

```bash
npm run dev:api    # API on http://127.0.0.1:8787
npm run crawl      # populate the database (first run takes a few minutes)
```

## Accounts

Create an account from the **Sign up** tab on `/auth`. Choose **Candidate** to
get a candidate workspace, or **Employer** to create a company organization that
you own. Accounts, sessions, organizations, job drafts and resumes are stored in
MongoDB (`MONGODB_URI` in `server/.env`). Passwords are stored as scrypt hashes,
and the browser receives an opaque, `HttpOnly` session cookie.

Candidates upload a resume (PDF, DOC or DOCX, up to 10MB, stored in GridFS) and
answer a few questions on `/candidates/resume`. Employers see a candidate on
`/employers/candidates` only after that candidate ticks "Let employers see my
profile". Applying to a job or project shares the candidate's resume with that
employer even without that opt-in.

Jobs start as drafts and are only shown on `/jobs` once published. Projects accept
applications while they are Open and before their deadline, if one is set.
Completed projects can be added to the candidate's portfolio.

## Run locally with Docker

Both services in one command, no Node or native build toolchain on the host:

```bash
docker compose up --build
```

- Frontend with hot reload: <http://localhost:5173>
- API: <http://localhost:8787/api/health>

`src/`, `public/`, `index.html`, `vite.config.js`, and `server/src/` are bind-mounted,
so edits reload as usual. Dependencies live inside the image because
`better-sqlite3` is compiled for the container rather than the host, so changes to
either `package.json` need a `docker compose build`.

Populate the database the same way, as a one-off container:

```bash
docker compose run --rm api npm run crawl
docker compose run --rm api npm run crawl -- --provider=microsoft-learn --max-pages=5
docker compose run --rm api npm run test:server
```

The database and the crawler's HTTP cache live in the `api-data` and `api-cache`
volumes, so they survive rebuilds. `npm run crawl` still refreshes the tracked
`public/data/certifications.json` snapshot in the working tree.

To check the production bundle as nginx would serve it, on <http://localhost:8080>:

```bash
docker compose --profile preview up --build
```

Copy `.env.example` to `.env` to override the crawler settings; `docker compose`
picks it up automatically. Clear everything, volumes included, with
`docker compose down -v`.

## Main routes

- `/` - homepage
- `/candidates` and `/candidates/resume`
- `/jobs`, `/jobs/part-time`, `/jobs/internships`, `/jobs/entry-level`, `/jobs/recommended`, `/jobs/posted/:id`
- `/employers`, `/employers/candidates`, `/employers/post-job`
- `/courses`
- `/discover/jobs`, `/discover/hackathons`, `/discover/certifications`
- `/portfolio-builder`, `/portfolio/:slug`
- `/projects`, `/projects/:id`
- `/auth`
