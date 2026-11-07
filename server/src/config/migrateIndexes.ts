import mongoose from 'mongoose';

/**
 * Migration script to clean up legacy global unique indexes that conflict with multi-tenancy.
 * This runs automatically upon database connection both in development and production.
 */
export const migrateIndexes = async (conn: typeof mongoose): Promise<void> => {
  try {
    const db = conn.connection.db;
    if (!db) return;

    // Helper to safely drop an index if it exists
    const safeDropIndex = async (collectionName: string, indexName: string) => {
      try {
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) return;

        const indexes = await db.collection(collectionName).indexes();
        const exists = indexes.some((idx) => idx.name === indexName);
        if (exists) {
          await db.collection(collectionName).dropIndex(indexName);
          console.log(`[Index Migration] Successfully dropped legacy index '${indexName}' from '${collectionName}'`);
        }
      } catch (err: any) {
        console.warn(`[Index Migration] Notice dropping '${indexName}' from '${collectionName}':`, err.message);
      }
    };

    // 1. number_sequences: drop legacy global unique index 'kind_1'
    await safeDropIndex('number_sequences', 'kind_1');

    // 2. quotations: drop legacy global unique index 'number_1'
    await safeDropIndex('quotations', 'number_1');

    // 3. invoices: drop legacy global unique index 'number_1'
    await safeDropIndex('invoices', 'number_1');
    // Drop old 'companyId_1_number_1' if it was sparse without partialFilterExpression
    try {
      const invCollections = await db.listCollections({ name: 'invoices' }).toArray();
      if (invCollections.length > 0) {
        const invIndexes = await db.collection('invoices').indexes();
        const oldInvIndex = invIndexes.find((idx) => idx.name === 'companyId_1_number_1');
        if (oldInvIndex && !oldInvIndex.partialFilterExpression) {
          await db.collection('invoices').dropIndex('companyId_1_number_1');
          console.log("[Index Migration] Dropped sparse 'companyId_1_number_1' without partialFilterExpression from invoices");
        }
      }
    } catch (err: any) {
      console.warn("[Index Migration] Notice checking 'companyId_1_number_1' on invoices:", err.message);
    }

    // 4. customers: drop legacy global unique index 'code_1'
    await safeDropIndex('customers', 'code_1');

    // 5. receipts: drop legacy global unique index 'number_1'
    await safeDropIndex('receipts', 'number_1');

    // 6. credit_notes: drop legacy global unique index 'number_1'
    await safeDropIndex('credit_notes', 'number_1');

    // 7. payments: drop legacy global unique index 'method_1_reference_1' if missing companyId
    try {
      const payCollections = await db.listCollections({ name: 'payments' }).toArray();
      if (payCollections.length > 0) {
        const payIndexes = await db.collection('payments').indexes();
        const oldPayIndex = payIndexes.find((idx) => idx.name === 'method_1_reference_1');
        if (oldPayIndex && !oldPayIndex.key.companyId) {
          await db.collection('payments').dropIndex('method_1_reference_1');
          console.log("[Index Migration] Dropped non-tenant 'method_1_reference_1' from payments");
        }
      }
    } catch (err: any) {
      console.warn("[Index Migration] Notice checking 'method_1_reference_1' on payments:", err.message);
    }

    // 8. Clean up accidental prototype stamp/logo saved on real user companies (ownerId !== null)
    try {
      const PROTOTYPE_STAMP_LENGTH = 14150;
      const PROTOTYPE_LOGO_LENGTH = 9386;

      const userCompanies = await db.collection('companies').find({ ownerId: { $ne: null } }).toArray();
      for (const comp of userCompanies) {
        const updates: Record<string, string> = {};
        if (comp.stamp && (comp.stamp.length === PROTOTYPE_STAMP_LENGTH || comp.stamp.includes('iVBORw0KGgoAAAANSUhEUgAAALQAAACUCAYAAAA6YQME'))) {
          updates.stamp = '';
        }
        if (comp.logo && (comp.logo.length === PROTOTYPE_LOGO_LENGTH || comp.logo.includes('iVBORw0KGgoAAAANSUhEUgAAAK4AAABMCAYAAAD0gIxn'))) {
          updates.logo = '';
        }
        if (Object.keys(updates).length > 0) {
          await db.collection('companies').updateOne({ _id: comp._id }, { $set: updates });
          console.log(`[Branding Migration] Removed inherited demo assets from user company '${comp.name}' (${comp._id})`);
        }
      }
    } catch (err: any) {
      console.warn('[Branding Migration] Notice cleaning user company assets:', err.message);
    }

    console.log('[Index Migration] Index migration check completed successfully.');
  } catch (error) {
    console.error('[Index Migration] Error during index migration:', error);
  }
};

