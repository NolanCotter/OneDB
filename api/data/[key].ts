import express, { Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const API_KEY = process.env.API_KEY;

// In-memory cache with LRU-style eviction
const cache: Record<string, { data: any; expires: number }> = {};
const CACHE_TTL = 30 * 1000; // 30 seconds
const MAX_CACHE_SIZE = 1000;

// Reusable axios instances with optimized config
const graphClient: AxiosInstance = axios.create({
  baseURL: 'https://graph.microsoft.com/v1.0',
  timeout: 10000,
  maxRedirects: 0,
});

function checkApiKey(req: Request, res: Response, next: () => void) {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}

function getAccessToken(req: Request): string | undefined {
  return req.headers['authorization']?.replace('Bearer ', '');
}

function getFromCache(cacheKey: string): any | null {
  const entry = cache[cacheKey];
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  if (entry) {
    delete cache[cacheKey];
  }
  return null;
}

function setInCache(cacheKey: string, data: any): void {
  // Evict oldest if at capacity
  const keys = Object.keys(cache);
  if (keys.length >= MAX_CACHE_SIZE) {
    const oldestKey = keys.reduce((min, key) => 
      cache[key].expires < cache[min].expires ? key : min, keys[0]);
    delete cache[oldestKey];
  }
  cache[cacheKey] = { data, expires: Date.now() + CACHE_TTL };
}

router.use(checkApiKey);

router.get('/', async (req: Request, res: Response) => {
  const key = req.params.key;
  const accessToken = getAccessToken(req);
  if (!accessToken) return res.status(401).json({ error: 'Missing access token' });
  
  const cacheKey = `${accessToken}:${key}`;
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);
  
  try {
    const fileRes = await graphClient.get(`/me/drive/root:/onedb/${key}.json:/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setInCache(cacheKey, fileRes.data);
    res.json(fileRes.data);
  } catch (e: any) {
    res.status(404).json({ error: 'Not found' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const key = req.params.key;
  const accessToken = getAccessToken(req);
  if (!accessToken) return res.status(401).json({ error: 'Missing access token' });
  
  const cacheKey = `${accessToken}:${key}`;
  try {
    await graphClient.put(`/me/drive/root:/onedb/${key}.json:/content`, req.body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    setInCache(cacheKey, req.body);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/', async (req: Request, res: Response) => {
  const key = req.params.key;
  const accessToken = getAccessToken(req);
  if (!accessToken) return res.status(401).json({ error: 'Missing access token' });
  
  const cacheKey = `${accessToken}:${key}`;
  try {
    await graphClient.put(`/me/drive/root:/onedb/${key}.json:/content`, req.body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    setInCache(cacheKey, req.body);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/', async (req: Request, res: Response) => {
  const key = req.params.key;
  const accessToken = getAccessToken(req);
  if (!accessToken) return res.status(401).json({ error: 'Missing access token' });
  
  const cacheKey = `${accessToken}:${key}`;
  try {
    await graphClient.delete(`/me/drive/root:/onedb/${key}.json`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    delete cache[cacheKey];
    res.json({ ok: true });
  } catch (e: any) {
    res.status(404).json({ error: 'Not found' });
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  const accessToken = getAccessToken(req);
  if (!accessToken) return res.status(401).json({ error: 'Missing access token' });
  const operations = req.body.operations;
  if (!Array.isArray(operations)) return res.status(400).json({ error: 'Missing operations array' });

  const batchRequests = operations.map((op: any, i: number) => {
    const key = op.key;
    const method = op.method.toUpperCase();
    let url = `/me/drive/root:/onedb/${key}.json:/content`;
    if (method === 'DELETE') url = `/me/drive/root:/onedb/${key}.json`;
    return {
      id: String(i),
      method,
      url,
      headers: { 'Content-Type': 'application/json' },
      ...(op.body ? { body: op.body } : {}),
    };
  });

  try {
    const batchRes = await graphClient.post(
      '/$batch',
      { requests: batchRequests },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const now = Date.now();
    batchRes.data.responses.forEach((resp: any, i: number) => {
      const op = operations[i];
      const cacheKey = `${accessToken}:${op.key}`;
      if (['PUT', 'POST'].includes(op.method.toUpperCase()) && resp.status >= 200 && resp.status < 300) {
        setInCache(cacheKey, op.body);
      }
      if (op.method.toUpperCase() === 'DELETE' && resp.status >= 200 && resp.status < 300) {
        delete cache[cacheKey];
      }
    });
    res.json(batchRes.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
