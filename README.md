# Sailing Club

## Overview

An equipment booking app for sailing clubs. Members can browse and book sailboats, kayaks, SUPs, and windsurf equipment in 30-minute time slots.

### Features

- **Equipment categories** — Browse gear organized by Sailboats, Kayaks & SUPs, and Windsurf
- **Time-slot booking** — Book equipment in 30-minute slots from 9am to 5pm
- **Real-time schedule** — See bookings update live via WebSocket
- **Week & day navigation** — Browse schedules by week and select specific days
- **Member color coding** — Easily identify who has booked what
- **No-signup auth** — One-time account creation via Local First Auth (no passwords, no email)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

This project uses pnpm as the package manager. If you don't have it installed: `brew install pnpm`.

### 2. Run database migrations

```bash
pnpm db:run-migrations
```

### 3. Start the dev server

```bash
pnpm run dev              # Start dev server
pnpm run dev:simulator    # Start dev server with a test user account
```

## Project Structure

This is a monorepo with three packages:
- `client/` — React frontend
- `server/` — Cloudflare Workers, D1 (SQLite), Durable Objects (WebSocket)
- `shared/` — Shared utilities (JWT verification, time slot constants)

## Deployment

This project uses [Alchemy](https://alchemy.run) to deploy to Cloudflare Workers.

Configure a Cloudflare API token:
```bash
alchemy configure
```

Copy `.env.example` to `.env` and update `ALCHEMY_STATE_TOKEN`.

Deploy:
```bash
pnpm run deploy:cloudflare
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) — Development guide for Claude Code
- [Local First Auth Specification](./docs/local-first-auth-spec.md) — Authentication spec
- [Mini App Examples](./docs/mini-app-examples.md) — Reference examples of other mini apps
