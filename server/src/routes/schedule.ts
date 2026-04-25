import { Router } from 'express';
import db from '../db';

export interface DbEvent {
  id: number;
  day: number;
  h: number;
  m: number;
  dur: number;
  label: string;
  type: string;
}

const router = Router();

// GET /api/schedule — все дни сгруппированные по day
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM events ORDER BY day, h, m').all() as DbEvent[];
  const grouped: Record<number, DbEvent[]> = {};
  for (const row of rows) {
    if (!grouped[row.day]) grouped[row.day] = [];
    grouped[row.day].push(row);
  }
  res.json(grouped);
});

// GET /api/schedule/:day — события конкретного дня (0–6)
router.get('/:day', (req, res) => {
  const day = Number(req.params.day);
  if (!Number.isInteger(day) || day < 0 || day > 6) {
    res.status(400).json({ error: 'day must be 0–6' });
    return;
  }
  const rows = db.prepare('SELECT * FROM events WHERE day = ? ORDER BY h, m').all(day) as DbEvent[];
  res.json(rows);
});

export default router;
