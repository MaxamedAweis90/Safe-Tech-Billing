import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import quotationRoutes from './routes/quotationRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import receiptRoutes from './routes/receiptRoutes';
import settingsRoutes from './routes/settingsRoutes';
import reportRoutes from './routes/reportRoutes';
import auditRoutes from './routes/auditRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app: Express = express();

// Global Middleware
app.use(
  cors({
    origin: true, // Allow client origin reflecting requester
    credentials: true,
  })
);

// Body parser with 10mb limit for Base64 document assets (logo, stamp, signature)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Probe
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Mount API v1 Routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/audit-log', auditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 Route Catch-all
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;

