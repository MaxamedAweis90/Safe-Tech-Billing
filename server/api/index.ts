import app from '../src/app';
import { connectDatabase } from '../src/config/db';
import { seedDefaultData } from '../src/config/seedDefaults';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await connectDatabase();
      await seedDefaultData();
      initialized = true;
    } catch (err) {
      console.error('[Serverless] Failed initializing database:', err);
    }
  }

  return app(req, res);
}
