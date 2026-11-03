# Tennis Competition Management Platform

A web platform for running tennis competitions, built for Waverley & District Tennis Association Inc as a replacement for TROLS. It keeps one central database of players, clubs, associations, competitions, seasons, sections, teams and matches. Through the website, administrators set up competitions and approve team registrations, players enter and confirm match results, and anyone can view fixtures, results and ladders.

## Prerequisites

- [Node.js 22](https://nodejs.org/) (includes npm)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), running in the background

## Local setup

1. Install dependencies from the repository root:

   ```bash
   npm i
   ```

2. Start the local PostgreSQL database from the repository root:

   ```bash
   docker compose up -d
   ```

3. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` to match `docker-compose.yml`:

   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5433/mydatabase"
   ```

4. Create the tables and load the test data, from `backend/`:

   ```bash
   cd backend
   npx prisma db migrate --advance-ref db
   npm run seed
   ```

5. Start the backend, from `backend/`. The API runs at http://localhost:3000/api.

   ```bash
   npm run start:dev
   ```

6. In a second terminal, start the frontend from `frontend/`. Vite prints the local URL to open.

   ```bash
   cd frontend
   npm run dev
   ```

The seed creates four test logins. They are listed in the handover document.

## Environment variables

The full list of environment variables and what each one does is in the handover document. It covers the database connection, login security, the frontend URL, email (SMTP) settings and the frontend's API URL. Locally, only `DATABASE_URL` is required. If no SMTP settings are configured, emails are written to the backend console instead of being sent.

## Deployment

The app is hosted on Microsoft Azure:

| Part | Azure service | Deployed by |
|---|---|---|
| Frontend | Static Web Apps | `.github/workflows/azure-static-web-apps-*.yml` |
| Backend | App Service (Web App, Node 22) | `.github/workflows/dev_waverly-tennis.yml` |
| Database | Azure Database for PostgreSQL Flexible Server | Not deployed automatically (see below) |

- Both workflows run automatically on every push to the `dev` branch. Merging a pull request into `dev` deploys it.
- Pull requests into `dev` also get a temporary preview of the frontend.
- **Database schema changes are not applied by the deploy.** After merging a change to `contract.prisma`, run `npx prisma db migrate --advance-ref db` from `backend/` with `DATABASE_URL` pointing at the production database.
- Production settings (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, SMTP) are set in the Azure portal, not in this repository.

The current deployment runs on the development team's student Azure accounts and is temporary. The handover document's "Hosting and Deployment" section explains how to set up the same services in the association's own Azure account. Azure then generates new workflow files, and the two above should be deleted along with their GitHub secrets.

## Repository structure

| Path | Purpose |
|---|---|
| `.github/workflows/` | CI checks and Azure deploy workflows |
| `backend/` | NestJS API (served under `/api`) |
| `backend/src/<area>/` | One module per area: associations, auth, clubs, competitions, fixtures, formats, mail, matches, players, rubbers, seasons, sections, teams |
| `backend/src/prisma/` | Database schema (`contract.prisma`), database client, seed script |
| `backend/migrations/` | Database migration history |
| `backend/test/` | End-to-end tests |
| `backend/.env.example` | Template for the backend's environment variables |
| `frontend/` | React + Vite + Tailwind website |
| `frontend/src/pages/` | One folder per area of the site |
| `frontend/src/components/` | Shared layout and UI pieces |
| `frontend/src/lib/` | API client, login handling, helpers |
| `frontend/.env.production` | The backend URL the deployed website connects to |
| `frontend/staticwebapp.config.json` | Azure Static Web Apps routing settings |
| `docker-compose.yml` | Local PostgreSQL for development |
| `package.json` | Root workspace config that links `frontend/` and `backend/` |

## Licence

Proprietary, Copyright © 2026 Waverley & District Tennis Association Inc. See [LICENCE](LICENCE).
