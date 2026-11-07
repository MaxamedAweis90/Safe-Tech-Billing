import React, { useState, useEffect, useRef } from 'react';
import {
  useEmailTemplates,
  useUpdateEmailTemplate,
  useSendTestEmail,
  useResetEmailTemplate,
} from '../../hooks/useEmailTemplates';
import { useAuthStore } from '../../store/useAuthStore';
import { useCompanySettings } from '../../hooks/useSettings';
import { confirmBox, toast } from '../../store/useUIStore';

interface TemplateGroup {
  category: 'System' | 'Business';
  items: {
    slug: string;
    title: string;
    description: string;
  }[];
}

const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    category: 'System',
    items: [
      {
        slug: 'verify_email',
        title: 'Email Verification & Signup OTP',
        description: 'Authentication security code sent during registration and login.',
      },
      {
        slug: 'welcome_signup',
        title: 'Welcome & Account Activated',
        description: 'Onboarding welcome message sent after account verification.',
      },
    ],
  },
  {
    category: 'Business',
    items: [
      {
        slug: 'staff_invite',
        title: 'Staff Team Invitation',
        description: 'Staff onboarding dispatch containing cryptographic setup link.',
      },
      {
        slug: 'invoice_shared',
        title: 'Customer Invoice Notification',
        description: 'Customer notification with amount payable and banking lines.',
      },
      {
        slug: 'receipt_shared',
        title: 'Customer Payment Receipt',
        description: 'Official settlement receipt acknowledging received funds.',
      },
    ],
  },
];

const DUMMY_INTERPOLATION: Record<string, string> = {
  otp_code: '482910',
  company_name: 'Safe Tech Solutions',
  user_name: 'John Doe',
  inviter_name: 'John Doe',
  role_name: 'Accountant',
  role_label: 'ACCOUNTANT',
  invite_url: 'http://localhost:5173/#accept-invite?token=sample_token_xyz',
  login_url: 'http://localhost:5173/#login',
  invoice_number: 'INV-2026-0042',
  invoice_date: '2026-11-04',
  amount_due: '$1,250.00',
  receipt_number: 'RC-2026-0018',
  amount_paid: '$1,250.00',
  view_url: 'http://localhost:5173/#invoices',
  bank_name: 'Premier Bank',
  account_no: '010204982001',
  account_name: 'Safe Tech Solutions LLC',
  mobile_money: 'EVC Plus: +252 61 000 0000',
  company_phone: '+252 61 000 0000',
  company_email: 'billing@safetech.so',
};

export const EmailTemplatesView: React.FC = () => {
  const { data: templates = [], isLoading } = useEmailTemplates();
  const updateMutation = useUpdateEmailTemplate();
  const sendTestMutation = useSendTestEmail();
  const resetMutation = useResetEmailTemplate();

  const { user } = useAuthStore();
  const { data: companyData } = useCompanySettings();

  const [selectedSlug, setSelectedSlug] = useState<string>('verify_email');
  const [subject, setSubject] = useState<string>('');
  const [htmlBody, setHtmlBody] = useState<string>('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [destinationEmail, setDestinationEmail] = useState(user?.email || '');

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedTemplate = templates.find((t) => t.slug === selectedSlug);

  // Sync state when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      setSubject(selectedTemplate.subject);
      setHtmlBody(selectedTemplate.htmlBody);
    }
  }, [selectedTemplate]);

  // Insert variable tag into subject or body
  const handleInsertVariable = (variable: string) => {
    const tag = `{{${variable}}}`;
    setSubject((prev) => `${prev} ${tag}`);
    toast(`Inserted ${tag} into subject`);
  };

  const handleSave = () => {
    if (!subject.trim() || !htmlBody.trim()) {
      toast('Subject and HTML body cannot be empty', true);
      return;
    }

    updateMutation.mutate({
      slug: selectedSlug,
      subject,
      htmlBody,
    });
  };

  const handleResetToDefault = async () => {
    const confirmed = await confirmBox({
      title: 'Reset template to default?',
      text: `Are you sure you want to revert "${selectedSlug}" back to factory seed text? Custom changes will be replaced.`,
      ok: 'Reset',
      danger: true,
    });

    if (confirmed) {
      resetMutation.mutate(selectedSlug);
    }
  };

  const handleSendTest = async () => {
    if (!destinationEmail.trim()) {
      toast('Please enter a valid destination email address', true);
      return;
    }

    await sendTestMutation.mutateAsync({
      slug: selectedSlug,
      destinationEmail: destinationEmail.trim(),
    });
    setTestEmailModalOpen(false);
  };

  // Compile preview HTML with dummy values
  const getCompiledPreview = (): string => {
    let compiled = htmlBody;
    const companyName = companyData?.company?.name || user?.companyName || 'My Business';
    const mergedVars = { ...DUMMY_INTERPOLATION, company_name: companyName };

    for (const [k, v] of Object.entries(mergedVars)) {
      const reg = new RegExp(`{{${k}}}`, 'g');
      compiled = compiled.replace(reg, v);
    }
    return compiled;
  };

  const category =
    selectedSlug === 'verify_email' || selectedSlug === 'welcome_signup'
      ? 'System'
      : 'Business';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#E5EAF2' }}>
          Transactional Email Templates
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9AA6BA' }}>
          Customize transactional email copy, inspect real-time HTML previews, and test live SMTP dispatch.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: Template Selector List */}
        <div
          style={{
            backgroundColor: '#151C27',
            border: '1px solid #243042',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#6F7B90',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            TEMPLATE CATALOG
          </div>

          {isLoading ? (
            <div style={{ padding: '16px', fontSize: '13px', color: '#9AA6BA' }}>
              Loading templates...
            </div>
          ) : (
            TEMPLATE_GROUPS.map((group) => (
              <div key={group.category} style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: group.category === 'System' ? '#6E9CF0' : '#5CC58C',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{group.category} Notifications</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {group.items.map((item) => {
                    const isSelected = selectedSlug === item.slug;
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => {
                          setSelectedSlug(item.slug);
                          setViewMode('edit');
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '8px 10px',
                          border: 0,
                          borderRadius: '6px',
                          backgroundColor: isSelected ? '#18273F' : 'transparent',
                          color: isSelected ? '#6E9CF0' : '#9AA6BA',
                          fontWeight: isSelected ? 600 : 400,
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s ease',
                        }}
                      >
                        <div style={{ color: isSelected ? '#E5EAF2' : '#9AA6BA', fontWeight: 600 }}>
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: isSelected ? '#6E9CF0' : '#6F7B90',
                            marginTop: '2px',
                          }}
                        >
                          {item.slug}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Template Editor & Preview Panel */}
        <div
          style={{
            backgroundColor: '#151C27',
            border: '1px solid #243042',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          {/* Panel Top Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '16px',
              borderBottom: '1px solid #243042',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#E5EAF2' }}>
                  {selectedTemplate?.name || selectedSlug}
                </h3>
                <span className={`chip ${category === 'System' ? 'c-blue' : 'c-teal'}`}>
                  {category}
                </span>
                <span className="mono" style={{ fontSize: '12px', color: '#6F7B90' }}>
                  slug: {selectedSlug}
                </span>
              </div>
            </div>

            {/* View Mode Toggle & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="seg">
                <button
                  type="button"
                  className={viewMode === 'edit' ? 'on' : ''}
                  onClick={() => setViewMode('edit')}
                >
                  Edit Code
                </button>
                <button
                  type="button"
                  className={viewMode === 'preview' ? 'on' : ''}
                  onClick={() => setViewMode('preview')}
                >
                  Live Preview
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={resetMutation.isPending}
                className="btn sm"
                title="Revert to factory default template"
              >
                Reset Default
              </button>

              <button
                type="button"
                onClick={() => setTestEmailModalOpen(true)}
                className="btn sm"
                style={{ backgroundColor: '#18273F', color: '#6E9CF0', borderColor: '#243042' }}
              >
                Send Test
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="btn primary sm"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Test Email Destination Prompt Modal */}
          {testEmailModalOpen && (
            <div
              style={{
                backgroundColor: '#0D121A',
                border: '1px solid #243042',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="destEmail"
                  style={{ display: 'block', fontSize: '12px', color: '#9AA6BA', marginBottom: '4px' }}
                >
                  Dispatch Live SMTP Test Email to:
                </label>
                <input
                  id="destEmail"
                  type="email"
                  value={destinationEmail}
                  onChange={(e) => setDestinationEmail(e.target.value)}
                  placeholder="admin@safetech.so"
                  style={{
                    width: '100%',
                    height: '36px',
                    backgroundColor: '#151C27',
                    border: '1px solid #243042',
                    borderRadius: '5px',
                    color: '#E5EAF2',
                    padding: '0 10px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={sendTestMutation.isPending}
                className="btn primary sm"
                style={{ marginTop: '18px' }}
              >
                {sendTestMutation.isPending ? 'Sending...' : 'Send Live Test'}
              </button>
              <button
                type="button"
                onClick={() => setTestEmailModalOpen(false)}
                className="btn sm"
                style={{ marginTop: '18px' }}
              >
                Cancel
              </button>
            </div>
          )}

          {viewMode === 'edit' ? (
            <div>
              {/* Subject Input */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="templateSubject"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#9AA6BA',
                    marginBottom: '6px',
                  }}
                >
                  Email Subject Line
                </label>
                <input
                  id="templateSubject"
                  ref={subjectInputRef}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line with {{variables}}..."
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    borderRadius: '6px',
                    color: '#E5EAF2',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />

                {/* Available Variables Badge Chips */}
                {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#6F7B90' }}>Click to insert variable:</span>
                    {selectedTemplate.variables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => handleInsertVariable(variable)}
                        style={{
                          background: '#0D121A',
                          border: '1px solid #243042',
                          borderRadius: '4px',
                          color: '#6E9CF0',
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '11px',
                          padding: '2px 6px',
                          cursor: 'pointer',
                        }}
                        title={`Click to append {{${variable}}}`}
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Body Code Editor */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="templateBody"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#9AA6BA',
                    marginBottom: '6px',
                  }}
                >
                  HTML Template Body
                </label>
                <textarea
                  id="templateBody"
                  ref={bodyTextareaRef}
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  rows={20}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    borderRadius: '6px',
                    color: '#B9C5DA',
                    fontFamily: "'IBM Plex Mono', Menlo, Consolas, monospace",
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          ) : (
            /* Live Real-Time Email Preview Drawer */
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontSize: '12.5px', color: '#9AA6BA' }}>
                  Rendering live email preview with mock business interpolation:
                </div>

                <div className="seg">
                  <button
                    type="button"
                    className={previewDevice === 'desktop' ? 'on' : ''}
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    Desktop (600px)
                  </button>
                  <button
                    type="button"
                    className={previewDevice === 'mobile' ? 'on' : ''}
                    onClick={() => setPreviewDevice('mobile')}
                  >
                    Mobile (375px)
                  </button>
                </div>
              </div>

              {/* Iframe Preview Container */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  backgroundColor: '#0D121A',
                  border: '1px solid #243042',
                  borderRadius: '8px',
                  padding: '24px 12px',
                  overflowX: 'auto',
                }}
              >
                <iframe
                  title="Email Live Preview"
                  srcDoc={getCompiledPreview()}
                  style={{
                    width: previewDevice === 'desktop' ? '640px' : '390px',
                    height: '680px',
                    border: '1px solid #243042',
                    borderRadius: '8px',
                    backgroundColor: '#0D121A',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
