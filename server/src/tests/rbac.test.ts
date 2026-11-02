import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../middleware/auth';
import { Request, Response } from 'express';
import { UserRole } from '../models/User';

describe('Role-Based Access Control (RBAC) Specifications — rbac.test.ts', () => {
  const createMockReqRes = (role?: UserRole) => {
    const req = {
      user: role ? { id: 'u1', name: 'Test User', email: 'user@safetech.so', role } : undefined,
    } as unknown as Request;

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as unknown as Response;
    const next = vi.fn();

    return { req, res, status, json, next };
  };

  describe('Unauthenticated Access Guards', () => {
    it('returns 401 when no authenticated user is present', () => {
      const guard = requireRole(['admin', 'accountant', 'sales', 'viewer']);
      const { req, res, status, next } = createMockReqRes();

      guard(req, res, next);
      expect(status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Sales Officer Role Constraints', () => {
    const salesGuard = requireRole(['admin', 'sales']);
    const paymentGuard = requireRole(['admin', 'accountant']);

    it('allows Sales Officer to access quotations and customers', () => {
      const { req, res, next } = createMockReqRes('sales');
      salesGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('strictly forbids Sales Officer from accessing payment endpoints (403)', () => {
      const { req, res, status, next } = createMockReqRes('sales');
      paymentGuard(req, res, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('strictly forbids Sales Officer from accessing credit note endpoints (403)', () => {
      const creditNoteGuard = requireRole(['admin', 'accountant']);
      const { req, res, status, next } = createMockReqRes('sales');
      creditNoteGuard(req, res, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Accountant Role Constraints', () => {
    const accountantGuard = requireRole(['admin', 'accountant']);
    const settingsGuard = requireRole(['admin']);
    const auditGuard = requireRole(['admin']);

    it('allows Accountant to access invoices, payments, and receipts', () => {
      const { req, res, next } = createMockReqRes('accountant');
      accountantGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('strictly forbids Accountant from modifying settings (403)', () => {
      const { req, res, status, next } = createMockReqRes('accountant');
      settingsGuard(req, res, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('strictly forbids Accountant from viewing audit logs (403)', () => {
      const { req, res, status, next } = createMockReqRes('accountant');
      auditGuard(req, res, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Viewer Role Constraints', () => {
    const readGuard = requireRole(['admin', 'accountant', 'sales', 'viewer']);
    const writeGuard = requireRole(['admin', 'sales']);

    it('allows Viewer to access global read-only endpoints', () => {
      const { req, res, next } = createMockReqRes('viewer');
      readGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('strictly forbids Viewer from write operations (403)', () => {
      const { req, res, status, next } = createMockReqRes('viewer');
      writeGuard(req, res, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Administrator Role Omnipotence', () => {
    it('grants full access across all domain action guards', () => {
      const guards = [
        requireRole(['admin']),
        requireRole(['admin', 'accountant']),
        requireRole(['admin', 'sales']),
        requireRole(['admin', 'accountant', 'sales', 'viewer']),
      ];

      for (const guard of guards) {
        const { req, res, next } = createMockReqRes('admin');
        guard(req, res, next);
        expect(next).toHaveBeenCalled();
      }
    });
  });
});

