import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDatabase } from './config/db';

const app: Express = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

const startServer = async (): Promise<void> => {
  await connectDatabase();
  app.listen(env.PORT, () => {
    console.log(`[Server] Safe Tech Billing server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

export default app;

