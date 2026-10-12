import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'lfg_legend_flow_global_secret_key_2026_secure';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'member' | 'admin';
  sponsorId?: string;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      sponsorId: user.sponsorId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthUser;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}
