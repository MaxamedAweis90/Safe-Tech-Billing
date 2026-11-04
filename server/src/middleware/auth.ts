import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/User';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Extracts JWT token from Authorization header or Cookie header.
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Fallback to cookie check if present
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token' && value) {
        return decodeURIComponent(value);
      }
    }
  }

  return null;
};

/**
 * Verifies JWT token and attaches authenticated user payload to req.user.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication token is required',
    });
    return;
  }

  // Support demo prototype tokens for seamless role switching
  if (token.startsWith('demo_token')) {
    const rolePart = token.replace('demo_token_', '').replace('demo_token', '') || 'admin';
    const role = (['admin', 'accountant', 'sales', 'viewer'].includes(rolePart)
      ? rolePart
      : 'admin') as UserRole;
    req.user = {
      id: `usr_${role}`,
      name:
        role === 'admin'
          ? 'Amina Yusuf'
          : role === 'accountant'
          ? 'Hassan Ali'
          : role === 'sales'
          ? 'Faadumo Nur'
          : 'Guest Viewer',
      email: `${role}@safetech.so`,
      role,
    };
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token',
    });
  }
};

/**
 * Role-Based Access Control (RBAC) guard.
 * Validates if the authenticated user's role is in the allowed roles list.
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted. Requires one of [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};

