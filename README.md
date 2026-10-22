# Morrow

Morrow is a local React/Vite concept for a student and graduate opportunity network. Most pages contain sample data and interface-only interactions. A local account sign-up, login and authorization layer is connected; upload, application, analytics, and publishing services are not.

The exception is `/discover/certifications`, which is backed by a real crawler service in `server/` that collects public listings from Coursera and Microsoft Learn into SQLite. See [server/README.md](server/README.md) for its crawl policy and provider notes.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173/`.

Format the repository or check formatting without writing changes:

```bash
npm run fmt
npm run fmt:check
```

The certifications page falls back to a saved snapshot when the API is not running.
To browse live listings, start the crawler service in a second terminal:

```bash
npm run dev:api    # API on http://127.0.0.1:8787
npm run crawl      # populate the database (first run takes a few minutes)
```

## Accounts

Create an account from the **Sign up** tab on `/auth`. Choose **Candidate** to
get a candidate workspace, or **Employer** to create a company organization that
you own. Accounts, sessions, organizations, job drafts and resumes are stored in
MongoDB (`MONGODB_URI` in the repository-root `.env`). Passwords are stored as scrypt hashes,
and the browser receives an opaque, `HttpOnly` session cookie.

Candidates upload a resume (PDF, DOC or DOCX, up to 10MB, stored in GridFS) and
answer a few questions on `/candidates/resume`. Employers see a candidate on
`/employers/candidates` only after that candidate ticks "Let employers see my
profile". Job drafts are saved but not published externally.

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

## Deploy to a VPS with a domain and HTTPS

`docker-compose.prod.yml` runs the production stack: the API built without
`--watch`, and Caddy as the only public service. Caddy serves the built frontend,
proxies `/api` to the API container, and obtains and renews the Let's Encrypt
certificate for `DOMAIN` automatically. nginx is used only by the local `preview`
profile and is not part of the VPS stack.

1. Point an `A` record for the domain (and `AAAA` if the VPS has IPv6) at the VPS
   public IP. Wait for DNS to resolve before starting Caddy.
2. In MongoDB Atlas, add the VPS public IP under **Network Access** (or
   `0.0.0.0/0` for a short-lived demo). The API cannot connect otherwise.
3. On the VPS, install Docker Engine with the Compose plugin, then allow ports
   22, 80 and 443 through the firewall. Ports 80/443 must not be used by a host
   nginx/apache.
4. Clone the repository and configure the root `.env`:

   ```bash
   git clone <repository-url> morrow
   cd morrow
   cp .env.example .env
   ```

   Required values:

   ```dotenv
   MONGODB_URI=mongodb+srv://...
   DOMAIN=morrow.example.com
   ACME_EMAIL=you@example.com
   ```

5. Build and start:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml logs -f caddy
   ```

   The first certificate request takes a few seconds. Then open
   `https://<DOMAIN>`.

To update after a `git pull`:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The SQLite catalogue and HTTP cache live in the `api-data` and `api-cache`
volumes; the certificate lives in `caddy-data`, so renewals and restarts do not
repeat the ACME challenge. Accounts and resumes are in MongoDB Atlas, not on the
VPS. If the domain is behind Cloudflare, set the DNS record to **DNS only** for
the first certificate issuance.

### Crawlers on the VPS

The scheduled crawl is off by default (`MORROW_CRAWL_SCHEDULE_ENABLED=0`), so run
crawls explicitly as one-off commands in the running API container.

Certification catalogue (Microsoft Learn and Coursera, no API key):

```bash
docker compose -f docker-compose.prod.yml exec api \
  npm run crawl -- --provider=microsoft-learn --max-pages=5
```

Job, hackathon and course crawlers use Firecrawl. Add the key from your local
`jobCrawler.env` to the VPS `.env` (that file is git-ignored and is not in the
image):

```dotenv
FIRECRAWL_API_KEY=fc-...
```

Then run:

```bash
docker compose -f docker-compose.prod.yml exec api npm run crawl:jobs
docker compose -f docker-compose.prod.yml exec api npm run crawl:hackathons
docker compose -f docker-compose.prod.yml exec api npm run crawl:courses
```

The crawlers write `jobs.json`, `hackathons.json`, `courses.json` and
`certifications.json` into the `crawler-data` volume. Caddy mounts that volume
read-only at `/srv/data`, so the frontend sees new listings immediately — no
rebuild required. Certifications are also stored in the SQLite catalogue on
`api-data` and served by `/api`.

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
