import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Dashboard summary is accessible to all authenticated roles
router.use(authenticateToken);
router.use(requireRole(['admin', 'accountant', 'sales', 'viewer']));

router.get('/summary', getDashboardSummary);

export default router;

