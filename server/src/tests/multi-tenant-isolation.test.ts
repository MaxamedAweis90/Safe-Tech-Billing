import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { listAuditLogs } from '../controllers/auditController';
import { getSummary } from '../controllers/reportController';
import { getDashboardSummary } from '../controllers/dashboardController';
import { getInvoice, updateInvoice } from '../controllers/invoiceController';
import { getQuotation, updateQuotation } from '../controllers/quotationController';
import { getReceipt, listReceipts } from '../controllers/paymentController';
import { getCustomer, getCustomers } from '../controllers/customerController';
import { AuditLog } from '../models/AuditLog';
import { Invoice } from '../models/Invoice';
import { Quotation } from '../models/Quotation';
import { Receipt } from '../models/Receipt';
import { Customer } from '../models/Customer';
import { Payment } from '../models/Payment';
import { CreditNote } from '../models/CreditNote';
import { getNextNumber } from '../services/numberingService';
import { NumberSequence } from '../models/NumberSequence';

const createMockReqRes = (overrides: {
  body?: any;
  params?: any;
  query?: any;
  cookies?: any;
  headers?: any;
  user?: any;
} = {}) => {
  const req = {
    body: overrides.body || {},
    params: overrides.params || {},
    query: overrides.query || {},
    cookies: overrides.cookies || {},
    headers: overrides.headers || {},
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

describe('Multi-Tenant Data Isolation & Cross-Company Leak Prevention', () => {
  const companyAId = new Types.ObjectId('65f1a2b3c4d5e6f7a8b9c001');
  const companyBId = new Types.ObjectId('65f1a2b3c4d5e6f7a8b9c002');

  const userCompanyA = {
    id: 'user_a_1',
    name: 'Admin Company A',
    email: 'admin@company-a.com',
    role: 'admin',
    companyId: companyAId.toString(),
  };

  const userCompanyB = {
    id: 'user_b_1',
    name: 'Admin Company B',
    email: 'admin@company-b.com',
    role: 'admin',
    companyId: companyBId.toString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Audit Trail Isolation', () => {
    it('restricts audit log queries strictly to the requesting companyId', async () => {
      let capturedFilter: any = null;

      vi.spyOn(AuditLog, 'find').mockImplementation((filter: any) => {
        capturedFilter = filter;
        return {
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  _id: new Types.ObjectId(),
                  companyId: companyAId,
                  action: 'Created customer',
                  user_name: 'Admin Company A',
                },
              ]),
            }),
          }),
        } as any;
      });

      vi.spyOn(AuditLog, 'countDocuments').mockResolvedValue(1);

      const { req, res, statusMock, jsonMock, next } = createMockReqRes({
        user: userCompanyA,
      });

      await listAuditLogs(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(capturedFilter).toBeDefined();
      expect(capturedFilter.companyId).toBe(userCompanyA.companyId);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          total: 1,
        })
      );
    });

    it('returns empty audit log list without leaking if user has no assigned company and is not demo', async () => {
      const { req, res, statusMock, jsonMock, next } = createMockReqRes({
        user: { id: 'unassigned_1', role: 'admin' },
      });

      await listAuditLogs(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        logs: [],
        total: 0,
        limit: 50,
        skip: 0,
      });
    });
  });

  describe('2. Financial Reports Isolation', () => {
    it('scopes report summary metrics strictly to the requesting companyId', async () => {
      let capturedCompanyFilter: any = null;

      vi.spyOn(Invoice, 'find').mockImplementation((filter: any) => {
        capturedCompanyFilter = filter.companyId;
        return Promise.resolve([]) as any;
      });

      vi.spyOn(Payment, 'find').mockResolvedValue([] as any);
      vi.spyOn(CreditNote, 'find').mockResolvedValue([] as any);
      vi.spyOn(Quotation, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(Customer, 'countDocuments').mockResolvedValue(0);

      const { req, res, statusMock, jsonMock, next } = createMockReqRes({
        user: userCompanyA,
      });

      await getSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(capturedCompanyFilter).toBe(userCompanyA.companyId);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          summary: expect.any(Object),
        })
      );
    });
  });

  describe('3. Dashboard Isolation', () => {
    it('enforces companyId scoping on dashboard metrics query', async () => {
      let capturedFilter: any = null;

      vi.spyOn(Invoice, 'find').mockImplementation((filter: any) => {
        capturedFilter = filter;
        return {
          populate: vi.fn().mockResolvedValue([]),
        } as any;
      });

      vi.spyOn(Quotation, 'find').mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      } as any);

      vi.spyOn(Payment, 'find').mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      } as any);

      vi.spyOn(Customer, 'find').mockResolvedValue([] as any);

      const { req, res, statusMock, next } = createMockReqRes({
        user: userCompanyA,
      });

      await getDashboardSummary(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(capturedFilter).toBeDefined();
      expect(capturedFilter.companyId).toBe(userCompanyA.companyId);
    });
  });

  describe('4. IDOR Protection (Single Document Access)', () => {
    it('blocks Company A from viewing an Invoice belonging to Company B (returns 404)', async () => {
      const invoiceOfCompanyBId = new Types.ObjectId().toString();

      let queryFilter: any = null;
      vi.spyOn(Invoice, 'findOne').mockImplementation((filter: any) => {
        queryFilter = filter;
        return {
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(null),
          }),
        } as any;
      });

      const { req, res, statusMock, jsonMock, next } = createMockReqRes({
        params: { id: invoiceOfCompanyBId },
        user: userCompanyA,
      });

      await getInvoice(req, res, next);

      expect(queryFilter).toBeDefined();
      expect(queryFilter.companyId).toBe(userCompanyA.companyId);
      expect(queryFilter._id).toBe(invoiceOfCompanyBId);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invoice not found' }));
    });

    it('blocks Company A from updating an Invoice belonging to Company B (returns 404)', async () => {
      const invoiceOfCompanyBId = new Types.ObjectId().toString();

      vi.spyOn(Invoice, 'findOne').mockResolvedValue(null);

      const { req, res, statusMock, jsonMock, next } = createMockReqRes({
        params: { id: invoiceOfCompanyBId },
        body: { notes: 'Malicious modification attempt' },
        user: userCompanyA,
      });

      await updateInvoice(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invoice not found' }));
    });

    it('blocks Company A from viewing a Quotation belonging to Company B (returns 404)', async () => {
      const quoteOfCompanyBId = new Types.ObjectId().toString();

      let queryFilter: any = null;
      vi.spyOn(Quotation, 'findOne').mockImplementation((filter: any) => {
        queryFilter = filter;
        return {
          populate: vi.fn().mockResolvedValue(null),
        } as any;
      });

      const { req, res, statusMock, jsonMock, next } = createMockReqRes({
        params: { id: quoteOfCompanyBId },
        user: userCompanyA,
      });

      await getQuotation(req, res, next);

      expect(queryFilter).toBeDefined();
      expect(queryFilter.companyId).toBe(userCompanyA.companyId);
      expect(queryFilter._id).toBe(quoteOfCompanyBId);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: 'Quotation not found' }));
    });

    it('blocks Company A from viewing a Receipt belonging to Company B (returns 404)', async () => {
      const receiptOfCompanyBId = new Types.ObjectId().toString();

      let queryFilter: any = null;
      vi.spyOn(Receipt, 'findOne').mockImplementation((filter: any) => {
        queryFilter = filter;
        return {
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(null),
            }),
          }),
        } as any;
      });

      const { req, res, statusMock, jsonMock, next } = createMockReqRes({
        params: { id: receiptOfCompanyBId },
        user: userCompanyA,
      });

      await getReceipt(req, res, next);

      expect(queryFilter).toBeDefined();
      expect(queryFilter.companyId).toBe(userCompanyA.companyId);
      expect(queryFilter._id).toBe(receiptOfCompanyBId);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: 'Receipt not found' }));
    });

    it('blocks Company A from listing Receipts of Company B', async () => {
      let capturedFilter: any = null;

      vi.spyOn(Receipt, 'find').mockImplementation((filter: any) => {
        capturedFilter = filter;
        return {
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              sort: vi.fn().mockReturnValue({
                skip: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        } as any;
      });

      vi.spyOn(Receipt, 'countDocuments').mockResolvedValue(0);

      const { req, res, statusMock, next } = createMockReqRes({
        user: userCompanyA,
      });

      await listReceipts(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(capturedFilter.companyId).toBe(userCompanyA.companyId);
    });
  });

  describe('5. Sequence Partitioning Independence', () => {
    it('partitions sequence counters by companyId allowing identical sequences per company', async () => {
      let findOneAndUpdateFilter: any = null;

      vi.spyOn(NumberSequence, 'findOneAndUpdate').mockImplementation((filter: any) => {
        findOneAndUpdateFilter = filter;
        return Promise.resolve({
          kind: 'invoice',
          format: '{SEQ}',
          current_seq: 100,
        }) as any;
      });

      const nextNum = await getNextNumber('invoice', undefined, companyAId);

      expect(nextNum).toBe('100');
      expect(findOneAndUpdateFilter).toBeDefined();
      expect(findOneAndUpdateFilter.companyId).toEqual(companyAId);
      expect(findOneAndUpdateFilter.kind).toBe('invoice');
    });
  });
});
