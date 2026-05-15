# By-Import Architecture

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Design Patterns](#design-patterns)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [Error Handling Strategy](#error-handling-strategy)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)

## System Overview

By-Import is a data import and integration platform designed for enterprise-scale data operations. The system architecture follows a modular, event-driven design that enables:

- **Multi-format support** (CSV, Excel, JSON, XML)
- **Concurrent processing** with streaming for large datasets
- **Validation pipeline** with custom rules
- **Transformation engine** for data mapping and enrichment
- **Webhook integration** for downstream system updates
- **Comprehensive audit trail** for compliance

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│                   (Web UI, Scripts, Integrations)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Express.js API  │
                    │  (Port 3000)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────┐          ┌─────────┐          ┌──────────┐
    │ Imports│          │ Sources │          │ Webhooks │
    │ Router │          │ Router  │          │ Router   │
    └────┬───┘          └────┬────┘          └────┬─────┘
         │                   │                    │
         └───────────┬───────┴────────┬───────────┘
                     │                │
          ┌──────────▼──────────┐     │
          │  Request Middleware  │     │
          │ (Validation, CORS,   │     │
          │  Rate Limiting)      │     │
          └──────────┬──────────┘     │
                     │                │
        ┌────────────▼──────────────┐ │
        │   Parse & Validate Layer   │ │
        ├────────────────────────────┤ │
        │  CSV/Excel/JSON Parser     │ │
        │  Data Validation Engine    │ │
        │  Schema Mapper             │ │
        └────────────┬───────────────┘ │
                     │                 │
        ┌────────────▼──────────────┐  │
        │  Transformation Layer      │  │
        ├────────────────────────────┤  │
        │  Field Mapping             │  │
        │  Aggregation               │  │
        │  Custom Transformations    │  │
        └────────────┬───────────────┘  │
                     │                  │
        ┌────────────▼──────────────┐   │
        │  Data Processing Pipeline   │  │
        ├────────────────────────────┤   │
        │  Batch Processing          │   │
        │  Stream Processing         │   │
        │  Error Recovery            │   │
        └────────────┬───────────────┘   │
                     │                   │
        ┌────────────▼──────────────┐    │
        │   Database Layer           │    │
        ├────────────────────────────┤    │
        │  PostgreSQL                │    │
        │  Data Persistence          │    │
        │  Query Optimization        │    │
        └────────────┬───────────────┘    │
                     │                    │
        ┌────────────▼──────────────────┐│
        │  Webhook & Event System      ││
        ├──────────────────────────────┘│
        │  Event Queue                  │
        │  Retry Logic                  │
        │  Delivery Tracking            │
        └──────────────────────────────┘
```

## Core Components

### 1. API Router Layer (`src/api/`)

**Responsibility:** Handle HTTP requests and route to appropriate handlers.

**Key Files:**
- `index.ts` - Express app creation and middleware setup
- `routes/imports.ts` - Import management endpoints
- `routes/sources.ts` - Data source management
- `routes/webhooks.ts` - Webhook registration and management

**Technologies:**
- Express.js for HTTP server
- Pino for structured logging
- Custom middleware for CORS, rate limiting, validation

### 2. Parser Layer (`src/parser/`)

**Responsibility:** Convert raw file data into structured records.

**Key Files:**
- `csvParser.ts` - CSV file parsing using csv-parser library
- `excelParser.ts` - Excel file parsing using ExcelJS
- `jsonParser.ts` - JSON file parsing and validation

**Design Pattern:** Strategy Pattern
- Each parser implements a common interface
- Parsers are selected based on file type
- Extensible for adding new formats

### 3. Validator Layer (`src/validators/`)

**Responsibility:** Validate data against defined rules.

**Key Files:**
- `validator.ts` - Core validation engine
- Supports validation types:
  - `required` - Field must have a value
  - `email` - Valid email format
  - `phone` - Valid phone number
  - `number` - Numeric value
  - `date` - Valid date format
  - `custom` - User-defined validators

### 4. Transformation Layer

**Responsibility:** Transform and enrich data during import.

**Operations Supported:**
- **Map:** Convert field values (e.g., normalize dates)
- **Filter:** Include/exclude records based on conditions
- **Aggregate:** Combine multiple records
- **Custom:** User-defined transformation logic

### 5. Database Layer (`src/db/`)

**Responsibility:** Persist data and maintain audit trail.

**Tables:**
- `imports` - Import job records
- `data_sources` - Source configurations
- `import_records` - Individual record tracking
- `validation_results` - Validation outcome details
- `webhooks` - Webhook configurations
- `webhook_events` - Delivery tracking

**Design Pattern:** Repository Pattern
- Abstraction over database operations
- Connection pooling via PG library
- Query optimization with indexes

### 6. Middleware Layer (`src/middleware/`)

**Key Middleware:**

**ValidationMiddleware**
- Input sanitization
- Request size limits (10MB default)
- XSS protection

**RateLimiter**
- Token bucket algorithm
- Configurable limits (100 req/min default)
- Per-API-key tracking

**HealthCheck**
- System health monitoring
- Database connectivity check
- Response time metrics

**Metrics**
- Prometheus-compatible metrics
- Request/response tracking
- Performance monitoring

### 7. Webhook System (`src/webhooks/`)

**Responsibility:** Event delivery to external systems.

**Features:**
- Event filtering
- Automatic retry with exponential backoff
- Delivery status tracking
- Failed delivery queues

**Event Types:**
- `import.started`
- `import.processing`
- `import.completed`
- `import.failed`
- `validation.error`

## Data Flow

### Import Processing Workflow

```
1. Client Initiates Import
   │
   ├─ POST /api/imports
   │
   ▼
2. Create Import Job
   │
   ├─ Generate Job ID
   ├─ Store metadata
   │
   ▼
3. File Upload
   │
   ├─ Receive file buffer
   │
   ▼
4. Parse File
   │
   ├─ Detect format
   ├─ Run appropriate parser
   ├─ Generate records
   │
   ▼
5. Validate Records
   │
   ├─ Apply validation rules
   ├─ Track errors
   │
   ▼
6. Transform Data
   │
   ├─ Apply transformations
   ├─ Map fields
   ├─ Enrich data
   │
   ▼
7. Store Records
   │
   ├─ Batch insert to database
   ├─ Update job status
   │
   ▼
8. Emit Events
   │
   ├─ Trigger webhooks
   ├─ Log completion
   │
   ▼
9. Return Status
   │
   └─ Send results to client
```

## Design Patterns

### 1. Strategy Pattern - Parser Selection

Each parser implements the same interface, allowing selection at runtime based on file type.

### 2. Middleware Pipeline

Requests flow through multiple middleware layers for validation, security, and transformation.

### 3. Repository Pattern - Data Access

Data access is abstracted through repository interfaces for database independence.

### 4. Event-Driven Architecture

Import completion triggers events that subscribers (webhooks, loggers, metrics) can handle.

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express.js | HTTP server framework |
| **Language** | TypeScript | Type-safe JavaScript |
| **Database** | PostgreSQL | Data persistence |
| **Parser - CSV** | csv-parser | CSV file parsing |
| **Parser - Excel** | ExcelJS | Excel file handling |
| **Validation** | Joi, Zod | Data validation |
| **Logging** | Pino | Structured logging |
| **Testing** | Vitest | Unit testing |

## Database Schema

### Core Tables

**imports**
```sql
CREATE TABLE imports (
  id VARCHAR(36) PRIMARY KEY,
  source_id VARCHAR(36),
  file_name VARCHAR(255),
  file_type VARCHAR(20),
  status VARCHAR(20),
  total_records INTEGER,
  processed_records INTEGER,
  failed_records INTEGER,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**data_sources**
```sql
CREATE TABLE data_sources (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50),
  configuration JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling Strategy

### Multi-Level Error Recovery

```
┌─ Record Level Errors
│  ├─ Log error
│  ├─ Store in error table
│  └─ Continue processing
│
├─ Batch Level Errors
│  ├─ Partial rollback
│  ├─ Retry mechanism
│  └─ Exponential backoff
│
└─ System Level Errors
   ├─ Circuit breaker
   ├─ Graceful degradation
   └─ Alert operators
```

## Security Architecture

### Input Validation

1. **Request Size Limits** - 10MB max
2. **Content-Type Validation** - JSON only
3. **Field Sanitization** - Remove dangerous characters
4. **Schema Validation** - Joi/Zod schemas

### Authentication & Authorization

1. **API Key Authentication** - Environment-based
2. **Rate Limiting** - 100 req/min per key
3. **HTTPS Required** - In production
4. **Header Validation** - CORS checks

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## Scalability Considerations

### Horizontal Scaling

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Node 1   │  │ Node 2   │  │ Node 3   │
│Port 3000 │  │Port 3001 │  │Port 3002 │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
            ┌──────▼──────┐
            │ Load Balancer│
            │ (nginx)      │
            └──────┬───────┘
                   │
            ┌──────▼──────────────┐
            │ PostgreSQL Cluster   │
            │ (Master-Slave)       │
            └──────────────────────┘
```

### Performance Optimizations

1. **Connection Pooling** - PG library with pooling
2. **Database Indexes** - On frequently queried fields
3. **Query Optimization** - Batch operations
4. **Caching Strategy** - Redis for metadata
5. **Stream Processing** - Memory-efficient large files

## Deployment Architecture

### Development

```
npm run dev
  │
  └─ tsx watch src/index.ts
     └─ Hot reload on changes
```

### Production

```
Docker Image
  ├─ Node 18+ runtime
  ├─ TypeScript compiled to JS
  ├─ Environment-based config
  └─ Health checks
     │
     ├─ Kubernetes orchestration
     ├─ PostgreSQL cluster
     └─ Redis cache (optional)
```

## Future Enhancements

- [ ] Message queue integration (RabbitMQ, Kafka)
- [ ] Advanced caching layer (Redis)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] GraphQL API support
- [ ] Real-time WebSocket updates
- [ ] ML-based anomaly detection
- [ ] Multi-region support
- [ ] Custom plugin system
