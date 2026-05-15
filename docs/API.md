# By-Import API Documentation

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Endpoints](#endpoints)
  - [Imports](#imports)
  - [Sources](#sources)
  - [Webhooks](#webhooks)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

By-Import provides a comprehensive RESTful API for managing data imports, sources, and transformations. The API supports multiple data formats including CSV, Excel, and JSON, with built-in validation and transformation capabilities.

## Authentication

Currently, By-Import uses environment-based API keys. Set the `API_KEY` in your `.env` file:

```bash
API_KEY=your_api_key_here
```

Include the key in request headers:

```bash
Authorization: Bearer YOUR_API_KEY
```

## Base URL

```
http://localhost:3000/api
```

## Response Format

All API responses follow a consistent JSON structure:

### Success Response (2xx)

```json
{
  "success": true,
  "data": {},
  "timestamp": "2024-05-15T10:30:00Z"
}
```

### Error Response (4xx, 5xx)

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-05-15T10:30:00Z"
}
```

## Endpoints

### Imports

#### List All Imports

```bash
GET /imports
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: pending, processing, completed, failed |
| `sourceId` | string | Filter by source ID |
| `limit` | number | Results per page (default: 20, max: 100) |
| `offset` | number | Pagination offset (default: 0) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/imports?status=completed&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "imp_123abc",
      "sourceId": "src_456def",
      "fileName": "contacts.csv",
      "fileType": "csv",
      "status": "completed",
      "totalRecords": 1000,
      "processedRecords": 1000,
      "failedRecords": 0,
      "startedAt": "2024-05-15T09:00:00Z",
      "completedAt": "2024-05-15T09:15:32Z",
      "createdAt": "2024-05-15T09:00:00Z",
      "updatedAt": "2024-05-15T09:15:32Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 10,
    "offset": 0
  }
}
```

#### Create Import Job

```bash
POST /imports
```

**Request Body:**

```json
{
  "sourceId": "src_456def",
  "fileName": "contacts.csv",
  "fileType": "csv",
  "validationRules": [
    {
      "field": "email",
      "type": "email",
      "message": "Invalid email format"
    },
    {
      "field": "phone",
      "type": "phone",
      "message": "Invalid phone format"
    }
  ]
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/imports" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "src_456def",
    "fileName": "contacts.csv",
    "fileType": "csv",
    "validationRules": [
      {
        "field": "email",
        "type": "email",
        "message": "Invalid email format"
      }
    ]
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "imp_123abc",
    "sourceId": "src_456def",
    "fileName": "contacts.csv",
    "fileType": "csv",
    "status": "pending",
    "totalRecords": 0,
    "processedRecords": 0,
    "failedRecords": 0,
    "createdAt": "2024-05-15T10:00:00Z",
    "updatedAt": "2024-05-15T10:00:00Z"
  }
}
```

#### Get Import Details

```bash
GET /imports/:id
```

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/imports/imp_123abc" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "imp_123abc",
    "sourceId": "src_456def",
    "fileName": "contacts.csv",
    "fileType": "csv",
    "status": "processing",
    "totalRecords": 1000,
    "processedRecords": 450,
    "failedRecords": 5,
    "startedAt": "2024-05-15T09:00:00Z",
    "createdAt": "2024-05-15T09:00:00Z",
    "updatedAt": "2024-05-15T09:05:00Z"
  }
}
```

#### Update Import

```bash
PUT /imports/:id
```

**Request Body:**

```json
{
  "status": "processing",
  "validationRules": []
}
```

**Example Request:**

```bash
curl -X PUT "http://localhost:3000/api/imports/imp_123abc" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "processing"
  }'
```

#### Cancel/Delete Import

```bash
DELETE /imports/:id
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/api/imports/imp_123abc" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Sources

#### List All Sources

```bash
GET /sources
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by type: csv, database, api, excel |
| `isActive` | boolean | Filter by active status |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset (default: 0) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/sources?type=csv&isActive=true" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Create Data Source

```bash
POST /sources
```

**Request Body:**

```json
{
  "name": "Customer Database",
  "type": "database",
  "configuration": {
    "host": "db.example.com",
    "port": 5432,
    "database": "customers",
    "username": "dbuser",
    "table": "contacts"
  }
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/sources" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Database",
    "type": "database",
    "configuration": {
      "host": "db.example.com",
      "port": 5432,
      "database": "customers",
      "username": "dbuser",
      "table": "contacts"
    }
  }'
```

#### Get Source Details

```bash
GET /sources/:id
```

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/sources/src_456def" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Update Source

```bash
PUT /sources/:id
```

**Example Request:**

```bash
curl -X PUT "http://localhost:3000/api/sources/src_456def" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Customer Database",
    "configuration": {
      "host": "db-new.example.com",
      "port": 5432,
      "database": "customers",
      "username": "newuser",
      "table": "contacts"
    }
  }'
```

#### Delete Source

```bash
DELETE /sources/:id
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/api/sources/src_456def" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Webhooks

#### Register Webhook

```bash
POST /webhooks
```

**Request Body:**

```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["import.completed", "import.failed"],
  "active": true
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/webhooks" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhook",
    "events": ["import.completed", "import.failed"],
    "active": true
  }'
```

#### List Webhooks

```bash
GET /webhooks
```

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/webhooks" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Delete Webhook

```bash
DELETE /webhooks/:id
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/api/webhooks/wh_789ghi" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Error Handling

The API uses standard HTTP status codes:

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request body |
| 401 | Unauthorized | Missing/invalid API key |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

### Error Response Example

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-05-15T10:30:00Z"
}
```

## Rate Limiting

API requests are rate limited:

- **Standard:** 100 requests per minute
- **Burst:** 1000 requests per 5 minutes

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1715768400
```

## Examples

### Complete Workflow: CSV Import

#### 1. Create Data Source

```bash
curl -X POST "http://localhost:3000/api/sources" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Sales Report",
    "type": "csv",
    "configuration": {
      "format": "csv",
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
    "id": "src_sales_001",
    "name": "Monthly Sales Report",
    "type": "csv",
    "isActive": true,
    "createdAt": "2024-05-15T10:00:00Z"
  }
}
```

#### 2. Create Import Job with Validation

```bash
curl -X POST "http://localhost:3000/api/imports" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "src_sales_001",
    "fileName": "sales_may_2024.csv",
    "fileType": "csv",
    "validationRules": [
      {
        "field": "email",
        "type": "email",
        "message": "Email must be valid"
      },
      {
        "field": "amount",
        "type": "number",
        "message": "Amount must be numeric"
      },
      {
        "field": "date",
        "type": "date",
        "message": "Date must be valid"
      }
    ]
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "imp_sales_001",
    "sourceId": "src_sales_001",
    "fileName": "sales_may_2024.csv",
    "fileType": "csv",
    "status": "pending",
    "totalRecords": 0,
    "processedRecords": 0,
    "failedRecords": 0,
    "createdAt": "2024-05-15T10:05:00Z"
  }
}
```

#### 3. Monitor Progress

```bash
curl -X GET "http://localhost:3000/api/imports/imp_sales_001" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### 4. Register Webhook for Completion

```bash
curl -X POST "http://localhost:3000/api/webhooks" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/import-completed",
    "events": ["import.completed", "import.failed"],
    "active": true
  }'
```

### Python Client Example

```python
import requests
import json

BASE_URL = "http://localhost:3000/api"
API_KEY = "your_api_key_here"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Create import
import_data = {
    "sourceId": "src_001",
    "fileName": "data.csv",
    "fileType": "csv",
    "validationRules": [
        {
            "field": "email",
            "type": "email",
            "message": "Invalid email"
        }
    ]
}

response = requests.post(
    f"{BASE_URL}/imports",
    json=import_data,
    headers=headers
)

result = response.json()
print(f"Import ID: {result['data']['id']}")

# Poll for status
import_id = result['data']['id']
status_response = requests.get(
    f"{BASE_URL}/imports/{import_id}",
    headers=headers
)

print(f"Status: {status_response.json()['data']['status']}")
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const API_KEY = process.env.API_KEY;

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function createImport() {
  try {
    const response = await client.post('/imports', {
      sourceId: 'src_001',
      fileName: 'data.csv',
      fileType: 'csv',
      validationRules: [
        {
          field: 'email',
          type: 'email',
          message: 'Invalid email'
        }
      ]
    });

    console.log('Import created:', response.data.data.id);
    return response.data.data;
  } catch (error) {
    console.error('Error creating import:', error.response.data);
    throw error;
  }
}

async function getImportStatus(importId) {
  const response = await client.get(`/imports/${importId}`);
  return response.data.data;
}

// Usage
createImport()
  .then(importData => {
    console.log(`Tracking import: ${importData.id}`);
    return getImportStatus(importData.id);
  })
  .then(status => console.log('Current status:', status))
  .catch(error => console.error(error));
```

## Health Check

```bash
GET /health
```

Returns API and database health status:

```json
{
  "status": "healthy",
  "timestamp": "2024-05-15T10:30:00Z",
  "uptime": 3600,
  "services": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 45
    },
    {
      "name": "api",
      "status": "healthy",
      "responseTime": 120
    }
  ]
}
```

## Metrics

```bash
GET /metrics
```

Returns Prometheus-compatible metrics in text format.
