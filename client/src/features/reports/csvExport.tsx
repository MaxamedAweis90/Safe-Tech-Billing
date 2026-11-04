import { toast, openModal, closeModal } from '../../store/useUIStore';

/**
 * Formats a 2D matrix of strings and numbers into RFC-4180 compliant CSV.
 * Escapes quotes by doubling them and wrapping fields in double quotes when necessary.
 */
export function formatCSV(matrix: (string | number)[][]): string {
  return matrix
    .map((row) =>
      row
        .map((cell) => {
          const c = String(cell ?? '');
          return /[",\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Copies text to the user's clipboard using navigator.clipboard, with a modal fallback
 * if clipboard access is blocked or unavailable.
 */
export function copyText(txt: string, label = 'Copied') {
  const done = () => toast(label);

  const fallback = () => {
    openModal({
      title: 'Copy',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            Your browser blocked automatic copying. Select the text below and copy it.
          </p>
          <textarea
            className="inp font-mono"
            rows={10}
            defaultValue={txt}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
      ),
      foot: (
        <button type="button" className="btn primary" onClick={closeModal}>
          Done
        </button>
      ),
    });
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(txt)
      .then(done)
      .catch(() => fallback());
  } else {
    fallback();
  }
}

/**
 * High-level helper to convert a table matrix to CSV and copy it to clipboard.
 */
export function exportCSV(
  matrix: (string | number)[][],
  toastLabel = 'CSV copied. Paste into Excel or Sheets.'
) {
  const csvStr = formatCSV(matrix);
  copyText(csvStr, toastLabel);
}
