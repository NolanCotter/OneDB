# OneDB

Use your OneDrive as a database, deployable to Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/NolanCotter/OneDB)

## Features
- Store and retrieve JSON data using your OneDrive
- REST API endpoints for CRUD operations
- Batch endpoint for multiple operations
- API key protection
- In-memory caching for speed
- Automatic token refresh
- Easy Vercel deployment

## Setup

### 1. Register a Microsoft App (One-time setup)

1. Go to [Microsoft Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Click "New registration"
3. Set redirect URI to `https://your-vercel-deployment.vercel.app/api/auth/callback`
4. Copy the **Application (client) ID**
5. Go to "Certificates & secrets" → "New client secret" → copy the secret value

### 2. Get Your Refresh Token

**Option A: Using the OAuth endpoint (Recommended)**
1. Set `ONEDRIVE_CLIENT_ID`, `ONEDRIVE_CLIENT_SECRET`, and `ONEDRIVE_REDIRECT_URI` in your env
2. Call `POST https://your-deployment.vercel.app/api/auth` to get the auth URL
3. Open the URL, sign in, and you'll be redirected to the callback
4. The callback returns your `refresh_token` - save it!

**Option B: Using Microsoft Graph Explorer**
1. Go to [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in and grant `Files.ReadWrite` and `offline_access` permissions
3. Copy the refresh token from the response

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
ONEDRIVE_CLIENT_ID=your-client-id
ONEDRIVE_CLIENT_SECRET=your-client-secret
ONEDRIVE_REDIRECT_URI=https://your-deployment.vercel.app/api/auth/callback
ONEDRIVE_REFRESH_TOKEN=your-refresh-token
API_KEY=your-secure-api-key
```

### 4. Deploy

Deploy to Vercel or run locally with `npm run dev`.

## Endpoints

- `POST /api/auth` – Get OAuth authorization URL
- `GET /api/auth/callback?code=xxx` – Exchange code for tokens (returns refresh token)
- `GET /api/health` – Health check
- `GET /api/data/:key` – Get data (API key required)
- `POST /api/data/:key` – Create data (API key required)
- `PUT /api/data/:key` – Update data (API key required)
- `DELETE /api/data/:key` – Delete data (API key required)
- `POST /api/data/:key/batch` – Batch operations (API key required)

## Example Usage

### Get OAuth URL
```bash
curl -X POST https://your-deployment.vercel.app/api/auth
# Returns: { "url": "https://login.microsoftonline.com/..." }
```

### Get Data
```bash
curl -H "x-api-key: your-api-key" \
     https://your-deployment.vercel.app/api/data/mykey
```

### Store Data
```bash
curl -X POST -H "x-api-key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"name":"test","value":123}' \
     https://your-deployment.vercel.app/api/data/mykey
```

### Batch Request
```json
{
  "operations": [
    { "method": "GET", "key": "foo" },
    { "method": "PUT", "key": "bar", "body": { "x": 1 } },
    { "method": "DELETE", "key": "baz" }
  ]
}
```

```bash
curl -X POST -H "x-api-key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"operations":[...]}' \
     https://your-deployment.vercel.app/api/data/mykey/batch
```

## Notes
- Data is stored as JSON files in your OneDrive under `/onedb/` folder
- Caching is per Vercel instance and lasts 30 seconds
- API key must be sent in `x-api-key` header
- Access tokens are automatically refreshed using the refresh token
- The refresh token does not expire (unless you revoke it)

## License
MIT
