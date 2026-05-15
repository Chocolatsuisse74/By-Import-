# By-Import Quick Start Guide

Get up and running with By-Import in 5 minutes!

## Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher
- **PostgreSQL** 12 or higher (for data persistence)

Check your versions:

```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
```

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/Chocolatsuisse74/By-Import.git
cd By-Import
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and customize:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/by_import

# API Configuration
API_KEY=your_secret_api_key_here

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=10485760
```

### 4. Setup Database

```bash
# Run migrations
npm run migrate

# This creates:
# - imports table
# - data_sources table
# - import_records table
# - webhooks table
# - webhook_events table
```

### 5. Start Development Server

```bash
npm run dev
```

You should see:

```
[INFO] Server running on port 3000
[INFO] Database connected
[INFO] Health check enabled
```

## First Import

### 1. Prepare Your Data

Create a CSV file `contacts.csv`:

```csv
name,email,phone
John Doe,john@example.com,555-123-4567
Jane Smith,jane@example.com,555-987-6543
Bob Johnson,bob@example.com,555-456-7890
```

### 2. Create Data Source

```bash
curl -X POST http://localhost:3000/api/sources \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Contact List",
    "type": "csv",
    "configuration": {
      "delimiter": ",",
      "hasHeader": true
    }
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "src_abc123",
    "name": "My Contact List",
    "type": "csv"
  }
}
```

**Save the `id` for the next step.**

### 3. Create Import Job with Validation

```bash
curl -X POST http://localhost:3000/api/imports \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "src_abc123",
    "fileName": "contacts.csv",
    "fileType": "csv",
    "validationRules": [
      {
        "field": "name",
        "type": "required",
        "message": "Name is required"
      },
      {
        "field": "email",
        "type": "required",
        "message": "Email is required"
      },
      {
        "field": "email",
        "type": "email",
        "message": "Email must be valid"
      },
      {
        "field": "phone",
        "type": "phone",
        "message": "Phone must be valid"
      }
    ]
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "imp_xyz789",
    "sourceId": "src_abc123",
    "fileName": "contacts.csv",
    "fileType": "csv",
    "status": "pending"
  }
}
```

### 4. Check Import Status

```bash
curl http://localhost:3000/api/imports/imp_xyz789 \
  -H "Authorization: Bearer your_api_key_here"
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "imp_xyz789",
    "status": "completed",
    "totalRecords": 3,
    "processedRecords": 3,
    "failedRecords": 0,
    "completedAt": "2024-05-15T10:15:32Z"
  }
}
```

## Key Endpoints

### Health Check

```bash
curl http://localhost:3000/health
```

### List Imports

```bash
curl http://localhost:3000/api/imports \
  -H "Authorization: Bearer your_api_key_here"
```

### List Sources

```bash
curl http://localhost:3000/api/sources \
  -H "Authorization: Bearer your_api_key_here"
```

## Common Tasks

### Import Excel File

1. **Prepare Excel file** with data
2. **Create source:**

```bash
curl -X POST http://localhost:3000/api/sources \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Excel Data",
    "type": "excel",
    "configuration": {
      "worksheet": 0,
      "hasHeader": true
    }
  }'
```

3. **Create import:**

```bash
curl -X POST http://localhost:3000/api/imports \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "src_excel123",
    "fileName": "data.xlsx",
    "fileType": "excel"
  }'
```

### Import JSON Data

```bash
curl -X POST http://localhost:3000/api/imports \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "src_json123",
    "fileName": "data.json",
    "fileType": "json",
    "validationRules": [
      {
        "field": "id",
        "type": "required",
        "message": "ID is required"
      }
    ]
  }'
```

### Register Webhook

Receive notifications when imports complete:

```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/import-completed",
    "events": ["import.completed", "import.failed"],
    "active": true
  }'
```

Your webhook will receive:

```json
{
  "type": "import.completed",
  "data": {
    "id": "imp_xyz789",
    "sourceId": "src_abc123",
    "totalRecords": 3,
    "processedRecords": 3,
    "failedRecords": 0
  },
  "timestamp": "2024-05-15T10:15:32Z"
}
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Watch mode (re-run on changes)
npm test -- --watch

# Coverage report
npm run test:cov
```

## Building for Production

### 1. Run Security Checks

```bash
npm run security-check
```

This verifies:
- Linting (code style)
- Type checking (TypeScript)
- Secret validation (no API keys in code)

### 2. Build

```bash
npm run build
```

Creates optimized JavaScript in `dist/` directory.

### 3. Start Production Server

```bash
npm start
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t by-import .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@db:5432/by_import \
  -e API_KEY=your_secret_key \
  by-import
```

### Using Docker Compose

```bash
docker-compose up
```

This starts:
- By-Import API (port 3000)
- PostgreSQL database (port 5432)

## Troubleshooting

### Database Connection Error

```
Error: Failed to connect to database
```

**Solution:**

1. Verify PostgreSQL is running:
```bash
pg_isready -h localhost
```

2. Check DATABASE_URL in `.env`

3. Verify database exists:
```bash
psql -U user -d by_import -c "SELECT 1;"
```

### Server Won't Start

```
Error: Port 3000 is already in use
```

**Solution:**

Change PORT in `.env`:
```bash
PORT=3001
```

Or kill existing process:
```bash
lsof -i :3000
kill -9 <PID>
```

### Import Validation Failures

Check the import details to see which records failed:

```bash
curl http://localhost:3000/api/imports/imp_xyz789 \
  -H "Authorization: Bearer your_api_key_here"
```

Review validation errors in the response and check:
- Email format is correct
- Phone format matches rules
- Required fields have values

## Next Steps

1. **Read API Documentation** - See `docs/API.md` for complete endpoint reference
2. **Explore Architecture** - See `docs/ARCHITECTURE.md` for system design
3. **Learn About Parsers** - See `docs/PARSERS.md` for detailed parser & validator guide
4. **Create Custom Validators** - Extend validation for your specific needs
5. **Setup Webhooks** - Integrate with your backend systems
6. **Monitor in Production** - Use health checks and metrics endpoints

## Development Workflow

### 1. Development Server with Hot Reload

```bash
npm run dev
```

Changes to TypeScript files automatically reload!

### 2. Code Linting

```bash
# Check linting
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format
```

### 3. Type Checking

```bash
npm run typecheck
```

### 4. Testing

```bash
npm run test -- --watch
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment (development/production) |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `API_KEY` | - | API authentication key |
| `LOG_LEVEL` | info | Pino log level |
| `RATE_LIMIT_MAX` | 100 | Max requests per minute |
| `MAX_FILE_SIZE` | 10485760 | Max upload size in bytes |

## Getting Help

- **Documentation:** Check `docs/` directory
- **Issues:** Report on GitHub
- **Examples:** See this guide and API docs
- **Code:** Read source in `src/` directory

## Next: Production Deployment

When ready for production:

1. **Setup Database** - Use managed PostgreSQL service
2. **Configure Environment** - Use secure secrets management
3. **Setup Monitoring** - Enable health checks and metrics
4. **Configure Webhooks** - Ensure endpoints are HTTPS
5. **Setup CI/CD** - Automate testing and deployment
6. **Enable Security** - Rate limiting, CORS, input validation

See `docs/ARCHITECTURE.md` for deployment strategies.

---

**Happy importing! 🚀**
