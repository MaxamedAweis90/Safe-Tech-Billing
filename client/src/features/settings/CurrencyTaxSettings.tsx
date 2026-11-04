import React from 'react';
import { SystemCurrency, SystemTax, logAuditEvent } from '../../lib/mockData';
import { IconPlus } from '../../components/icons';
import { openModal, closeModal, toast } from '../../store/useUIStore';

export interface CurrencyTaxSettingsProps {
  currencies: SystemCurrency[];
  defaultCurrency: string;
  taxes: SystemTax[];
  onCurrenciesChange: (currencies: SystemCurrency[]) => void;
  onDefaultCurrencyChange: (code: string) => void;
  onTaxesChange: (taxes: SystemTax[]) => void;
}

export const CurrencyTaxSettings: React.FC<CurrencyTaxSettingsProps> = ({
  currencies,
  defaultCurrency,
  taxes,
  onCurrenciesChange,
  onDefaultCurrencyChange,
  onTaxesChange,
}) => {
  const handleSymbolChange = (index: number, newSymbol: string) => {
    const updated = [...currencies];
    updated[index] = { ...updated[index], symbol: newSymbol };
    onCurrenciesChange(updated);
  };

  const handleRateChange = (index: number, newRateStr: string) => {
    const r = parseFloat(newRateStr);
    const updated = [...currencies];
    updated[index] = { ...updated[index], rate: isNaN(r) ? 0 : r };
    onCurrenciesChange(updated);
  };

  const handleTaxNameChange = (index: number, newName: string) => {
    const updated = [...taxes];
    updated[index] = { ...updated[index], name: newName };
    onTaxesChange(updated);
  };

  const handleTaxRateChange = (index: number, newRateStr: string) => {
    const r = parseFloat(newRateStr);
    const updated = [...taxes];
    updated[index] = { ...updated[index], rate: isNaN(r) ? 0 : r };
    onTaxesChange(updated);
  };

  const handleAddTax = () => {
    const newTax: SystemTax = {
      id: `t_${Date.now()}`,
      name: 'New tax',
      rate: 0,
    };
    onTaxesChange([...taxes, newTax]);
  };

  const openAddCurrencyModal = () => {
    let codeVal = '';
    let symVal = '';
    let decVal = '2';
    let rateVal = '';

    openModal({
      title: 'Add currency',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="ncCode">ISO code</label>
              <input
                id="ncCode"
                className="inp"
                maxLength={3}
                placeholder="KES"
                onChange={(e) => (codeVal = e.target.value.trim().toUpperCase())}
              />
            </div>
            <div className="field">
              <label htmlFor="ncSym">Symbol</label>
              <input
                id="ncSym"
                className="inp"
                placeholder="KSh"
                onChange={(e) => (symVal = e.target.value.trim())}
              />
            </div>
            <div className="field">
              <label htmlFor="ncDec">Decimals</label>
              <select
                id="ncDec"
                className="sel"
                defaultValue="2"
                onChange={(e) => (decVal = e.target.value)}
              >
                <option value="2">2</option>
                <option value="0">0</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="ncRate">Units per 1 USD</label>
              <input
                id="ncRate"
                className="inp"
                inputMode="decimal"
                placeholder="e.g. 130"
                onChange={(e) => (rateVal = e.target.value.trim())}
              />
            </div>
          </div>
          <span className="err-msg" id="ncErr" style={{ display: 'none' }} />
        </div>
      ),
      foot: (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={closeModal}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            id="ncSave"
            onClick={() => {
              const code = codeVal.trim().toUpperCase();
              const sym = symVal.trim();
              const rate = parseFloat(rateVal);
              const errEl = document.getElementById('ncErr');

              const showError = (m: string) => {
                if (errEl) {
                  errEl.textContent = m;
                  errEl.style.display = 'block';
                } else {
                  toast(m, true);
                }
              };

              if (!/^[A-Z]{3}$/.test(code)) {
                showError('Use a three-letter ISO code such as KES.');
                return;
              }
              if (currencies.some((c) => c.code === code)) {
                showError(`${code} is already set up.`);
                return;
              }
              if (!(rate > 0)) {
                showError('Enter the exchange rate against USD.');
                return;
              }

              const newCurrency: SystemCurrency = {
                code,
                symbol: sym || code,
                decimals: parseInt(decVal, 10),
                rate,
              };

              onCurrenciesChange([...currencies, newCurrency]);
              logAuditEvent('Added currency', code);
              closeModal();
              toast(`Currency ${code} added`);
            }}
          >
            Add currency
          </button>
        </div>
      ),
    });
  };

  return (
    <div className="grid-2e">
      {/* Currencies Panel */}
      <section className="panel">
        <div className="panel-head">
          <h2>Currencies</h2>
          <button
            type="button"
            className="btn sm"
            data-act="add-cur"
            onClick={openAddCurrencyModal}
          >
            <IconPlus size={14} />
            Add currency
          </button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Code</th>
                <th>Symbol</th>
                <th className="r">Decimals</th>
                <th className="r">Per 1 USD</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((c, i) => (
                <tr key={c.code}>
                  <td className="mono strong">{c.code}</td>
                  <td>
                    <input
                      className="inp"
                      style={{ width: 80 }}
                      data-cur={i}
                      data-cf="symbol"
                      value={c.symbol}
                      aria-label="Symbol"
                      onChange={(e) => handleSymbolChange(i, e.target.value)}
                    />
                  </td>
                  <td className="r">{c.decimals}</td>
                  <td className="r">
                    {c.code === 'USD' ? (
                      '1'
                    ) : (
                      <input
                        className="inp r"
                        style={{ width: 90 }}
                        data-cur={i}
                        data-cf="rate"
                        value={c.rate}
                        inputMode="decimal"
                        aria-label="Exchange rate"
                        onChange={(e) => handleRateChange(i, e.target.value)}
                      />
                    )}
                  </td>
                  <td>
                    <input
                      type="radio"
                      name="defCur"
                      value={c.code}
                      checked={defaultCurrency === c.code}
                      aria-label="Default currency"
                      onChange={() => onDefaultCurrencyChange(c.code)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tax Rates Panel */}
      <section className="panel">
        <div className="panel-head">
          <h2>Tax rates</h2>
          <button
            type="button"
            className="btn sm"
            data-act="add-tax"
            onClick={handleAddTax}
          >
            <IconPlus size={14} />
            Add rate
          </button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th className="r">Rate %</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((t, i) => (
                <tr key={t.id}>
                  <td>
                    {t.id === 'none' ? (
                      'No tax'
                    ) : (
                      <input
                        className="inp"
                        data-tax={i}
                        data-tf="name"
                        value={t.name}
                        aria-label="Tax name"
                        onChange={(e) => handleTaxNameChange(i, e.target.value)}
                      />
                    )}
                  </td>
                  <td className="r">
                    {t.id === 'none' ? (
                      '0'
                    ) : (
                      <input
                        className="inp r"
                        style={{ width: 80 }}
                        data-tax={i}
                        data-tf="rate"
                        value={t.rate}
                        inputMode="decimal"
                        aria-label="Tax rate"
                        onChange={(e) => handleTaxRateChange(i, e.target.value)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="panel-body"
          style={{ fontSize: 12.5, color: 'var(--muted)', paddingTop: 0 }}
        >
          The rate is copied onto each line when it&apos;s added, so changing a rate
          never alters issued documents.
        </div>
      </section>
    </div>
  );
};
