import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID;
const REDIRECT_URI = process.env.ONEDRIVE_REDIRECT_URI;

router.post('/', (_req: Request, res: Response) => {
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI!)}&response_mode=query&scope=Files.ReadWrite offline_access`;
  res.json({ url: authUrl });
});

export default router;
