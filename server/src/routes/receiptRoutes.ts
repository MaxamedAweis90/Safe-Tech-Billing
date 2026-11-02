import { Router } from 'express';
import { listReceipts, getReceipt } from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Read receipts: admin, accountant, sales, viewer
router.get('/', requireRole(['admin', 'accountant', 'sales', 'viewer']), listReceipts);
router.get('/:id', requireRole(['admin', 'accountant', 'sales', 'viewer']), getReceipt);

export default router;

