import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { getTrash, restoreTrashItem, purgeTrashItem, emptyAllTrash } from '../controllers/trashController';
import { deleteQuotation } from '../controllers/quotationController';
import { deleteInvoiceHandler } from '../controllers/invoiceController';
import { removeCustomer } from '../controllers/customerController';
import { removeReceipt } from '../controllers/paymentController';
import { Quotation } from '../models/Quotation';
import { Invoice } from '../models/Invoice';
import { Customer } from '../models/Customer';
import { Receipt } from '../models/Receipt';
import { Payment } from '../models/Payment';
import * as trashService from '../services/trashService';
import * as auditService from '../services/auditService';

const createMockReqRes = (overrides: {
  body?: any;
  params?: any;
  query?: any;
  user?: any;
} = {}) => {
  const req = {
    body: overrides.body || {},
    params: overrides.params || {},
    query: overrides.query || {},
    user: overrides.user,
  } as unknown as Request;

  const jsonMock = vi.fn();
  const statusMock = vi.fn((_code: number) => ({ json: jsonMock }));

  const res = {
    status: statusMock,
    json: jsonMock,
  } as unknown as Response;

  const next = vi.fn();

  return { req, res, statusMock, jsonMock, next };
};

describe('Trash System & Multi-Tenant Isolation Specifications', () => {
  const companyAId = new Types.ObjectId('65f1a2b3c4d5e6f7a8b9c001');
  const companyBId = new Types.ObjectId('65f1a2b3c4d5e6f7a8b9c002');

  const adminA = {
    id: 'user_a_admin',
    _id: new Types.ObjectId('65f1a2b3c4d5e6f7a8b9c011'),
    name: 'Admin Company A',
    email: 'admin@comp-a.com',
    role: 'admin',
    companyId: companyAId.toString(),
  };

  const adminB = {
    id: 'user_b_admin',
    _id: new Types.ObjectId('65f1a2b3c4d5e6f7a8b9c012'),
    name: 'Admin Company B',
    email: 'admin@comp-b.com',
    role: 'admin',
    companyId: companyBId.toString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists trashed items partitioned strictly by companyId', async () => {
    const listSpy = vi.spyOn(trashService, 'listTrash').mockResolvedValueOnce({
      items: [
        {
          id: 'quote_1',
          type: 'quotation',
          numberOrCode: 'QT-1001',
          nameOrTitle: 'Client A',
          deletedAt: new Date(),
        },
      ],
      counts: { all: 1, quotation: 1, invoice: 0, receipt: 0, customer: 0 },
      total: 1,
    });

    const { req, res, statusMock, jsonMock } = createMockReqRes({
      user: adminA,
      query: { type: 'all' },
    });

    await getTrash(req, res, vi.fn());

    expect(listSpy).toHaveBeenCalledWith(adminA.companyId, expect.objectContaining({ type: 'all' }));
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 1,
        counts: expect.objectContaining({ quotation: 1 }),
      })
    );
  });

  it('restores trashed item and records audit log for company', async () => {
    const restoreSpy = vi.spyOn(trashService, 'restoreItem').mockResolvedValueOnce({
      success: true,
      ref: 'QT-1001',
      detail: 'Restored quotation QT-1001',
    });
    const logSpy = vi.spyOn(auditService, 'logAction').mockResolvedValueOnce({} as any);

    const { req, res, statusMock, jsonMock } = createMockReqRes({
      user: adminA,
      params: { type: 'quotation', id: new Types.ObjectId().toString() },
    });

    await restoreTrashItem(req, res, vi.fn());

    expect(restoreSpy).toHaveBeenCalledWith('quotation', req.params.id, adminA.companyId);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: adminA.companyId,
        action: 'Restored quotation from trash',
        ref: 'QT-1001',
      })
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it('purges trashed item permanently and records audit log for company', async () => {
    const purgeSpy = vi.spyOn(trashService, 'purgeItem').mockResolvedValueOnce({
      success: true,
      ref: 'QT-1001',
      detail: 'Permanently deleted quotation QT-1001',
    });
    const logSpy = vi.spyOn(auditService, 'logAction').mockResolvedValueOnce({} as any);

    const { req, res, statusMock, jsonMock } = createMockReqRes({
      user: adminA,
      params: { type: 'quotation', id: new Types.ObjectId().toString() },
    });

    await purgeTrashItem(req, res, vi.fn());

    expect(purgeSpy).toHaveBeenCalledWith('quotation', req.params.id, adminA.companyId);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: adminA.companyId,
        action: 'Permanently purged quotation',
        ref: 'QT-1001',
      })
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it('empties all trash for company and records audit log', async () => {
    const emptySpy = vi.spyOn(trashService, 'emptyTrash').mockResolvedValueOnce({ count: 5 });
    const logSpy = vi.spyOn(auditService, 'logAction').mockResolvedValueOnce({} as any);

    const { req, res, statusMock, jsonMock } = createMockReqRes({
      user: adminA,
    });

    await emptyAllTrash(req, res, vi.fn());

    expect(emptySpy).toHaveBeenCalledWith(adminA.companyId);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: adminA.companyId,
        action: 'Emptied trash',
        ref: '5 items',
      })
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 5 })
    );
  });

  it('does not allow cross-tenant restore or purge', async () => {
    vi.spyOn(trashService, 'restoreItem').mockRejectedValueOnce(
      new Error('Quotation not found in trash')
    );

    const { req, res, statusMock, jsonMock } = createMockReqRes({
      user: adminB, // Company B attempting to restore item
      params: { type: 'quotation', id: new Types.ObjectId().toString() },
    });

    await restoreTrashItem(req, res, vi.fn());

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Quotation not found in trash' })
    );
  });
});

