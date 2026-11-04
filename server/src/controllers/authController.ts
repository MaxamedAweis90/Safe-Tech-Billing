import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { env } from '../config/env';
import { logAction } from '../services/auditService';

/**
 * Handles user login and generates JWT token.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password_hash) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    await logAction({
      user_name: user.name,
      role: user.role,
      action: 'User login',
      ref: user.email,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns current authenticated user profile.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Seeds demo accounts across the 4 roles: admin, accountant, sales, viewer.
 */
export const seedDemoUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const demoAccounts: Array<{ name: string; email: string; pass: string; role: UserRole }> = [
      { name: 'Admin User', email: 'admin@safetech.so', pass: 'Admin@123', role: 'admin' },
      { name: 'Accountant User', email: 'accountant@safetech.so', pass: 'Accountant@123', role: 'accountant' },
      { name: 'Sales Officer', email: 'sales@safetech.so', pass: 'Sales@123', role: 'sales' },
      { name: 'Viewer User', email: 'viewer@safetech.so', pass: 'Viewer@123', role: 'viewer' },
    ];

    const results = [];
    for (const acc of demoAccounts) {
      const password_hash = await bcrypt.hash(acc.pass, 10);
      const user = await User.findOneAndUpdate(
        { email: acc.email },
        {
          name: acc.name,
          email: acc.email,
          password_hash,
          role: acc.role,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ email: user.email, role: user.role });
    }

    res.status(200).json({
      success: true,
      message: 'Demo accounts seeded successfully',
      users: results,
    });
  } catch (err) {
    next(err);
  }
};

