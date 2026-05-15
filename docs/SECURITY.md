# Security Implementation Guide

This document outlines the security improvements implemented in By-Import.

## Environment Validation

Environment variables are validated at startup using Zod schemas with strict type checking.

### Features
- **Strict Validation**: All environment variables are validated on application startup
- **Fail Fast**: Application exits immediately if required variables are missing
- **Type Safety**: Zod ensures correct types for all configuration values
- **Development Support**: Special handling for development vs production environments

### Critical Secrets
- `DATABASE_URL`: PostgreSQL connection string (required)
- `ANTHROPIC_API_KEY`: Anthropic API token (required)

### Validation Script
Run validation before deployment:
```bash
npm run validate-secrets
```

## Input Validation & Sanitization

All API endpoints include comprehensive input validation and sanitization.

### Middleware Stack
1. **Request Size Limit**: Prevents DoS attacks via large payloads (10MB default)
2. **Content Type Validation**: Accepts only JSON and multipart/form-data
3. **Rate Limiting**: 100 requests per minute per IP address
4. **Input Sanitization**: Removes null bytes, control characters, and HTML tags
5. **CSRF Protection**: Validates tokens for state-changing requests (POST, PUT, PATCH, DELETE)

### Sanitization Features
- Removes null bytes (`\0`) and control characters (`\x00-\x1F`, `\x7F`)
- Strips HTML brackets to prevent XSS
- Sanitizes object keys to allow only `[a-zA-Z0-9._-]`
- Preserves safe whitespace while trimming edges

## Zod Schemas for Request Validation

All request bodies are validated against Zod schemas before processing.

### Import Job Validation
```typescript
createImportJobSchema: {
  sourceId: UUID validation
  fileName: 1-255 chars, alphanumeric with limited special chars
  fileType: 'csv' | 'excel' | 'json' | 'xml'
  totalRecords: Non-negative integer
}
```

### Data Source Validation
```typescript
createDataSourceSchema: {
  name: 1-255 chars, no path traversal patterns
  type: 'csv' | 'database' | 'api' | 'excel'
  configuration: Max 50 properties, no plaintext secrets
}
```

### Webhook Validation
```typescript
registerWebhookSchema: {
  url: Valid HTTPS URL only (security requirement)
  events: At least one event type required
}
```

## Error Handling

Errors are handled securely with different responses for production vs development.

### Production
- Generic error messages ("Internal server error")
- Full error details logged server-side only
- No stack traces exposed to clients

### Development
- Detailed error messages with stack traces
- Helps with debugging without exposing secrets

## Security Headers

Comprehensive security headers are set on all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevents MIME type sniffing |
| X-Frame-Options | DENY | Prevents clickjacking |
| X-XSS-Protection | 1; mode=block | XSS protection |
| Strict-Transport-Security | max-age=31536000 | Forces HTTPS |
| Content-Security-Policy | default-src 'self' | Restricts content sources |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer info |
| Permissions-Policy | Denies geolocation, microphone, camera | Restricts API access |

## CSRF Protection

Cross-Site Request Forgery protection is implemented for state-changing requests.

- Tokens are generated per session/IP
- Tokens expire after 24 hours
- Disabled in development mode for testing convenience
- Validates `x-csrf-token` header or `csrfToken` body field

## Secrets Management

### Documentation
See `docs/.env.secrets` for comprehensive secrets documentation including:
- Secret types and formats
- Rotation policies
- Exposure handling procedures
- Environment-specific guidelines

### Pre-deployment Checklist
- [ ] DATABASE_URL uses strong password
- [ ] ANTHROPIC_API_KEY is production key
- [ ] NODE_ENV is set to 'production'
- [ ] LOG_LEVEL is 'warn' or 'error' (not 'debug')
- [ ] Upload/temp directories on encrypted partitions
- [ ] All variables set via secure vault (AWS Secrets Manager, HashiCorp Vault)
- [ ] No .env files committed to version control
- [ ] Access to variables is logged and audited

## Sensitive Data Protection

### Configuration Objects
- Reject plaintext passwords/secrets in configuration
- Enforce use of environment variables for sensitive data
- Validate that no `password` or `secret` fields contain values

### File Uploads
- Validate file extensions (reject `.exe`, `.sh`, etc.)
- Limit file sizes to prevent resource exhaustion
- Store uploads in separate directory with restricted permissions (700)

## Rate Limiting

Simple in-memory rate limiter with automatic cleanup:
- 100 requests per minute per IP address
- Window-based sliding implementation
- Automatic cleanup of old entries when map reaches 10,000 entries

**Note**: For production, consider using Redis or external service.

## Logging

Security-relevant events are logged:
- Validation errors (field, message, path, method)
- Rate limit violations (IP, count)
- CSRF failures (IP, path)
- Content type rejections
- Error stack traces (server-side only)

## Best Practices

### Development
1. Use `.env.local` for local secrets
2. Never commit `.env` files
3. Use test/placeholder values
4. Enable debug logging for troubleshooting

### Production
1. Use secure vault (AWS Secrets Manager, HashiCorp Vault)
2. Enable HTTPS only
3. Set NODE_ENV=production
4. Limit logging to warn/error level
5. Monitor for suspicious patterns
6. Rotate secrets regularly

### API Design
1. Always validate request data with Zod schemas
2. Use middleware for cross-cutting concerns
3. Sanitize outputs in development mode only
4. Log errors server-side, return generic messages to clients
5. Use appropriate HTTP status codes

## Security Validation

Validate your security setup:

```bash
# Check environment configuration
npm run validate-secrets

# Build with validation
npm run build

# TypeScript type checking
npx tsc --noEmit

# Review security headers
curl -I http://localhost:3000/api/imports
```

## References

- [OWASP Application Security](https://owasp.org/)
- [CWE-798: Hard-Coded Credentials](https://cwe.mitre.org/data/definitions/798.html)
- [NIST Cryptographic Key Management](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Zod Validation Library](https://zod.dev/)
