import mongoose from 'mongoose';
import { env } from './env';
import { migrateIndexes } from './migrateIndexes';

let isListenersAttached = false;

export const connectDatabase = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (!isListenersAttached) {
    mongoose.connection.on('connected', () => {
      console.log(`[Database] MongoDB connection established: ${mongoose.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected.');
    });

    // Graceful process shutdown hooks
    const handleShutdown = async (signal: string): Promise<void> => {
      console.log(`[Database] Received ${signal}. Closing MongoDB connection...`);
      try {
        await disconnectDatabase();
      } finally {
        process.exit(0);
      }
    };

    process.on('SIGINT', () => {
      void handleShutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
      void handleShutdown('SIGTERM');
    });

    isListenersAttached = true;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      dbName: 'safetech_billing',
      serverSelectionTimeoutMS: 10000,
    });
    await migrateIndexes(conn);
    return conn;
  } catch (error) {
    console.error('[Database] Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    console.log('[Database] MongoDB connection closed.');
  }
};
