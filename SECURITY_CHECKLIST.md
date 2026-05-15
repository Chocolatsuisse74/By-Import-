# Security Implementation Checklist

Quick reference for security features implemented in By-Import.

## Pre-Development Setup

- [ ] Copy `.env.example` to `.env.local` (development only)
- [ ] Never commit `.env` or `.env.local` files
- [ ] Add test values for `DATABASE_URL` and `ANTHROPIC_API_KEY`
- [ ] Run `npm install` to get all dependencies

## Running the Application

```bash
# Development with all security features
npm run dev

# Validate environment configuration
npm run validate-secrets

# Build with TypeScript checking
npm run build

# Run tests
npm run test
```

## Security Features Summary

### 1. Environment Validation
- Zod-based strict validation at startup
- Required: `DATABASE_URL`, `ANTHROPIC_API_KEY`
- Fails fast if configuration is invalid
- Script: `scripts/validate-secrets.ts`

### 2. Input Validation
- All API endpoints validate requests against Zod schemas
- Request body, params, and query are validated
- Invalid requests return 400 Bad Request
- Details hidden in production, visible in development

### 3. Input Sanitization
- Null bytes removed
- Control characters stripped
- HTML brackets removed (XSS prevention)
- Object keys sanitized
- Automatically applied to all requests

### 4. Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 5. Rate Limiting
- 100 requests per minute per IP address
- Automatic block returns 429 Too Many Requests
- In-memory implementation (use Redis for production)

### 6. CSRF Protection
- Token-based validation for POST, PUT, PATCH, DELETE
- Tokens expire after 24 hours
- Disabled in development mode
- Check header: `x-csrf-token` or body field: `csrfToken`

### 7. Error Handling
**Production**: Generic errors, no details exposed
```json
{ "error": "Internal server error" }
```

**Development**: Full error details
```json
{
  "error": "Internal server error",
  "message": "Details here",
  "stack": "Full stack trace"
}
```

### 8. Webhook Security
- HTTPS URL enforcement (no HTTP)
- UUID validation for webhook IDs
- Event type validation (agent_message, lead_created, deal_closed)
- URL length limit (2048 chars)

## API Usage Examples

### Validate Request
All endpoints automatically validate:

```bash
# Valid request
curl -X POST http://localhost:3000/api/imports \
  -H "Content-Type: application/json" \
  -d '{"sourceId":"550e8400-e29b-41d4-a716-446655440000","fileName":"data.csv","fileType":"csv"}'

# Invalid request (returns 400)
curl -X POST http://localhost:3000/api/imports \
  -H "Content-Type: application/json" \
  -d '{"sourceId":"not-a-uuid","fileName":"data.csv","fileType":"invalid"}'
```

### CSRF Protection (Production)
```bash
# 1. Get CSRF token (endpoint available)
# 2. Include in POST request
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: your-csrf-token-here" \
  -d '{"url":"https://example.com/webhook","events":["agent_message"]}'
```

## Common Issues

### Build Fails: Environment Variables Missing
```
Solution: Set DATABASE_URL and ANTHROPIC_API_KEY before building
export DATABASE_URL="postgresql://..."
export ANTHROPIC_API_KEY="sk-ant-..."
npm run build
```

### Validation Errors in Production
```
Check: Server logs show validation details
Client sees: "Invalid request data" (no details)
Expected: Yes, this is secure-by-design
```

### Rate Limit Exceeded
```
Error: 429 Too Many Requests
Cause: More than 100 requests/minute from your IP
Solution: Wait 60 seconds or use different IP
Header: retryAfter shows seconds to wait
```

### CSRF Validation Failed
```
Error: 403 Forbidden
Cause: Missing or invalid CSRF token
Solution: Ensure POST/PUT/PATCH/DELETE include x-csrf-token header
Note: Disabled in development mode (NODE_ENV=development)
```

## Production Deployment Checklist

- [ ] `NODE_ENV=production`
- [ ] `LOG_LEVEL=warn` or `error` (not debug)
- [ ] `DATABASE_URL` uses strong password
- [ ] `ANTHROPIC_API_KEY` from production account
- [ ] All secrets from secure vault (AWS Secrets Manager, Vault, etc.)
- [ ] No `.env` files in repository
- [ ] HTTPS enabled and enforced
- [ ] Security headers verified (use curl -I)
- [ ] Rate limits appropriate for expected load
- [ ] Logging configured with external service
- [ ] Error alerting configured
- [ ] Secrets rotation scheduled

## Documentation References

- **Full Security Guide**: `docs/SECURITY.md`
- **Secrets Documentation**: `docs/.env.secrets`
- **Validation Script**: `scripts/validate-secrets.ts`
- **API Routes**: See individual route files with validation

## Support

For security issues or questions:
1. Review `docs/SECURITY.md` for detailed information
2. Check `docs/.env.secrets` for secrets management
3. Review relevant route file for API-specific validation
4. Run `npm run validate-secrets` to check configuration
