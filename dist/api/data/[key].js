"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const API_KEY = process.env.API_KEY;
const ONEDRIVE_ACCESS_TOKEN = process.env.ONEDRIVE_ACCESS_TOKEN;
const ONEDRIVE_REFRESH_TOKEN = process.env.ONEDRIVE_REFRESH_TOKEN;
const ONEDRIVE_CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID;
const ONEDRIVE_CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET;
// In-memory cache with LRU-style eviction
const cache = {};
const CACHE_TTL = 30 * 1000; // 30 seconds
const MAX_CACHE_SIZE = 1000;
// Token cache
let tokenCache = null;
const graphClient = axios_1.default.create({
    baseURL: 'https://graph.microsoft.com/v1.0',
    timeout: 10000,
    maxRedirects: 0,
});
const authClient = axios_1.default.create({
    baseURL: 'https://login.microsoftonline.com',
    timeout: 10000,
});
async function getAccessToken() {
    const now = Date.now();
    // Return cached token if still valid (with 5 min buffer)
    if (tokenCache && tokenCache.expires > now + 300000) {
        return tokenCache.token;
    }
    // If we have refresh credentials, get a new token
    if (ONEDRIVE_REFRESH_TOKEN && ONEDRIVE_CLIENT_ID && ONEDRIVE_CLIENT_SECRET) {
        try {
            const res = await authClient.post('/common/oauth2/v2.0/token', new URLSearchParams({
                client_id: ONEDRIVE_CLIENT_ID,
                client_secret: ONEDRIVE_CLIENT_SECRET,
                refresh_token: ONEDRIVE_REFRESH_TOKEN,
                grant_type: 'refresh_token',
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            tokenCache = {
                token: res.data.access_token,
                expires: now + (res.data.expires_in * 1000),
            };
            return res.data.access_token;
        }
        catch (e) {
            console.error('Token refresh failed:', e.response?.data?.error_description || e.message);
            // Fall through to use static token if available
        }
    }
    // Fall back to static token from env
    if (ONEDRIVE_ACCESS_TOKEN) {
        tokenCache = { token: ONEDRIVE_ACCESS_TOKEN, expires: now + 3300000 }; // ~55 min
        return ONEDRIVE_ACCESS_TOKEN;
    }
    throw new Error('No valid access token available');
}
function checkApiKey(req, res, next) {
    if (req.headers['x-api-key'] !== API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
}
function getFromCache(cacheKey) {
    const entry = cache[cacheKey];
    if (entry && entry.expires > Date.now()) {
        return entry.data;
    }
    if (entry) {
        delete cache[cacheKey];
    }
    return null;
}
function setInCache(cacheKey, data) {
    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE_SIZE) {
        const oldestKey = keys.reduce((min, key) => cache[key].expires < cache[min].expires ? key : min, keys[0]);
        delete cache[oldestKey];
    }
    cache[cacheKey] = { data, expires: Date.now() + CACHE_TTL };
}
router.use(checkApiKey);
router.get('/', async (req, res) => {
    const key = req.params.key;
    try {
        const token = await getAccessToken();
        const cacheKey = `default:${key}`;
        const cached = getFromCache(cacheKey);
        if (cached)
            return res.json(cached);
        const fileRes = await graphClient.get(`/me/drive/root:/onedb/${key}.json:/content`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setInCache(cacheKey, fileRes.data);
        res.json(fileRes.data);
    }
    catch (e) {
        res.status(404).json({ error: 'Not found' });
    }
});
router.post('/', async (req, res) => {
    const key = req.params.key;
    try {
        const token = await getAccessToken();
        const cacheKey = `default:${key}`;
        await graphClient.put(`/me/drive/root:/onedb/${key}.json:/content`, req.body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        setInCache(cacheKey, req.body);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.put('/', async (req, res) => {
    const key = req.params.key;
    try {
        const token = await getAccessToken();
        const cacheKey = `default:${key}`;
        await graphClient.put(`/me/drive/root:/onedb/${key}.json:/content`, req.body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        setInCache(cacheKey, req.body);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.delete('/', async (req, res) => {
    const key = req.params.key;
    try {
        const token = await getAccessToken();
        const cacheKey = `default:${key}`;
        await graphClient.delete(`/me/drive/root:/onedb/${key}.json`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        delete cache[cacheKey];
        res.json({ ok: true });
    }
    catch (e) {
        res.status(404).json({ error: 'Not found' });
    }
});
router.post('/batch', async (req, res) => {
    if (!ONEDRIVE_ACCESS_TOKEN && !ONEDRIVE_REFRESH_TOKEN) {
        return res.status(500).json({ error: 'Missing OneDrive token' });
    }
    const operations = req.body.operations;
    if (!Array.isArray(operations))
        return res.status(400).json({ error: 'Missing operations array' });
    try {
        const token = await getAccessToken();
        const batchRequests = operations.map((op, i) => {
            const key = op.key;
            const method = op.method.toUpperCase();
            let url = `/me/drive/root:/onedb/${key}.json:/content`;
            if (method === 'DELETE')
                url = `/me/drive/root:/onedb/${key}.json`;
            return {
                id: String(i),
                method,
                url,
                headers: { 'Content-Type': 'application/json' },
                ...(op.body ? { body: op.body } : {}),
            };
        });
        const batchRes = await graphClient.post('/$batch', { requests: batchRequests }, { headers: { Authorization: `Bearer ${token}` } });
        const now = Date.now();
        batchRes.data.responses.forEach((resp, i) => {
            const op = operations[i];
            const cacheKey = `default:${op.key}`;
            if (['PUT', 'POST'].includes(op.method.toUpperCase()) && resp.status >= 200 && resp.status < 300) {
                setInCache(cacheKey, op.body);
            }
            if (op.method.toUpperCase() === 'DELETE' && resp.status >= 200 && resp.status < 300) {
                delete cache[cacheKey];
            }
        });
        res.json(batchRes.data);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
