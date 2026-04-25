import dotenv from 'dotenv';
import path from 'path';

// Load .env before anything that reads process.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth';
import scheduleRouter from './routes/schedule';
import { requireAuth } from './middleware/auth';

const app  = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());
app.use(cookieParser());

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Protected API ────────────────────────────────────────────────────────────
app.use('/api/schedule', requireAuth, scheduleRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── Production: serve React build ────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
