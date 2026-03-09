import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'OneDB API is running' });
});

export default router;
