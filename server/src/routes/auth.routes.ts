import { Router } from 'express';
import {
  signup,
  verifyEmail,
  requestRegistrationOtp,
  completeRegistration,
  requestOtp,
  verifyOtp,
  getMe,
  refreshToken,
  logout,
  login,
  seedDemoUsers,
  googleAuth,
  demoLogin,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Pre-Phase 7 Auth & Verification Endpoints
router.post('/signup', signup);
router.post('/verify-email', verifyEmail);
router.post('/request-registration-otp', requestRegistrationOtp);
router.post('/complete-registration', completeRegistration);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google', googleAuth);
router.post('/demo-login', demoLogin);
router.get('/me', authenticate, getMe);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Legacy / Demo accounts fallback
router.post('/login', login);
router.post('/seed-demo-users', seedDemoUsers);

export default router;

