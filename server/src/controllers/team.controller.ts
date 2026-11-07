import { Request, Response, NextFunction } from 'express';
import * as teamService from '../services/team.service';
import { setAuthCookies } from './auth.controller';

/**
 * 1. GET /api/v1/team/members
 * Guarded: Admin only.
 * Returns all organization members.
 */
export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const companyId = req.user?.companyId || undefined;
    const members = await teamService.listTeamMembers(companyId);
    res.status(200).json({
      success: true,
      members,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. POST /api/v1/team/invite
 * Guarded: Admin only.
 * Invites a new staff member with role 'accountant' or 'sales'.
 */
export const inviteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, role, fullName } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Role validation: strictly accountant or sales (reject admin)
    if (role === 'admin') {
      res.status(400).json({
        success: false,
        error: "Admin role cannot be invited. Only 'accountant' and 'sales' roles are permitted.",
      });
      return;
    }

    if (!role || !['accountant', 'sales'].includes(role)) {
      res.status(400).json({
        success: false,
        error: "Role must be either 'accountant' or 'sales'",
      });
      return;
    }

    const invitation = await teamService.createInvitation({
      email,
      role,
      fullName,
      invitedBy: req.user.id,
      inviterName: req.user.name,
      inviterEmail: req.user.email,
      companyId: req.user.companyId || undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });
  } catch (err: any) {
    if (err instanceof teamService.TeamServiceError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

/**
 * 3. GET /api/v1/team/invitations
 * Guarded: Admin only.
 * Lists all invitations with status.
 */
export const getInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const companyId = req.user?.companyId || undefined;
    const invitations = await teamService.listInvitations(companyId);
    res.status(200).json({
      success: true,
      invitations,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. DELETE /api/v1/team/invitations/:id
 * Guarded: Admin only.
 * Revokes a pending invitation.
 */
export const revokeInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    await teamService.revokeInvitation(id as string, req.user.name, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Invitation revoked',
    });
  } catch (err: any) {
    if (err instanceof teamService.TeamServiceError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

/**
 * 5. GET /api/v1/team/invitation/:token
 * Public onboarding lookup endpoint.
 */
export const getInvitationByToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.params.token as string;
    const metadata = await teamService.getInvitationByToken(token);

    res.status(200).json({
      success: true,
      email: metadata.email,
      role: metadata.role,
      expiresAt: metadata.expiresAt,
      inviterName: metadata.inviterName,
      companyName: metadata.companyName,
    });
  } catch (err: any) {
    if (err instanceof teamService.TeamServiceError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

/**
 * 6. POST /api/v1/team/accept-invite
 * Public onboarding completion endpoint.
 */
export const acceptInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, fullName, phone, initialOtp } = req.body;

    const result = await teamService.acceptInvitation({
      token,
      fullName,
      phone,
      initialOtp,
    });

    // Set HTTP-only secure session cookies for immediate bootstrap
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.status(201).json({
      success: true,
      message: 'Invitation accepted successfully',
      token: result.tokens.accessToken,
      user: result.user,
    });
  } catch (err: any) {
    if (err instanceof teamService.TeamServiceError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

/**
 * 7. PATCH /api/v1/team/members/:id/role
 * Guarded: Company Owner only.
 * Updates a staff member's assigned role.
 */
export const updateMemberRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const updated = await teamService.updateMemberRole(
      id as string,
      role,
      req.user.id,
      req.user.role,
      req.user.isOwner
    );

    res.status(200).json({
      success: true,
      message: 'Staff member role updated successfully',
      member: updated,
    });
  } catch (err: any) {
    if (err instanceof teamService.TeamServiceError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

