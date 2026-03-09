# OneDB

Use your OneDrive as a database, deployable to Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/NolanCotter/OneDB)

## Features
- Store and retrieve JSON data using your OneDrive
- REST API endpoints for CRUD operations
- Batch endpoint for multiple operations
- API key protection
- In-memory caching for speed
- **No Azure app registration required**
- Easy Vercel deployment

## Quick Start

### 1. Get Your OneDrive Token
1. Go to [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in, grant `Files.ReadWrite` permission
3. Copy the access token from the "Access token" tab

### 2. Generate API Key
```bash
openssl rand -hex 32
```

### 3. Set Environment Variables
```bash
ONEDRIVE_ACCESS_TOKEN=your-token-from-step-1
API_KEY=your-key-from-step-2
```

### 4. Deploy
```bash
npm install
npm run dev
```

See [SETUP.md](./SETUP.md) for detailed instructions.

## Endpoints

- `GET /api/health` – Health check
- `GET /api/data/:key` – Get data (API key required)
- `POST /api/data/:key` – Create data (API key required)
- `PUT /api/data/:key` – Update data (API key required)
- `DELETE /api/data/:key` – Delete data (API key required)
- `POST /api/data/:key/batch` – Batch operations (API key required)

## Example Usage

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

## Notes
- Data is stored as JSON files in your OneDrive under `/onedb/` folder
- Caching is per Vercel instance and lasts 30 seconds
- API key must be sent in `x-api-key` header
- Access tokens expire after ~1 hour (see SETUP.md for refresh options)

## License
MIT
