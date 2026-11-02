import React from 'react';
import { Icon } from '../../components/icons';
import { CATALOG_ITEMS, TAX_RATES, MockQuoteItem } from '../../lib/mockData';
import { lineCalc, plain, priceStr, toMilli } from '../../lib/formatters';

export interface QuoteItemsTableProps {
  items: MockQuoteItem[];
  currency: string;
  readOnly?: boolean;
  onChange: (items: MockQuoteItem[]) => void;
  error?: string | null;
}

export const QuoteItemsTable: React.FC<QuoteItemsTableProps> = ({
  items,
  currency,
  readOnly = false,
  onChange,
  error,
}) => {
  const handleItemChange = (index: number, field: keyof MockQuoteItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'desc') {
      current.desc = value;
      // Catalog price auto-fill if unit price is 0 or unset
      const catalogHit = CATALOG_ITEMS.find(
        (c) => c[0].toLowerCase() === value.trim().toLowerCase()
      );
      if (catalogHit && !current.price) {
        current.price = catalogHit[1];
      }
    } else if (field === 'qty') {
      const parsed = parseFloat(value);
      current.qty = !isNaN(parsed) && parsed > 0 ? Math.round(parsed * 1000) / 1000 : 0;
    } else if (field === 'price') {
      const milli = toMilli(value);
      current.price = isNaN(milli) ? 0 : milli;
    } else if (field === 'disc') {
      const parsed = parseFloat(value || '0');
      current.disc = !isNaN(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 0;
    } else if (field === 'taxRate') {
      const selectedTax = TAX_RATES.find((t) => t.id === value);
      if (selectedTax) {
        current.taxRate = selectedTax.rate;
        current.taxName = selectedTax.rate > 0 ? selectedTax.name : '';
      }
    }

    updated[index] = current;
    onChange(updated);
  };

  const handleAddRow = () => {
    onChange([
      ...items,
      { desc: '', qty: 1, price: 0, disc: 0, taxRate: 0, taxName: '' },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (items.length > 1) {
      const updated = items.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Items</h2>
        <span className="sub">Prices exclude tax. Line totals round to the cent.</span>
      </div>
      <div className="panel-body" style={{ paddingTop: 6 }}>
        <table className="items">
          <thead>
            <tr>
              <th>Description</th>
              <th className="c-qty">Qty</th>
              <th className="c-price">Unit price</th>
              <th className="c-disc">Disc %</th>
              <th className="c-tax">Tax</th>
              <th className="c-total">Line total</th>
              <th className="c-x"></th>
            </tr>
          </thead>
          <tbody id="itemRows">
            {items.map((it, idx) => {
              const calc = lineCalc(it);
              return (
                <tr key={idx} data-row={idx}>
                  {/* Description */}
                  <td className="c-desc" data-l="Description">
                    {readOnly ? (
                      <span>{it.desc || '—'}</span>
                    ) : (
                      <input
                        className="inp"
                        value={it.desc}
                        list="catalog-list"
                        placeholder="Product or service"
                        aria-label="Description"
                        onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                      />
                    )}
                  </td>

                  {/* Qty */}
                  <td className="c-qty" data-l="Qty">
                    {readOnly ? (
                      <span className="font-mono">{it.qty}</span>
                    ) : (
                      <input
                        className="inp r"
                        defaultValue={it.qty || ''}
                        key={`qty-${idx}-${it.qty}`}
                        inputMode="decimal"
                        aria-label="Quantity"
                        onBlur={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      />
                    )}
                  </td>

                  {/* Unit price */}
                  <td className="c-price" data-l="Unit price">
                    {readOnly ? (
                      <span className="font-mono">{priceStr(it.price)}</span>
                    ) : (
                      <input
                        className="inp r"
                        defaultValue={it.price ? priceStr(it.price).replace(/,/g, '') : ''}
                        key={`price-${idx}-${it.price}`}
                        inputMode="decimal"
                        placeholder="0.00"
                        aria-label="Unit price"
                        onBlur={(e) => handleItemChange(idx, 'price', e.target.value)}
                      />
                    )}
                  </td>

                  {/* Disc % */}
                  <td className="c-disc" data-l="Disc %">
                    {readOnly ? (
                      <span className="font-mono">{it.disc ? `${it.disc}%` : '—'}</span>
                    ) : (
                      <input
                        className="inp r"
                        defaultValue={it.disc || ''}
                        key={`disc-${idx}-${it.disc}`}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label="Discount percent"
                        onBlur={(e) => handleItemChange(idx, 'disc', e.target.value)}
                      />
                    )}
                  </td>

                  {/* Tax */}
                  <td className="c-tax" data-l="Tax">
                    {readOnly ? (
                      <span>{it.taxName || 'No tax'}</span>
                    ) : (
                      <select
                        className="sel"
                        style={{ width: '100%' }}
                        aria-label="Tax"
                        value={
                          TAX_RATES.find((t) => t.rate === it.taxRate)?.id || 'none'
                        }
                        onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                      >
                        {TAX_RATES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Line total */}
                  <td className="c-total font-mono" data-l="Line total">
                    {plain(calc.total, currency)}
                  </td>

                  {/* Remove row */}
                  <td className="c-x">
                    {!readOnly && (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Remove line"
                        disabled={items.length === 1}
                        onClick={() => handleDeleteRow(idx)}
                      >
                        <Icon name="trash" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Catalog Datalist */}
        <datalist id="catalog-list">
          {CATALOG_ITEMS.map(([name, price]) => (
            <option key={name} value={name}>
              {priceStr(price)}
            </option>
          ))}
        </datalist>

        {/* Add line action */}
        {!readOnly && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="button" className="btn sm" onClick={handleAddRow}>
              <Icon name="plus" />
              Add line
            </button>
          </div>
        )}

        {/* Validation error display */}
        {error && (
          <span className="err-msg" style={{ display: 'block', marginTop: 8 }}>
            {error}
          </span>
        )}
      </div>
    </section>
  );
};

