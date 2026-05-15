# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Docker (optional)

## Local Development

### Setup

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Run with Docker Compose

```bash
docker-compose up -d
npm run migrate
npm run dev
```

### Manual Setup

```bash
npm install
createdb by_import
psql by_import < src/db/schema.sql
npm run dev
```

## Production Deployment

### Option 1: Docker

```bash
docker build -t by-import .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -v uploads:/app/uploads \
  by-import
```

### Option 2: Netlify

```bash
npm run build
netlify deploy
```

### Option 3: Vercel

```bash
vercel
```

### Option 4: Heroku

```bash
heroku create
heroku config:set DATABASE_URL=postgresql://...
git push heroku main
```

### Option 5: AWS

1. Build Docker image
2. Push to ECR
3. Deploy to ECS/Fargate

## Environment Variables

See `.env.example` for all required environment variables.

## Database Migration

```bash
npm run migrate
```

## File Upload

Configure `UPLOAD_DIR` and `MAX_FILE_SIZE` in `.env`.

## Health Check

```bash
curl http://localhost:3000/health
```

## Monitoring

Logs are available at:
- Local: Console output (structured with pino)
- Production: Cloud provider's logging service

## Troubleshooting

### Database Connection Issues

```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Port Already in Use

```bash
lsof -i :3000
```

## Support

For issues, open a GitHub issue or contact the development team.
