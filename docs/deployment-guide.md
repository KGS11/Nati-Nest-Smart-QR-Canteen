# Nati Nest QR Canteen - Deployment Guide

This guide details the procedures for deploying the Nati Nest QR Canteen Management System in both standalone and containerized environments.

---

## 1. Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/nati_nest?schema=public&connection_limit=3"
JWT_SECRET="YOUR_RANDOM_JWT_SECRET_STRING_32_CHARS_MIN"
CLIENT_URL="https://yourdomain.com"
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
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
NEXT_PUBLIC_SOCKET_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

---

## 2. Standalone Deployment (Bare Metal / VM)

### Prerequisites
- Node.js v18 or later
- PostgreSQL 15+

### 1. Database Setup
Ensure PostgreSQL is running and has a database matching `DATABASE_URL`. Run migration and seed:
```bash
cd backend
npm install
npx prisma migrate deploy
npx ts-node prisma/seed.ts
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

## 3. Docker Deployment (Containerized)

The repository provides a `docker-compose.yml` to spin up PostgreSQL, Backend, and Frontend.

### 1. Setup Environment Files
Make sure `./backend/.env.production` and `./frontend/.env.production` are configured correctly.

### 2. Run Containers
Run from the root directory:
```bash
docker-compose up --build -d
```

### 3. Run Migrations inside Container
Run Prisma migrations inside the backend container to provision the DB schema:
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx ts-node prisma/seed.ts
```

---

## 4. SSL Setup (Nginx Reverse Proxy)

We recommend using Nginx to handle SSL termination and forward requests to the frontend and backend servers.

### Sample Nginx Configuration (`/etc/nginx/sites-available/default`)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000; # Next.js frontend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000; # Express backend API
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000; # Socket.IO server
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Obtain free SSL certificates using Let's Encrypt / Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 5. Production Checklist

- [ ] Disable dev logs or verbose debug print levels.
- [ ] Verify that `NODE_ENV` is set to `production` in the backend environment.
- [ ] Change default seed passwords for administrative staff.
- [ ] Verify rate limiter values are appropriate for normal restaurant traffic.
- [ ] Verify database connection pooling handles peak traffic without scaling exhaustively.
- [ ] Secure WebSocket traffic by serving over Secure WebSockets (`wss://`).
