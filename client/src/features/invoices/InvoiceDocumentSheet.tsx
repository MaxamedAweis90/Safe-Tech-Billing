import React from 'react';
import { MockInvoice } from '../../lib/mockData';
import { DocumentSheet } from '../documents/DocumentSheet';

export interface InvoiceDocumentSheetProps {
  invoice: MockInvoice;
}

/**
 * High-legibility A4 invoice document sheet.
 * Powered by unified `DocumentSheet` engine.
 */
export const InvoiceDocumentSheet: React.FC<InvoiceDocumentSheetProps> = ({ invoice }) => {
  return <DocumentSheet kind="invoice" document={invoice} />;
};
