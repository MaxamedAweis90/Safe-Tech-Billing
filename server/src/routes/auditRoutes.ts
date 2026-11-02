import { Router } from 'express';
import { listAuditLogs } from '../controllers/auditController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
// Audit log access is strictly restricted to administrator
router.get('/', requireRole(['admin']), listAuditLogs);

export default router;

