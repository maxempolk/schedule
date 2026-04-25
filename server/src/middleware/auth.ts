import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    jwt.verify(header.slice(7), process.env.JWT_ACCESS_SECRET!);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
}
