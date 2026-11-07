import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/User';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified?: boolean;
  companyId?: string | null;
  isOwner?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Extracts JWT token from Cookie or Authorization header.
 */
export const extractToken = (req: Request): string | null => {
  // 1. Check cookies (accessToken, registrationToken, or token)
  if (req.cookies) {
    if (req.cookies.accessToken) {
      return req.cookies.accessToken;
    }
    if (req.cookies.registrationToken) {
      return req.cookies.registrationToken;
    }
    if (req.cookies.token) {
      return req.cookies.token;
    }
  }

  // Fallback to checking raw Cookie header in case cookieParser was bypassed
  if (req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    for (const c of rawCookies) {
      const [name, val] = c.trim().split('=');
      if ((name === 'accessToken' || name === 'registrationToken' || name === 'token') && val) {
        return decodeURIComponent(val);
      }
    }
  }

  // 2. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 3. Check X-Registration-Token header
  const regHeader = req.headers['x-registration-token'];
  if (regHeader && typeof regHeader === 'string') {
    return regHeader.trim();
  }

  return null;
};

/**
 * Middleware: authenticate
 * Extracts and verifies access token from cookie or Authorization header.
 * Attaches typed req.user payload.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication token is required',
    });
    return;
  }

  // Support demo prototype tokens for seamless development role switching
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
      isVerified: true,
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
      error: 'Unauthorized: Invalid or expired access token',
    });
  }
};

/**
 * Backward compatibility alias for authenticate
 */
export const authenticateToken = authenticate;

/**
 * Role-Based Access Control (RBAC) guard.
 * Validates if the authenticated user's role is in the allowed roles list.
 */
export const requireRole = (allowedRoles: (UserRole | string)[]) => {
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

/**
 * Middleware: requireVerified
 * Returns 403 Forbidden with code UNVERIFIED_EMAIL if user has not completed verification.
 */
export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required',
    });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      success: false,
      code: 'UNVERIFIED_EMAIL',
      error: 'Forbidden: Email verification required before company ledger setup',
    });
    return;
  }

  next();
};

/**
 * Middleware: requireOwner
 * Returns 403 Forbidden if user is not the company creator / owner.
 */
export const requireOwner = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required',
    });
    return;
  }

  if (!req.user.isOwner && req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Only the workspace owner can perform this administrative action',
    });
    return;
  }

  next();
};

