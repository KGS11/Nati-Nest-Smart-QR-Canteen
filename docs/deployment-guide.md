# Nati Nest QR Canteen - Deployment Guide

This guide details the procedures for deploying the Nati Nest QR Canteen Management System in both standalone and containerized environments.

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/nati_nest?schema=public&connection_limit=3"
JWT_SECRET="YOUR_RANDOM_JWT_SECRET_STRING_32_CHARS_MIN"
CLIENT_URL="http://localhost:3000"
APP_TIMEZONE="Asia/Kolkata"

# Cloudinary (Optional, for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
> [!IMPORTANT]
> Keep `connection_limit=3` (or low numbers) in `DATABASE_URL` when connecting to serverless PostgreSQL databases like Neon to avoid exhausting server connection limits under load.

### Frontend (`frontend/.env.local`)
Create a `.env.local` or `.env.production` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Standalone Deployment (Bare Metal / VM)

### Prerequisites
- Node.js v18 or later
- PostgreSQL 15+

### 1. Database Setup
Ensure PostgreSQL is running and has a database matching `DATABASE_URL`. Run migration and seed:
```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed
```

### 2. Backend Server Build & Run
Compile TypeScript and start Express:
```bash
npm run build
npm run start
```

### 3. Frontend Build & Run
Compile Next.js and start:
```bash
cd ../frontend
npm install
npm run build
npm run start
```

---

## Docker Deployment (Containerized)

The repository provides a `docker-compose.yml` to spin up PostgreSQL, Backend, and Frontend.

### 1. Setup Environment Files
Make sure `./backend/.env.production.example` and `./frontend/.env.production.example` are filled or rename them.

### 2. Run Containers
Run from the root directory:
```bash
docker-compose up --build -d
```

### 3. Run Migrations inside Container
Run Prisma migrations inside the backend container to provision the DB schema:
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```
The application will be running at:
- **Frontend**: http://localhost:3000
- **Backend/API**: http://localhost:5000
