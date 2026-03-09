import express from 'express';
import authRouter from './auth';
import authCallbackRouter from './auth/callback';
import dataRouter from './data/[key]';

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/auth/callback', authCallbackRouter);
app.use('/api/data/:key', dataRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
