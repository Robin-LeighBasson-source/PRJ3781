# syntax=docker/dockerfile:1

# One base for every stage so the native module compiled in `deps` is guaranteed to
# match the runtime that loads it.
ARG NODE_IMAGE=node:22-bookworm-slim

# ---------------------------------------------------------------------------
# deps - workspace dependencies, including the native better-sqlite3 build.
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app

# better-sqlite3 uses a prebuilt binary when one exists for this exact
# Node/platform pair, and falls back to compiling from source when it does not.
# The toolchain is only needed for that fallback, so it stays in this stage.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# The server workspace manifest has to be present or `npm ci` cannot resolve it.
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci

# ---------------------------------------------------------------------------
# dev - Vite dev server and the API with --watch. Source arrives as bind mounts
# from docker-compose, so only node_modules is baked into the image.
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node server/package.json ./server/

# A named volume mounted over an empty path is created root-owned. Creating these
# as `node` first means the volume inherits that ownership and the unprivileged
# user can actually write the database and the HTTP cache.
RUN mkdir -p /app/server/data /app/server/.cache \
 && chown -R node:node /app/server

USER node
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------------------------------------------------------------------------
# build - the static frontend bundle.
# ---------------------------------------------------------------------------
FROM deps AS build
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# web - the built bundle behind nginx, with /api proxied to the api service so
# the frontend stays same-origin exactly as vite.config.js arranges in dev.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
