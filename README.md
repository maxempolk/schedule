# Schedule

Schedule is a small full-stack weekly planner with a timeline interface. It was
built as a personal productivity tool and demonstrates authenticated CRUD flows,
a React client and a lightweight Express API backed by SQLite.

## Features

- Weekly timeline with day navigation and a live current-event indicator.
- Create, edit and remove scheduled events.
- Event categories for focused work, study, rest and personal time.
- Optional notification sound when an event changes.
- JWT-based login with short-lived access tokens and refresh-token cookies.
- Seeded example schedule for local development.

## Tech Stack

- **Client:** React, TypeScript and Vite
- **Server:** Node.js, Express and TypeScript
- **Storage:** SQLite via `better-sqlite3`
- **Authentication:** JSON Web Tokens and HTTP-only cookies

## Project Structure

```text
client/   # React and Vite application
server/   # Express API and SQLite persistence
```

## Getting Started

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm --prefix client ci
npm --prefix server ci

cp server/.env.example server/.env
npm run dev
```

The client starts on the Vite development URL and the API listens on
`http://localhost:3001` by default.

## Environment Variables

Create `server/.env` from `server/.env.example` and replace every example value
before using the application outside your local machine.

```env
PORT=3001
ADMIN_LOGIN=admin
ADMIN_PASSWORD=change-me
JWT_ACCESS_SECRET=replace-with-a-long-random-value
JWT_REFRESH_SECRET=replace-with-a-different-long-random-value
```

## Production Build

```bash
npm run build
npm run start
```

`npm run build` creates both the client and server build artifacts. The Express
server serves the built React application when `NODE_ENV=production`.

## API Health Check

```text
GET /api/health
```

The project is kept as a local-development example and does not currently have
a public demo deployment.
