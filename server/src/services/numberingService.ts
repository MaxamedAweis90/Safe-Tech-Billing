import { Types } from 'mongoose';
import { NumberSequence, SequenceKind } from '../models/NumberSequence';

export const DEFAULT_NUMBER_PATTERNS: Record<SequenceKind, string> = {
  quote: 'QT-{YYYY}-{SEQ4}',
  invoice: '{SEQ}',
  receipt: 'RC-{SEQ5}',
  credit: 'CN-{SEQ4}',
};

/**
 * Formats a document sequence number by interpolating sequence digits and date tokens.
 * Supported tokens:
 * - {SEQ}: Raw unpadded integer (e.g. 10457)
 * - {SEQ4}: 4-digit zero-padded integer (e.g. 0001)
 * - {SEQ5}: 5-digit zero-padded integer (e.g. 00001)
 * - {YYYY}: 4-digit year (e.g. 2026)
 * - {YY}: 2-digit year (e.g. 26)
 * - {MM}: 2-digit month (01-12)
 */
export const formatNumber = (pattern: string, seq: number, dateISO: string = new Date().toISOString()): string => {
  const dateObj = new Date(dateISO);
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

  const yyyy = validDate.getUTCFullYear().toString();
  const yy = yyyy.slice(-2);
  const mm = String(validDate.getUTCMonth() + 1).padStart(2, '0');

  return pattern
    .replace(/\{SEQ\}/g, String(seq))
    .replace(/\{SEQ4\}/g, String(seq).padStart(4, '0'))
    .replace(/\{SEQ5\}/g, String(seq).padStart(5, '0'))
    .replace(/\{YYYY\}/g, yyyy)
    .replace(/\{YY\}/g, yy)
    .replace(/\{MM\}/g, mm);
};

/**
 * Atomically increments and retrieves the next sequential number for a given document kind.
 * Strictly scoped by companyId to guarantee tenant isolation and independent sequence counters.
 */
export const getNextNumber = async (
  kind: SequenceKind,
  dateISO: string = new Date().toISOString(),
  companyId?: string | Types.ObjectId | null
): Promise<string> => {
  const defaultPattern = DEFAULT_NUMBER_PATTERNS[kind] || '{SEQ}';

  let resolvedCompanyId: Types.ObjectId | null = null;
  if (companyId) {
    if (companyId instanceof Types.ObjectId) {
      resolvedCompanyId = companyId;
    } else if (typeof companyId === 'string' && Types.ObjectId.isValid(companyId)) {
      resolvedCompanyId = new Types.ObjectId(companyId);
    }
  }

  const sequenceDoc = await NumberSequence.findOneAndUpdate(
    { companyId: resolvedCompanyId, kind },
    {
      $inc: { current_seq: 1 },
      $setOnInsert: { format: defaultPattern },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  const pattern = sequenceDoc.format || defaultPattern;
  return formatNumber(pattern, sequenceDoc.current_seq, dateISO);
};

/**
 * Previews the upcoming sequential number for a specific company without incrementing the persistent sequence counter.
 */
export const peekNextNumber = async (
  kind: SequenceKind,
  dateISO: string = new Date().toISOString(),
  companyId?: string | Types.ObjectId | null
): Promise<string> => {
  const defaultPattern = DEFAULT_NUMBER_PATTERNS[kind] || '{SEQ}';

  let resolvedCompanyId: Types.ObjectId | null = null;
  if (companyId) {
    if (companyId instanceof Types.ObjectId) {
      resolvedCompanyId = companyId;
    } else if (typeof companyId === 'string' && Types.ObjectId.isValid(companyId)) {
      resolvedCompanyId = new Types.ObjectId(companyId);
    }
  }

  const sequenceDoc = await NumberSequence.findOne({ companyId: resolvedCompanyId, kind });
  const currentSeq = sequenceDoc ? sequenceDoc.current_seq : (kind === 'invoice' ? 10471 : 0);
  const pattern = sequenceDoc?.format || defaultPattern;
  return formatNumber(pattern, currentSeq + 1, dateISO);
};
