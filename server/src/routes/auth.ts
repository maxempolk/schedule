import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_TTL  = '15m';
const REFRESH_TTL = '7d';
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function makeAccessToken(): string {
  return jwt.sign({}, process.env.JWT_ACCESS_SECRET!, { expiresIn: ACCESS_TTL });
}

function makeRefreshToken(): string {
  return jwt.sign({}, process.env.JWT_REFRESH_SECRET!, { expiresIn: REFRESH_TTL });
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('rt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_MAX_AGE,
    path: '/api/auth/refresh',
  });
}

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { login, password } = req.body as { login?: string; password?: string };

  if (
    login    !== process.env.ADMIN_LOGIN ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    res.status(401).json({ error: 'Неверный логин или пароль' });
    return;
  }

  setRefreshCookie(res, makeRefreshToken());
  res.json({ accessToken: makeAccessToken() });
});

// POST /api/auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const token = req.cookies?.rt as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }
  try {
    jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    // Rotate: issue a new refresh token on each successful refresh
    setRefreshCookie(res, makeRefreshToken());
    res.json({ accessToken: makeAccessToken() });
  } catch {
    res.status(401).json({ error: 'Refresh token expired' });
  }
});

export default router;
