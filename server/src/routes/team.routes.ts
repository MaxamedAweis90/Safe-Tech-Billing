import { Router } from 'express';
import {
  getMembers,
  inviteMember,
  getInvitations,
  revokeInvitation,
  getInvitationByToken,
  acceptInvitation,
  updateMemberRole,
} from '../controllers/team.controller';
import { authenticate, requireRole, requireOwner } from '../middleware/auth.middleware';

const router = Router();

// Protected admin & owner endpoints
router.get('/members', authenticate, requireRole(['admin']), getMembers);
router.post('/invite', authenticate, requireRole(['admin']), inviteMember);
router.get('/invitations', authenticate, requireRole(['admin']), getInvitations);
router.delete('/invitations/:id', authenticate, requireRole(['admin']), revokeInvitation);
router.patch('/members/:id/role', authenticate, requireOwner, updateMemberRole);

// Public onboarding endpoints
router.get('/invitation/:token', getInvitationByToken);
router.post('/accept-invite', acceptInvitation);

export default router;

