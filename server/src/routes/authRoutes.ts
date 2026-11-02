import { Router } from 'express';
import { login, getMe, seedDemoUsers } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.post('/seed-demo-users', seedDemoUsers);

export default router;

