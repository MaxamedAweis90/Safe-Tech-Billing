import React, { useState, useEffect } from 'react';
import {
  SYSTEM_SETTINGS,
  COMPANY_SETTINGS,
  TODAY,
  logAuditEvent,
  resetSampleData,
} from '../../lib/mockData';
import { fmtNumber } from '../../lib/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { toast, confirmBox } from '../../store/useUIStore';
import { CurrencyTaxSettings } from './CurrencyTaxSettings';
import { EmailTemplatesView } from './EmailTemplatesView';
import { TeamSettingsView } from '../team/TeamSettingsView';
import {
  useCompanySettings,
  useUpdateCompanySettings,
  useResetSampleData,
} from '../../hooks/useSettings';

export type SettingsTab = 'company' | 'currencies' | 'numbering' | 'team' | 'templates';

export const getSettingsTabFromHash = (hash: string): SettingsTab => {
  const h = hash.toLowerCase();
  if (h.includes('team')) return 'team';
  if (h.includes('template')) return 'templates';
  if (h.includes('currenc')) return 'currencies';
  if (h.includes('numbering')) return 'numbering';
  return 'company';
};

export const SettingsView: React.FC = () => {
  const { role, can } = useAuthStore();
  const isAdmin = role === 'admin';
  const { setActiveTab } = useNavStore();

  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>(() => {
    if (typeof window !== 'undefined') {
      return getSettingsTabFromHash(window.location.hash);
    }
    return 'company';
  });

  const switchTab = (tab: SettingsTab) => {
    setActiveSettingsTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#settings/${tab}`;
    }
  };

  // Guard: non-admins cannot access team or email templates tabs
  useEffect(() => {
    if (!isAdmin && (activeSettingsTab === 'team' || activeSettingsTab === 'templates')) {
      switchTab('company');
    }
  }, [isAdmin, activeSettingsTab]);

  // Sync hash changes
  useEffect(() => {
    const handleHash = () => {
      const target = getSettingsTabFromHash(window.location.hash);
      if ((target === 'team' || target === 'templates') && !isAdmin) {
        setActiveSettingsTab('company');
      } else {
        setActiveSettingsTab(target);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isAdmin]);

  const [company, setCompany] = useState({ ...SYSTEM_SETTINGS.company });
  const [currencies, setCurrencies] = useState([
    ...SYSTEM_SETTINGS.currencies.map((c) => ({ ...c })),
  ]);
  const [defaultCurrency, setDefaultCurrency] = useState(
    SYSTEM_SETTINGS.defaultCurrency
  );
  const [numbering, setNumbering] = useState({ ...SYSTEM_SETTINGS.numbering });
  const [taxes, setTaxes] = useState([
    ...SYSTEM_SETTINGS.taxes.map((t) => ({ ...t })),
  ]);
  const [quoteTerms, setQuoteTerms] = useState(SYSTEM_SETTINGS.quoteTerms);
  const [invoiceTerms, setInvoiceTerms] = useState(SYSTEM_SETTINGS.invoiceTerms);

  const { data: companyData } = useCompanySettings();
  const updateCompanyMutation = useUpdateCompanySettings();
  const resetSampleMutation = useResetSampleData();

  useEffect(() => {
    if (companyData?.company) {
      const c = companyData.company;
      setCompany((prev) => ({
        ...prev,
        name: c.name || prev.name,
        tagline: c.tagline !== undefined ? c.tagline : prev.tagline,
        address: c.address !== undefined ? c.address : prev.address,
        phone: c.phone !== undefined ? c.phone : prev.phone,
        email: c.email !== undefined ? c.email : prev.email,
        website: c.website !== undefined ? c.website : prev.website,
        taxId: c.tax_id !== undefined ? c.tax_id : prev.taxId,
        bankName: c.bank_name !== undefined ? c.bank_name : prev.bankName,
        accountName: c.account_name !== undefined ? c.account_name : prev.accountName,
        accountNo: c.account_no !== undefined ? c.account_no : prev.accountNo,
        mobileMoney: c.mobile_money !== undefined ? c.mobile_money : prev.mobileMoney,
        signatory: c.signatory !== undefined ? c.signatory : prev.signatory,
        logo: c.logo || prev.logo,
        stamp: c.stamp || prev.stamp,
        signature: c.signature || prev.signature,
      }));
      if (c.quote_terms) setQuoteTerms(c.quote_terms);
      if (c.invoice_terms) setInvoiceTerms(c.invoice_terms);
      if (c.default_currency) setDefaultCurrency(c.default_currency);
    }
  }, [companyData]);

  if (!can('settings')) {
    return (
      <div className="page-head">
        <div>
          <h1>Company &amp; settings</h1>
          <p>Access restricted. You need administrative privileges to view settings.</p>
        </div>
      </div>
    );
  }

  // Base64 file uploader with <= 1.5MB validation matching prototype line 938
  const handleImageUpload = (
    key: 'logo' | 'stamp' | 'signature',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast('Choose an image under 1.5 MB.', true);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCompany((prev) => ({ ...prev, [key]: dataUrl }));
      COMPANY_SETTINGS[key] = dataUrl;
      logAuditEvent(`Uploaded ${key}`, 'Branding');
      toast(`${key[0].toUpperCase() + key.slice(1)} uploaded`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImageRemove = (key: 'logo' | 'stamp' | 'signature') => {
    setCompany((prev) => ({ ...prev, [key]: '' }));
    COMPANY_SETTINGS[key] = '';
    logAuditEvent(`Removed ${key}`, 'Branding');
    toast(`${key[0].toUpperCase() + key.slice(1)} removed`);
  };

  // Form Save Handler matching prototype line 952
  const handleSave = () => {
    if (!company.name.trim()) {
      toast("Company name can't be empty.", true);
      return;
    }

    // Numbering tokens validation: {SEQ} or {SEQ\d}
    for (const k of ['quote', 'invoice', 'receipt', 'credit'] as const) {
      const v = numbering[k].trim();
      if (!/\{SEQ\d?\}/.test(v)) {
        toast(
          `The ${k} format needs a {SEQ} token so numbers stay unique.`,
          true
        );
        return;
      }
    }

    // Apply into persistent state objects
    Object.assign(COMPANY_SETTINGS, company);
    SYSTEM_SETTINGS.company = COMPANY_SETTINGS;
    SYSTEM_SETTINGS.currencies = currencies;
    SYSTEM_SETTINGS.defaultCurrency = defaultCurrency;
    SYSTEM_SETTINGS.numbering = numbering;
    SYSTEM_SETTINGS.taxes = taxes;
    SYSTEM_SETTINGS.quoteTerms = quoteTerms;
    SYSTEM_SETTINGS.invoiceTerms = invoiceTerms;

    updateCompanyMutation.mutate({
      name: company.name,
      tagline: company.tagline,
      address: company.address,
      phone: company.phone,
      email: company.email,
      website: company.website,
      tax_id: company.taxId,
      bank_name: company.bankName,
      account_name: company.accountName,
      account_no: company.accountNo,
      mobile_money: company.mobileMoney,
      signatory: company.signatory,
      logo: company.logo,
      stamp: company.stamp,
      signature: company.signature,
      quote_terms: quoteTerms,
      invoice_terms: invoiceTerms,
      default_currency: defaultCurrency,
    });

    logAuditEvent('Updated company settings', 'Settings');
  };

  // Prototype Data Reset Handler matching prototype line 1112
  const handleReset = async () => {
    const confirmed = await confirmBox({
      title: 'Reset sample data?',
      text: 'Everything created in this browser is replaced with the original sample records.',
      ok: 'Reset',
      danger: true,
    });

    if (confirmed) {
      try {
        await resetSampleMutation.mutateAsync();
      } catch {
        // Fallback local reset
      }
      resetSampleData();
      setActiveTab('dashboard');
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Company &amp; settings</h1>
          <p>
            {activeSettingsTab === 'company' && 'These details print on every quotation, invoice and receipt.'}
            {activeSettingsTab === 'currencies' && 'Manage business currencies, exchange rates, and standard sales tax rates.'}
            {activeSettingsTab === 'numbering' && 'Configure automatic sequential numbering patterns and default document terms.'}
            {activeSettingsTab === 'team' && 'Manage organization staff members, assign roles, and issue team invites.'}
            {activeSettingsTab === 'templates' && 'Customize transactional notification email templates and preview layouts.'}
          </p>
        </div>
        {(activeSettingsTab === 'company' || activeSettingsTab === 'numbering') && (
          <div className="actions">
            <button
              type="button"
              className="btn primary"
              data-act="save-settings"
              onClick={handleSave}
            >
              Save settings
            </button>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className={activeSettingsTab === 'company' ? 'on' : ''}
          onClick={() => switchTab('company')}
        >
          Company profile
        </button>
        <button
          type="button"
          className={activeSettingsTab === 'currencies' ? 'on' : ''}
          onClick={() => switchTab('currencies')}
        >
          Currencies &amp; taxes
        </button>
        <button
          type="button"
          className={activeSettingsTab === 'numbering' ? 'on' : ''}
          onClick={() => switchTab('numbering')}
        >
          Numbering &amp; terms
        </button>
        {isAdmin && (
          <button
            type="button"
            className={activeSettingsTab === 'team' ? 'on' : ''}
            onClick={() => switchTab('team')}
          >
            Team &amp; staff
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            className={activeSettingsTab === 'templates' ? 'on' : ''}
            onClick={() => switchTab('templates')}
          >
            Email templates
          </button>
        )}
      </div>

      {/* Tab 1: Company Profile */}
      {activeSettingsTab === 'company' && (
        <>
          {/* 1. Company Profile Panel */}
          <section className="panel">
        <div className="panel-head">
          <h2>Company profile</h2>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sName">Company name *</label>
              <input
                id="sName"
                className="inp"
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, name: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="sTag">Tagline</label>
              <input
                id="sTag"
                className="inp"
                value={company.tagline}
                onChange={(e) =>
                  setCompany({ ...company, tagline: e.target.value })
                }
              />
            </div>
            <div className="field wide">
              <label htmlFor="sAddr">Business address</label>
              <input
                id="sAddr"
                className="inp"
                value={company.address}
                onChange={(e) =>
                  setCompany({ ...company, address: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="sPhone">Contact number</label>
              <input
                id="sPhone"
                className="inp"
                value={company.phone}
                onChange={(e) =>
                  setCompany({ ...company, phone: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="sEmail">Email</label>
              <input
                id="sEmail"
                className="inp"
                type="email"
                value={company.email}
                onChange={(e) =>
                  setCompany({ ...company, email: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="sWeb">Website</label>
              <input
                id="sWeb"
                className="inp"
                value={company.website}
                onChange={(e) =>
                  setCompany({ ...company, website: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="sTax">Tax registration (TIN)</label>
              <input
                id="sTax"
                className="inp"
                value={company.taxId}
                onChange={(e) =>
                  setCompany({ ...company, taxId: e.target.value })
                }
              />
              <span className="hint">Shown on documents when filled in</span>
            </div>
            <div className="field wide">
              <label htmlFor="sSigName">Signatory line</label>
              <input
                id="sSigName"
                className="inp"
                value={company.signatory}
                onChange={(e) =>
                  setCompany({ ...company, signatory: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Branding Assets Panel */}
      <section className="panel">
        <div className="panel-head">
          <h2>Branding</h2>
          <span className="sub">
            Images are stored in your browser for this prototype
          </span>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            {/* Logo */}
            <div className="field">
              <label>Logo</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 64,
                    border: '1px dashed var(--line-strong)',
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt="Logo preview"
                      style={{ maxHeight: 60, maxWidth: 116 }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, color: '#8b96a8' }}>None</span>
                  )}
                </div>
                <label className="btn sm" htmlFor="up_logo">
                  Upload
                </label>
                <input
                  type="file"
                  id="up_logo"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImageUpload('logo', e)}
                />
                {company.logo && (
                  <button
                    type="button"
                    className="btn sm ghost"
                    data-act="clear-img"
                    onClick={() => handleImageRemove('logo')}
                  >
                    Remove
                  </button>
                )}
              </div>
              <span className="hint">
                PNG with a transparent background prints best.
              </span>
            </div>

            {/* Stamp */}
            <div className="field">
              <label>Company stamp (optional)</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 64,
                    border: '1px dashed var(--line-strong)',
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  {company.stamp ? (
                    <img
                      src={company.stamp}
                      alt="Stamp preview"
                      style={{ maxHeight: 60, maxWidth: 116 }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, color: '#8b96a8' }}>None</span>
                  )}
                </div>
                <label className="btn sm" htmlFor="up_stamp">
                  Upload
                </label>
                <input
                  type="file"
                  id="up_stamp"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImageUpload('stamp', e)}
                />
                {company.stamp && (
                  <button
                    type="button"
                    className="btn sm ghost"
                    data-act="clear-img"
                    onClick={() => handleImageRemove('stamp')}
                  >
                    Remove
                  </button>
                )}
              </div>
              <span className="hint">Placed beside the signature line.</span>
            </div>

            {/* Signature */}
            <div className="field">
              <label>Authorized signature</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 64,
                    border: '1px dashed var(--line-strong)',
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  {company.signature ? (
                    <img
                      src={company.signature}
                      alt="Signature preview"
                      style={{ maxHeight: 60, maxWidth: 116 }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, color: '#8b96a8' }}>None</span>
                  )}
                </div>
                <label className="btn sm" htmlFor="up_signature">
                  Upload
                </label>
                <input
                  type="file"
                  id="up_signature"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImageUpload('signature', e)}
                />
                {company.signature && (
                  <button
                    type="button"
                    className="btn sm ghost"
                    data-act="clear-img"
                    onClick={() => handleImageRemove('signature')}
                  >
                    Remove
                  </button>
                )}
              </div>
              <span className="hint">
                A scan of the signature on white or transparent.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Payment Details Panel */}
      <section className="panel">
        <div className="panel-head">
          <h2>Payment details</h2>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sBank">Bank name</label>
              <input
                id="sBank"
                className="inp"
                value={company.bankName}
                onChange={(e) =>
                  setCompany({ ...company, bankName: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="sAccName">Account name</label>
              <input
                id="sAccName"
                className="inp"
                value={company.accountName}
                onChange={(e) =>
                  setCompany({ ...company, accountName: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="sAccNo">Account number</label>
              <input
                id="sAccNo"
                className="inp"
                value={company.accountNo}
                onChange={(e) =>
                  setCompany({ ...company, accountNo: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="sMM">Mobile money</label>
              <input
                id="sMM"
                className="inp"
                value={company.mobileMoney}
                onChange={(e) =>
                  setCompany({ ...company, mobileMoney: e.target.value })
                }
              />
              <span className="hint">e.g. EVC Plus, Sahal or Zaad number</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Prototype Data Panel */}
      <section className="panel">
        <div className="panel-head">
          <h2>Prototype data</h2>
        </div>
        <div
          className="panel-body"
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: 'var(--muted)', maxWidth: '60ch' }}>
            Everything you create is kept in this browser only. Reset to restore
            invoice 10456 and the sample records.
          </span>
          <button
            type="button"
            className="btn danger"
            data-act="reset"
            onClick={handleReset}
          >
            Reset sample data
          </button>
        </div>
      </section>
    </>
  )}

  {/* Tab 2: Currencies & Taxes */}
  {activeSettingsTab === 'currencies' && (
    <CurrencyTaxSettings
      currencies={currencies}
      defaultCurrency={defaultCurrency}
      taxes={taxes}
      onCurrenciesChange={setCurrencies}
      onDefaultCurrencyChange={setDefaultCurrency}
      onTaxesChange={setTaxes}
    />
  )}

  {/* Tab 3: Numbering & Terms */}
  {activeSettingsTab === 'numbering' && (
    <>
      {/* 5. Document Numbering Panel with Live Reactivity */}
      <section className="panel">
        <div className="panel-head">
          <h2>Document numbering</h2>
          <span className="sub">
            Tokens: &#123;SEQ&#125; &#123;SEQ4&#125; &#123;SEQ5&#125; &#123;YYYY&#125; &#123;YY&#125; &#123;MM&#125;
          </span>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            {(
              [
                ['quote', 'Quotations'],
                ['invoice', 'Invoices'],
                ['receipt', 'Receipts'],
                ['credit', 'Credit notes'],
              ] as const
            ).map(([k, label]) => {
              const pattern = numbering[k];
              const nextSeq = SYSTEM_SETTINGS.seq[k] + 1;
              const preview = fmtNumber(pattern, nextSeq, TODAY);

              return (
                <div key={k} className="field">
                  <label htmlFor={`n_${k}`}>{label}</label>
                  <input
                    id={`n_${k}`}
                    className="inp mono"
                    value={pattern}
                    data-num={k}
                    onChange={(e) =>
                      setNumbering({ ...numbering, [k]: e.target.value })
                    }
                  />
                  <span className="hint">
                    Next:{' '}
                    <b className="num" id={`nx_${k}`}>
                      {preview}
                    </b>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Default Terms Panel */}
      <section className="panel">
        <div className="panel-head">
          <h2>Default terms</h2>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sQT">Quotation terms &amp; conditions</label>
              <textarea
                id="sQT"
                className="inp"
                rows={4}
                value={quoteTerms}
                onChange={(e) => setQuoteTerms(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="sIT">Invoice payment instructions</label>
              <textarea
                id="sIT"
                className="inp"
                rows={4}
                value={invoiceTerms}
                onChange={(e) => setInvoiceTerms(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )}

  {/* Tab 4: Team & Staff Management (Admin only) */}
  {activeSettingsTab === 'team' && isAdmin && <TeamSettingsView />}

  {/* Tab 5: Transactional Email Templates (Admin only) */}
  {activeSettingsTab === 'templates' && isAdmin && <EmailTemplatesView />}
</>
);
};
