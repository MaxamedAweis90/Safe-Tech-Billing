import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DocumentSheet, DocumentKind } from './DocumentSheet';
import { getCustomerById, logAuditEvent } from '../../lib/mockData';
import { toast } from '../../store/useUIStore';

export function pdfName(kind: DocumentKind, obj: any): string {
  const c = getCustomerById(obj.customerId);
  const t: Record<DocumentKind, string> = {
    quote: 'Quotation',
    invoice: 'Invoice',
    receipt: 'Receipt',
  };
  const custName = (c ? c.name : (obj.customerName || 'Customer'))
    .replace(/[\\/:*?"<>|]/g, '')
    .slice(0, 60);
  return `${t[kind]} ${obj.number || 'Draft'} - ${custName}.pdf`;
}

export async function makePdf(
  kind: DocumentKind,
  obj: any,
  asImage = false
): Promise<Blob | string> {
  const stage = document.createElement('div');
  stage.className = 'pdf-stage';
  document.body.appendChild(stage);

  const root = createRoot(stage);
  try {
    flushSync(() => {
      root.render(
        React.createElement(DocumentSheet, {
          kind,
          document: obj,
                  })
      );
    });

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const images = Array.from(stage.querySelectorAll('img'));
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : img.decode
          ? img.decode().catch(() => {})
          : Promise.resolve()
      )
    );

    // Give browser a frame to layout
    await new Promise((resolve) => setTimeout(resolve, 80));

    const docElement = stage.firstElementChild as HTMLElement;
    if (!docElement) {
      throw new Error('Failed to render document for PDF.');
    }

    const canvas = await html2canvas(docElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    if (asImage) {
      return canvas.toDataURL('image/jpeg', 0.92);
    }

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    });

    const docTypeLabel: Record<DocumentKind, string> = {
      quote: 'Quotation',
      invoice: 'Invoice',
      receipt: 'Receipt',
    };
    pdf.setProperties({
      title: `${docTypeLabel[kind]} ${obj.number || 'Draft'}`,
      author: (obj as any)?.companyName || 'My Business',
      creator: (obj as any)?.companyName || 'My Business',
    });

    const pageH = Math.round((canvas.width * 297) / 210);
    if (canvas.height <= pageH * 1.02) {
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297);
    } else {
      for (let y = 0, pg = 0; y < canvas.height; y += pageH, pg++) {
        const part = document.createElement('canvas');
        part.width = canvas.width;
        part.height = Math.min(pageH, canvas.height - y);
        const cx = part.getContext('2d');
        if (cx) {
          cx.fillStyle = '#fff';
          cx.fillRect(0, 0, part.width, part.height);
          cx.drawImage(
            canvas,
            0,
            y,
            canvas.width,
            part.height,
            0,
            0,
            canvas.width,
            part.height
          );
        }
        if (pg) pdf.addPage();
        pdf.addImage(
          part.toDataURL('image/jpeg', 0.93),
          'JPEG',
          0,
          0,
          210,
          (part.height * 210) / canvas.width
        );
      }
    }

    return pdf.output('blob');
  } finally {
    try {
      root.unmount();
    } catch (_) {}
    stage.remove();
  }
}

export async function downloadPdf(
  kind: DocumentKind,
  obj: any,
  btn?: HTMLElement | null
): Promise<void> {
  const originalLabel = btn?.innerHTML;
  if (btn) {
    btn.setAttribute('disabled', 'true');
    btn.textContent = 'Preparing PDF…';
  }

  try {
    const filename = pdfName(kind, obj);
    const blobOrUrl = await makePdf(kind, obj, false);

    if (blobOrUrl instanceof Blob) {
      const url = URL.createObjectURL(blobOrUrl);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1000);
    }

    const docTypeLabel: Record<DocumentKind, string> = {
      quote: 'Quotation',
      invoice: 'Invoice',
      receipt: 'Receipt',
    };
    logAuditEvent('Downloaded PDF', obj.number || 'Draft', docTypeLabel[kind]);
    toast('PDF saved');
  } catch (err: any) {
    console.error('Download PDF error:', err);
    toast((err && err.message) || "The PDF couldn't be created.", true);
  } finally {
    if (btn && originalLabel) {
      btn.removeAttribute('disabled');
      btn.innerHTML = originalLabel;
    }
  }
}
