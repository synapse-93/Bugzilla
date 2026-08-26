# Deployment

Deployment is part of the product, not a final step.

## Required production topology

```text
Public browser
   ↓
Frontend deployment
   ↓ HTTPS
Backend deployment
   ↓
Managed production database
```

## Environment variables

### Frontend

`VITE_API_URL` — public backend API base URL.

### Backend

`DATABASE_URL` — production database connection string.

`CORS_ORIGINS` — comma-separated allowed frontend origins.

`JWT_SECRET` — production authentication secret.

## Pre-deployment checks

1. Build frontend with production configuration.
2. Start backend with production environment variables.
3. Verify `/health`.
4. Verify backend can reach the database.
5. Verify authentication from the public frontend.
6. Verify the complete issue lifecycle against production data.
7. Test from a fresh browser session and a second network/device.

Never commit real secrets or production connection strings.
