import app, { startServer } from './server';

// Boot server
startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

export default app;
