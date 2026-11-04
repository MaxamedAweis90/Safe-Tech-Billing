import { Router } from 'express';
import {
  getMembers,
  inviteMember,
  getInvitations,
  revokeInvitation,
  getInvitationByToken,
  acceptInvitation,
} from '../controllers/team.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Protected admin endpoints
router.get('/members', authenticate, requireRole(['admin']), getMembers);
router.post('/invite', authenticate, requireRole(['admin']), inviteMember);
router.get('/invitations', authenticate, requireRole(['admin']), getInvitations);
router.delete('/invitations/:id', authenticate, requireRole(['admin']), revokeInvitation);

// Public onboarding endpoints
router.get('/invitation/:token', getInvitationByToken);
router.post('/accept-invite', acceptInvitation);

export default router;

