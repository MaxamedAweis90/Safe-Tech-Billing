import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  getMembers,
  inviteMember,
  getInvitations,
  revokeInvitation,
  getInvitationByToken,
  acceptInvitation,
  updateMemberRole,
} from '../controllers/team.controller';
import {
  listTeamMembers,
  createInvitation,
  listInvitations,
  revokeInvitation as revokeInvitationService,
  getInvitationByToken as getInvitationService,
  acceptInvitation as acceptInvitationService,
} from '../services/team.service';
import { User, TeamInvitation } from '../models';
import * as commService from '../services/communication.service';
import { requireRole } from '../middleware/auth.middleware';

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

  const cookieMock = vi.fn();
  const clearCookieMock = vi.fn();
  const jsonMock = vi.fn();
  const statusMock = vi.fn((_code: number) => ({ json: jsonMock }));

  const res = {
    status: statusMock,
    json: jsonMock,
    cookie: cookieMock,
    clearCookie: clearCookieMock,
  } as unknown as Response;

  const next = vi.fn();

  return { req, res, statusMock, jsonMock, cookieMock, clearCookieMock, next };
};

describe('Team Invitation & Role-Based Onboarding — Step 3 Specifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('RBAC Guards on /api/v1/team Endpoints', () => {
    it('strictly forbids non-admin users (sales / accountant) from team management endpoints', () => {
      const adminGuard = requireRole(['admin']);

      const { req: reqSales, res: resSales, statusMock: statusSales, next: nextSales } =
        createMockReqRes({
          user: { id: 'u_sales', name: 'Sales Officer', email: 'sales@safetech.so', role: 'sales' },
        });

      adminGuard(reqSales, resSales, nextSales);
      expect(statusSales).toHaveBeenCalledWith(403);
      expect(nextSales).not.toHaveBeenCalled();

      const { req: reqAcct, res: resAcct, statusMock: statusAcct, next: nextAcct } =
        createMockReqRes({
          user: { id: 'u_acct', name: 'Accountant', email: 'acct@safetech.so', role: 'accountant' },
        });

      adminGuard(reqAcct, resAcct, nextAcct);
      expect(statusAcct).toHaveBeenCalledWith(403);
      expect(nextAcct).not.toHaveBeenCalled();
    });

    it('grants full access to admin users', () => {
      const adminGuard = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        user: { id: 'u_admin', name: 'Administrator', email: 'admin@safetech.so', role: 'admin' },
      });

      adminGuard(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/team/invite', () => {
    it('strictly rejects any attempt to invite an admin role with 400 Bad Request', async () => {
      const { req, res, statusMock, jsonMock } = createMockReqRes({
        user: { id: 'admin1', name: 'Admin', role: 'admin' },
        body: {
          email: 'newadmin@safetech.so',
          role: 'admin',
        },
      });

      await inviteMember(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Admin role cannot be invited'),
        })
      );
    });

    it('rejects invitation if email belongs to an existing user with 409 Conflict', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({
        email: 'existing@safetech.so',
      } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        user: { id: 'admin1', name: 'Admin', role: 'admin' },
        body: {
          email: 'existing@safetech.so',
          role: 'accountant',
        },
      });

      await inviteMember(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'A user with this email already exists',
        })
      );
    });

    it('successfully issues invitation, creates token with 7d TTL, and dispatches email', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      vi.spyOn(TeamInvitation, 'deleteMany').mockResolvedValue({} as any);

      const fakeInvitation = {
        _id: 'inv_123',
        email: 'fadumo.accountant@safetech.so',
        role: 'accountant',
        token: 'a'.repeat(64),
        invitedBy: new mongoose.Types.ObjectId(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      vi.spyOn(TeamInvitation, 'create').mockResolvedValue(fakeInvitation as any);
      const emailSpy = vi.spyOn(commService, 'sendTemplatedEmail').mockResolvedValue({
        success: true,
      });

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        user: { id: '507f191e810c19729de86001', name: 'Master Admin', role: 'admin' },
        body: {
          email: 'fadumo.accountant@safetech.so',
          role: 'accountant',
          fullName: 'Fadumo Nuur',
        },
      });

      await inviteMember(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          email: 'fadumo.accountant@safetech.so',
          role: 'accountant',
        })
      );
      expect(emailSpy).toHaveBeenCalledWith(
        'staff_invite',
        'fadumo.accountant@safetech.so',
        expect.objectContaining({
          role_name: 'accountant',
          company_name: 'Safe Tech Solutions',
        })
      );
    });
  });

  describe('GET /api/v1/team/members & invitations', () => {
    it('returns team members list excluding password_hash', async () => {
      const mockUsers = [
        {
          _id: new mongoose.Types.ObjectId(),
          fullName: 'Mohamed Aweys',
          email: 'admin@safetech.so',
          phone: '+252614324507',
          role: 'admin',
          status: 'active',
          isVerified: true,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
      ];

      vi.spyOn(User, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockUsers),
        }),
      } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        user: { id: 'admin1', role: 'admin' },
      });

      await getMembers(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          members: expect.arrayContaining([
            expect.objectContaining({
              fullName: 'Mohamed Aweys',
              email: 'admin@safetech.so',
              role: 'admin',
            }),
          ]),
        })
      );
    });

    it('returns invitations list with active and expired statuses', async () => {
      const mockInvs = [
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'pending@safetech.so',
          role: 'sales',
          expiresAt: new Date(Date.now() + 500000),
          createdAt: new Date(),
          acceptedAt: null,
          invitedBy: { fullName: 'Admin' },
        },
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'expired@safetech.so',
          role: 'accountant',
          expiresAt: new Date(Date.now() - 500000),
          createdAt: new Date(),
          acceptedAt: null,
          invitedBy: { fullName: 'Admin' },
        },
      ];

      vi.spyOn(TeamInvitation, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockInvs),
        }),
      } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        user: { id: 'admin1', role: 'admin' },
      });

      await getInvitations(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          invitations: expect.arrayContaining([
            expect.objectContaining({ email: 'pending@safetech.so', status: 'pending' }),
            expect.objectContaining({ email: 'expired@safetech.so', status: 'expired' }),
          ]),
        })
      );
    });
  });

  describe('DELETE /api/v1/team/invitations/:id', () => {
    it('revokes an unaccepted invitation', async () => {
      const invId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(TeamInvitation, 'findById').mockResolvedValue({
        _id: invId,
        email: 'revoke.me@safetech.so',
        role: 'sales',
        acceptedAt: null,
      } as any);
      vi.spyOn(TeamInvitation, 'deleteOne').mockResolvedValue({} as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        params: { id: invId },
        user: { id: 'admin1', name: 'Admin', role: 'admin' },
      });

      await revokeInvitation(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Invitation revoked',
        })
      );
    });

    it('rejects revoking an already accepted invitation with 400', async () => {
      const invId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(TeamInvitation, 'findById').mockResolvedValue({
        _id: invId,
        email: 'already.accepted@safetech.so',
        acceptedAt: new Date(),
      } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        params: { id: invId },
        user: { id: 'admin1', name: 'Admin', role: 'admin' },
      });

      await revokeInvitation(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Cannot revoke an invitation that has already been accepted',
        })
      );
    });
  });

  describe('GET /api/v1/team/invitation/:token (Public)', () => {
    it('returns 404 for non-existent token', async () => {
      vi.spyOn(TeamInvitation, 'findOne').mockResolvedValue(null);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        params: { token: 'unknown_token' },
      });

      await getInvitationByToken(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid invitation link',
        })
      );
    });

    it('returns 410 Gone for expired token', async () => {
      vi.spyOn(TeamInvitation, 'findOne').mockResolvedValue({
        token: 'expired_tok',
        acceptedAt: null,
        expiresAt: new Date(Date.now() - 10000), // Expired
      } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        params: { token: 'expired_tok' },
      });

      await getInvitationByToken(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(410);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('expired'),
        })
      );
    });

    it('returns 410 Gone for already accepted token', async () => {
      vi.spyOn(TeamInvitation, 'findOne').mockResolvedValue({
        token: 'used_tok',
        acceptedAt: new Date(),
        expiresAt: new Date(Date.now() + 500000),
      } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        params: { token: 'used_tok' },
      });

      await getInvitationByToken(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(410);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'This invitation has already been used',
        })
      );
    });

    it('returns metadata for valid pending token', async () => {
      const exp = new Date(Date.now() + 500000);
      vi.spyOn(TeamInvitation, 'findOne').mockResolvedValue({
        email: 'onboard@safetech.so',
        role: 'sales',
        acceptedAt: null,
        expiresAt: exp,
      } as any);

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        params: { token: 'valid_tok' },
      });

      await getInvitationByToken(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          email: 'onboard@safetech.so',
          role: 'sales',
          expiresAt: exp,
        })
      );
    });
  });

  describe('POST /api/v1/team/accept-invite (Public)', () => {
    it('creates active verified user with strictly token-assigned role and sets cookies', async () => {
      const mockInv = {
        email: 'newhire@safetech.so',
        role: 'accountant', // Token assigns accountant
        invitedBy: new mongoose.Types.ObjectId(),
        acceptedAt: null,
        expiresAt: new Date(Date.now() + 500000),
        save: vi.fn().mockResolvedValue({}),
      };
      vi.spyOn(TeamInvitation, 'findOne').mockResolvedValue(mockInv as any);
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const fakeCreatedUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'newhire@safetech.so',
        fullName: 'Hassan Guled',
        phone: '+252617788990',
        role: 'accountant',
        isVerified: true,
        status: 'active',
      };
      vi.spyOn(User, 'create').mockResolvedValue(fakeCreatedUser as any);

      const { req, res, statusMock, jsonMock, cookieMock } = createMockReqRes({
        body: {
          token: 'valid_invite_token',
          fullName: 'Hassan Guled',
          phone: '+252617788990',
        },
      });

      await acceptInvitation(req, res, vi.fn());

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newhire@safetech.so',
          fullName: 'Hassan Guled',
          phone: '+252617788990',
          role: 'accountant', // Strictly assigned from token
          isVerified: true,
          status: 'active',
        })
      );
      expect(mockInv.acceptedAt).toBeInstanceOf(Date);
      expect(mockInv.save).toHaveBeenCalled();
      expect(cookieMock).toHaveBeenCalledWith('accessToken', expect.any(String), expect.any(Object));
      expect(cookieMock).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.any(Object));
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            role: 'accountant',
            isVerified: true,
          }),
        })
      );
    });

    it('rejects invalid phone format with 400 Bad Request', async () => {
      const { req, res, statusMock, jsonMock } = createMockReqRes({
        body: {
          token: 'valid_tok',
          fullName: 'Test User',
          phone: '0614324507', // Not E.164
        },
      });

      await acceptInvitation(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('E.164'),
        })
      );
    });
  });

  describe('PATCH /api/v1/team/members/:id/role — Owner-Only Role Modification', () => {
    it('allows workspace owner to update a member role', async () => {
      const targetUserId = new mongoose.Types.ObjectId().toString();
      const mockMember = {
        _id: targetUserId,
        fullName: 'Hassan Ali',
        email: 'hassan@safetech.so',
        role: 'accountant',
        isOwner: false,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockMember as any);

      const ownerId = new mongoose.Types.ObjectId().toString();
      const { req, res, statusMock, jsonMock } = createMockReqRes({
        params: { id: targetUserId },
        body: { role: 'sales' },
        user: {
          id: ownerId,
          role: 'admin',
          isOwner: true,
          name: 'Owner Admin',
        },
      });

      await updateMemberRole(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockMember.role).toBe('sales');
      expect(mockMember.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          member: expect.objectContaining({
            role: 'sales',
          }),
        })
      );
    });

    it('rejects non-owner attempts to modify roles', async () => {
      const targetUserId = new mongoose.Types.ObjectId().toString();
      const staffId = new mongoose.Types.ObjectId().toString();

      const { req, res, statusMock, jsonMock } = createMockReqRes({
        params: { id: targetUserId },
        body: { role: 'accountant' },
        user: {
          id: staffId,
          role: 'sales',
          isOwner: false,
          name: 'Sales Staff',
        },
      });

      await updateMemberRole(req, res, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Only the company owner'),
        })
      );
    });
  });
});

