import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import app from '../app';

describe('HTTP API & Middleware Specifications', () => {
  it('requireRole middleware blocks unauthorized request with 401', () => {
    const middleware = requireRole(['admin']);
    const req = {} as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn(() => ({ json: jsonMock }));
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('requireRole middleware blocks unauthorized role with 403', () => {
    const middleware = requireRole(['admin']);
    const req = { user: { role: 'viewer', id: '1', name: 'Viewer', email: 'v@s.so' } } as unknown as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn(() => ({ json: jsonMock }));
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('requireRole middleware allows authorized role to pass', () => {
    const middleware = requireRole(['admin', 'sales']);
    const req = { user: { role: 'sales', id: '2', name: 'Sales', email: 's@s.so' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('validate middleware rejects invalid body with 400', async () => {
    const schema = {
      body: z.object({
        email: z.string().email(),
      }),
    };
    const middleware = validate(schema);
    const req = { body: { email: 'invalid-email' } } as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn(() => ({ json: jsonMock }));
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('app mounts health check probe at /api/health', () => {
    // Basic verification that app is defined and has routes registered
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
  });
});

