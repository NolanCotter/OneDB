import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET;
const REDIRECT_URI = process.env.ONEDRIVE_REDIRECT_URI;

router.get('/', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send('Missing code');
  
  try {
    const tokenRes = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      code,
      redirect_uri: REDIRECT_URI!,
      grant_type: 'authorization_code',
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    // Return the refresh token for storage
    res.json({
      access_token: tokenRes.data.access_token,
      refresh_token: tokenRes.data.refresh_token,
      expires_in: tokenRes.data.expires_in,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.response?.data?.error?.message || e.message });
  }
});

export default router;
