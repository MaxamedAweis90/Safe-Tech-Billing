import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import {
  getCompany,
  updateCompany,
  onboardCompany,
  resetSampleData,
} from '../controllers/settingsController';
import { Company } from '../models/Company';
import { User } from '../models/user.model';

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

describe('Company Settings Multi-Tenancy & Data Isolation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /settings/company returns the authenticated tenant company by companyId', async () => {
    const mockCompany = {
      _id: '65f1a2b3c4d5e6f7a8b9c0d1',
      name: 'Horseed Telecommunications',
      email: 'admin@horseed.so',
      address: 'Mogadishu, Somalia',
      phone: '+252615000000',
    };

    vi.spyOn(Company, 'findById').mockResolvedValue(mockCompany as any);

    const { req, res, statusMock, jsonMock, next } = createMockReqRes({
      user: {
        id: '65f1a2b3c4d5e6f7a8b9c0a1',
        name: 'Ahmed Nor',
        email: 'ahmed@horseed.so',
        role: 'admin',
        companyId: '65f1a2b3c4d5e6f7a8b9c0d1',
      },
    });

    await getCompany(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      company: mockCompany,
    });
    expect(Company.findById).toHaveBeenCalledWith('65f1a2b3c4d5e6f7a8b9c0d1');
  });

  it('GET /settings/company looks up company by ownerId if companyId is missing from user payload', async () => {
    const mockCompany = {
      _id: '65f1a2b3c4d5e6f7a8b9c0d2',
      name: 'Banaadir Logistics',
      email: 'owner@banaadir.so',
      ownerId: '65f1a2b3c4d5e6f7a8b9c0a2',
    };

    vi.spyOn(Company, 'findById').mockResolvedValue(null);
    vi.spyOn(Company, 'findOne').mockResolvedValue(mockCompany as any);
    vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({} as any);

    const { req, res, statusMock, jsonMock, next } = createMockReqRes({
      user: {
        id: '65f1a2b3c4d5e6f7a8b9c0a2',
        name: 'Khadar Jama',
        email: 'khadar@banaadir.so',
        role: 'admin',
      },
    });

    await getCompany(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      company: mockCompany,
    });
    expect(Company.findOne).toHaveBeenCalledWith({ ownerId: '65f1a2b3c4d5e6f7a8b9c0a2' });
  });

  it('GET /settings/company returns null for real users who have not yet configured a company (no leak of demo company)', async () => {
    vi.spyOn(Company, 'findById').mockResolvedValue(null);
    vi.spyOn(Company, 'findOne').mockResolvedValue(null);

    const { req, res, statusMock, jsonMock, next } = createMockReqRes({
      user: {
        id: '65f1a2b3c4d5e6f7a8b9c0a3',
        name: 'New Real User',
        email: 'newuser@freshbusiness.com',
        role: 'admin',
      },
    });

    await getCompany(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      company: null,
    });
  });

  it('GET /settings/company returns demo company for demo@account.com', async () => {
    const demoCompany = {
      _id: '65f1a2b3c4d5e6f7a8b9c0d9',
      name: 'Safe Tech Solutions',
      email: 'billing@safetech.so',
    };

    vi.spyOn(Company, 'findById').mockResolvedValue(null);
    vi.spyOn(Company, 'findOne').mockResolvedValue(demoCompany as any);

    const { req, res, statusMock, jsonMock, next } = createMockReqRes({
      user: {
        id: 'usr_demo_admin',
        name: 'Demo Admin',
        email: 'demo@account.com',
        role: 'admin',
      },
    });

    await getCompany(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      company: demoCompany,
    });
  });

  it('PUT /settings/company updates only the authenticated tenant company without modifying ownerId', async () => {
    const existingCompany = {
      _id: '65f1a2b3c4d5e6f7a8b9c0d1',
      name: 'Old Company Name',
      tagline: 'Old Tagline',
      ownerId: '65f1a2b3c4d5e6f7a8b9c0a1',
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    vi.spyOn(Company, 'findById').mockResolvedValue(existingCompany as any);

    const { req, res, statusMock, jsonMock, next } = createMockReqRes({
      user: {
        id: '65f1a2b3c4d5e6f7a8b9c0a1',
        name: 'Ahmed Nor',
        email: 'ahmed@horseed.so',
        role: 'admin',
        companyId: '65f1a2b3c4d5e6f7a8b9c0d1',
      },
      body: {
        name: 'Updated Horseed Telecom',
        tagline: 'Connecting the Horn of Africa',
        ownerId: 'hacker_stolen_id', // Should be stripped/ignored
      },
    });

    await updateCompany(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(existingCompany.name).toBe('Updated Horseed Telecom');
    expect(existingCompany.tagline).toBe('Connecting the Horn of Africa');
    expect(existingCompany.ownerId).toBe('65f1a2b3c4d5e6f7a8b9c0a1');
    expect(existingCompany.save).toHaveBeenCalled();
  });

  it('POST /settings/reset-sample-data forbids execution for non-demo user accounts', async () => {
    const { req, res, statusMock, jsonMock, next } = createMockReqRes({
      user: {
        id: '65f1a2b3c4d5e6f7a8b9c0a1',
        name: 'Real Admin',
        email: 'realadmin@mybusiness.com',
        role: 'admin',
      },
    });

    await resetSampleData(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('restricted to the demo environment'),
      })
    );
  });
});

