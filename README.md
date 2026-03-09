# OneDB

Use your OneDrive as a database, deployable to Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/NolanCotter/OneDB)

## Features
- Store and retrieve JSON data using your OneDrive
- REST API endpoints for CRUD operations
- Batch endpoint for multiple operations
- API key protection
- In-memory caching for speed
- Easy Vercel deployment

## Setup
1. Register a Microsoft app for OneDrive access (Microsoft Graph API).
2. Copy `.env.example` to `.env` and fill in your credentials and API key.
3. Deploy to Vercel or run locally with `npm run dev`.

## Endpoints
- `POST /api/auth` – Start OAuth flow
- `GET /api/auth/callback` – OAuth callback
- `GET/POST/PUT/DELETE /api/data/:key` – CRUD operations (API key required)
- `POST /api/data/:key/batch` – Batch operations (API key required)

## Example: Batch Request
```json
{
  "operations": [
    { "method": "GET", "key": "foo" },
    { "method": "PUT", "key": "bar", "body": { "x": 1 } },
    { "method": "DELETE", "key": "baz" }
  ]
}
```

## Notes
- Data is stored as JSON files in your OneDrive under `/onedb/`.
- Caching is per Vercel instance and lasts 30 seconds.
- API key must be sent in `x-api-key` header.
- Access token must be sent in `Authorization` header as `Bearer <token>`.

## License
MIT