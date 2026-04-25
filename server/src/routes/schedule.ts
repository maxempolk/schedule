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

// PATCH /api/schedule/bulk — обновить h/m/dur нескольких событий
router.patch('/bulk', (req, res) => {
  const updates = req.body as Array<{ id: number; h: number; m: number; dur: number }>;
  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400).json({ error: 'Expected non-empty array' });
    return;
  }
  const stmt = db.prepare('UPDATE events SET h=@h, m=@m, dur=@dur WHERE id=@id');
  const runAll = db.transaction((rows: typeof updates) => { for (const r of rows) stmt.run(r); });
  runAll(updates);
  res.json({ ok: true });
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
