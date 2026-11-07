import { Router } from 'express';
import {
  getTrash,
  restoreTrashItem,
  purgeTrashItem,
  emptyAllTrash,
} from '../controllers/trashController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
// Trash access is strictly restricted to administrator
router.use(requireRole(['admin']));

router.get('/', getTrash);
router.post('/:type/:id/restore', restoreTrashItem);
router.delete('/:type/:id/purge', purgeTrashItem);
router.delete('/empty', emptyAllTrash);

export default router;

