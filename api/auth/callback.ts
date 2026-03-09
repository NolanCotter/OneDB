import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(400).json({ error: 'OAuth not configured. Use ONEDRIVE_ACCESS_TOKEN instead.' });
});

export default router;
