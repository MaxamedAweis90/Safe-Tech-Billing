import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/db';

export const startServer = async (): Promise<void> => {
  await connectDatabase();
  app.listen(env.PORT, () => {
    console.log(`[Server] Safe Tech Billing server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

// Start when executed directly
if (require.main === module) {
  startServer().catch((err) => {
    console.error('[Server] Fatal server startup error:', err);
    process.exit(1);
  });
}

export default app;

