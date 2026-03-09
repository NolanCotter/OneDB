# OneDB Setup Guide

## Option 1: Quick Start (No Azure, Manual Refresh)

### Get Your Access Token (3 minutes)

1. **Go to Microsoft Graph Explorer**
   - Visit: https://developer.microsoft.com/en-us/graph/graph-explorer
   - Sign in with your Microsoft account

2. **Grant Permissions**
   - Click your profile → **Consent to permissions**
   - Select: `Files.ReadWrite` and `offline_access`
   - Click **Consent**

3. **Copy Your Token**
   - Click **Access token** tab
   - Click **Copy token**
   - This is your `ONEDRIVE_ACCESS_TOKEN`

4. **Generate API Key**
   ```bash
   openssl rand -hex 32
   ```

5. **Create .env file**
   ```bash
   ONEDRIVE_ACCESS_TOKEN=EwB...your-token...AA
   API_KEY=your-hex-key
   ```

⚠️ **Token expires after ~1 hour** - get a new one from Graph Explorer when needed.

---

## Option 2: Auto-Refresh (Requires Azure, No Manual Refresh)

### Step 1: Register Microsoft App (5 minutes)

1. Go to https://portal.azure.com → Azure Active Directory → App registrations
2. Click **New registration**
   - Name: `OneDB`
   - Supported accounts: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: `http://localhost:3000/api/auth/callback`
3. Copy **Application (client) ID** → `ONEDRIVE_CLIENT_ID`
4. Go to **Certificates & secrets** → **New client secret**
   - Copy the **Value** (not ID) → `ONEDRIVE_CLIENT_SECRET`
5. Go to **API permissions** → Add: `Files.ReadWrite` and `offline_access`

### Step 2: Get Refresh Token (2 minutes)

1. Build this URL (replace YOUR_CLIENT_ID and redirect URI):
   ```
   https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/api/auth/callback&response_mode=query&scope=Files.ReadWrite%20offline_access
   ```

2. Open in browser, sign in, accept permissions

3. You'll be redirected to `http://localhost:3000/api/auth/callback?code=XXX`
   - Copy the `code` parameter

4. Run this command:
   ```bash
   curl -X POST https://login.microsoftonline.com/common/oauth2/v2.0/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=CODE_FROM_URL" \
     -d "redirect_uri=http://localhost:3000/api/auth/callback" \
     -d "grant_type=authorization_code"
   ```

5. Copy the `refresh_token` from the response → `ONEDRIVE_REFRESH_TOKEN`

### Step 3: Create .env file

```bash
ONEDRIVE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONEDRIVE_CLIENT_SECRET=your-secret-value
ONEDRIVE_REFRESH_TOKEN=your-refresh-token
API_KEY=your-hex-key
```

### Step 4: Set Up Auto-Refresh

Run the refresh script every 50 minutes:

**Manual:**
```bash
npm run refresh-token
```

**With cron (Linux/Mac):**
```bash
# Edit crontab
crontab -e

# Add this line (runs every 50 minutes)
*/50 * * * * cd /path/to/onedb && node scripts/refresh-token.js
```

**With Windows Task Scheduler:**
- Create a basic task
- Trigger: Daily, repeat every 50 minutes
- Action: Start a program
  - Program: `node`
  - Arguments: `scripts/refresh-token.js`
  - Start in: `C:\path\to\onedb`

---

## Test Your Setup

```bash
npm install
npm run dev
```

```bash
# Health check
curl http://localhost:3000/api/health

# Store data
curl -X POST http://localhost:3000/api/data/test \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"hello":"world"}'

# Get data
curl http://localhost:3000/api/data/test \
  -H "x-api-key: your-api-key"
```

---

## Deploy to Vercel

1. Push to GitHub
2. Go to https://vercel.com/new
3. Import your repo
4. Add environment variables from your `.env`
5. Deploy!

**For auto-refresh on Vercel:**
- Use GitHub Actions or a cron service to run the refresh script
- Or use Vercel's Cron Jobs (paid feature)

---

## Summary

| Option | Setup Time | Maintenance |
|--------|-----------|-------------|
| Quick Start | 3 min | Manual token refresh every hour |
| Auto-Refresh | 10 min | Set and forget |
