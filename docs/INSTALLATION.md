# Installation

This guide installs Nati Nest for local development and Docker-based verification.

## Prerequisites

- Node.js 22
- npm 11.6.x recommended to match the Dockerfiles
- PostgreSQL database
- Docker Desktop for container runs
- Git

## Clone and Install

```bash
git clone https://github.com/KGS11/Nati-Nest-Smart-QR-Canteen.git
cd Nati-Nest-Smart-QR-Canteen
```

Install backend dependencies:

```bash
cd backend
npm ci
npx prisma generate
```

Install frontend dependencies:

```bash
cd ../frontend
npm ci
```

## Environment Files

For Docker, copy the root template:

```bash
copy .env.example .env
```

For separate local processes, use:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

Fill `DATABASE_URL`, `JWT_SECRET`, `SESSION_JWT_SECRET`, frontend public URLs, and optional Cloudinary settings. Full details are in [ENVIRONMENT.md](ENVIRONMENT.md).

## Database Setup

From `backend/`:

```bash
npx prisma migrate deploy
npx prisma db seed
```

For active schema development, use Prisma migration commands intentionally and commit generated migration files.

## Run Locally Without Docker

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Health: `http://localhost:5000/health`

## Run With Docker Compose

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
```

The Nginx service publishes the application on `http://localhost` and proxies API traffic to the backend.

## Seed Accounts

The source seed file creates:

| Role | Phone | Password |
| --- | --- | --- |
| Admin | `9999999999` | `Admin@123` |
| Server | `8888888888` | `Waiter@123` |
| Kitchen | `7777777777` | `Kitchen@123` |

Change these passwords before production use.

