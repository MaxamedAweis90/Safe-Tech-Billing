import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { toast } from '../../store/useUIStore';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { OtpInput } from './OtpInput';

export type WizardStep = 'CREDENTIALS' | 'COMPANY' | 'OTP' | 'SUCCESS';
export type OnboardingStep = WizardStep;

export interface AdminOnboardingViewProps {
  onSwitchMode?: (mode: 'login' | 'register') => void;
  embedded?: boolean;
}

/**
 * Clean Stepper Indicator matching the user specification:
 * Numbered circular nodes connected by horizontal lines.
 * Completed steps show a checkmark (✓); active step is filled; pending is outlined.
 * Single coherent accent blue without distracting color palettes or glow slop.
 */
const Stepper: React.FC<{ currentStep: 1 | 2 | 3 }> = ({ currentStep }) => {
  const steps = [1, 2, 3];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '220px' }}>
        {steps.map((num, idx) => {
          const isCompleted = currentStep > num;
          const isActive = currentStep === num;

          return (
            <React.Fragment key={num}>
              {/* Step Circle Node */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: 'all 200ms ease',
                  backgroundColor: isActive ? '#3B82F6' : '#151C27',
                  border: '2px solid #3B82F6',
                  color: isActive ? '#FFFFFF' : '#3B82F6',
                }}
              >
                {isCompleted ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  num
                )}
              </div>

              {/* Connecting Line */}
              {idx < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: '#3B82F6',
                    transition: 'background-color 200ms ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Administrator Onboarding Flow (Zero-State Registration Architecture):
 * 1. Step 1 (CREDENTIALS): Admin Personal Credentials (in memory, zero DB writes).
 * 2. Step 2 (COMPANY): Company & Ledger Profile (in memory, zero DB writes).
 * 3. Step 3 (OTP): Final Gate verification. Calls complete-registration to atomically
 *    create both User and Company in MongoDB.
 * 4. Step 4 (SUCCESS): In-place morphing celebration screen welcoming the company.
 */
export const AdminOnboardingView: React.FC<AdminOnboardingViewProps> = ({
  onSwitchMode,
  embedded = false,
}) => {
  const { user, setUser } = useAuthStore();
  const { setActiveTab } = useNavStore();

  // Wizard Step state machine
  const [step, setStep] = useState<WizardStep>('CREDENTIALS');

  // Step 1: Admin Personal Credentials (in memory)
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  // Step 2: Company & Ledger Profile (in memory)
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'SOS'>('USD');
  const [taxId, setTaxId] = useState('');

  // Step 3: OTP Verification
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Keep business phone synced with admin phone if untouched
  useEffect(() => {
    if (phone && !businessPhone) {
      setBusinessPhone(phone);
    }
  }, [phone]);

  // Handle Step 1: Admin Personal Credentials (Pure Client-side validation, zero DB writes)
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full legal name');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid business email address');
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits && (cleanDigits.length < 7 || cleanDigits.length > 9)) {
      setErrorMsg('Phone number must be between 7 and 9 digits');
      return;
    }

    if (!businessPhone) {
      setBusinessPhone(phone);
    }

    setStep('COMPANY');
  };

  // Handle Step 2: Company & Ledger Profile -> Dispatches staged registration OTP
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyName.trim()) {
      setErrorMsg('Company legal entity name is required');
      return;
    }

    if (!companyAddress.trim()) {
      setErrorMsg('Physical office address is required');
      return;
    }

    const cleanAdminPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanAdminPhone ? `+252${cleanAdminPhone}` : undefined;

    setLoading(true);
    try {
      // Dispatch verification code to email (zero early User/Company DB creation)
      const res = await api.post('/auth/request-registration-otp', {
        email: email.trim().toLowerCase(),
        phone: fullPhone,
      });

      if (res.data?.success) {
        toast('Verification code dispatched to your email');
        setStep('OTP');
        setOtp('');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not dispatch verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP in Step 3
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const cleanAdminPhone = phone.replace(/\D/g, '');
      const fullPhone = cleanAdminPhone ? `+252${cleanAdminPhone}` : undefined;

      const res = await api.post('/auth/request-registration-otp', {
        email: email.trim().toLowerCase(),
        phone: fullPhone,
      });
      if (res.data?.success) {
        toast('New registration code dispatched');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3: Final Verification Gate & Atomic Creation
  const handleVerifyAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const cleanAdminPhone = phone.replace(/\D/g, '');
      const fullAdminPhone = cleanAdminPhone ? `+252${cleanAdminPhone}` : undefined;

      const cleanCompanyPhone = (businessPhone || phone).replace(/\D/g, '');
      const fullCompanyPhone = cleanCompanyPhone ? `+252${cleanCompanyPhone}` : fullAdminPhone;

      // Atomically verify OTP and create User + Company records in MongoDB
      const res = await api.post('/auth/complete-registration', {
        otp: otp.trim(),
        admin: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: fullAdminPhone,
        },
        company: {
          name: companyName.trim(),
          address: companyAddress.trim(),
          phone: fullCompanyPhone || fullAdminPhone,
          currency: baseCurrency,
          taxNumber: taxId.trim() || undefined,
        },
      });

      if (res.data?.success && res.data.user) {
        const token = res.data.token;
        setUser(
          {
            ...res.data.user,
            companyName: companyName.trim(),
            onboardingCompleted: true,
            isVerified: true,
          },
          token
        );

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('safetech_just_onboarded', 'true');
        }

        toast('Enterprise ledger successfully initialized!');
        setStep('SUCCESS');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle Open Dashboard from In-Place Success Celebration Screen
  const handleOpenDashboard = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('safetech_just_onboarded');
      window.location.hash = '#dashboard';
    }
    setActiveTab('dashboard');
  };

  const content = (
    <div style={{ width: '100%' }}>
      {/* ========================================================================= */}
      {/* STEP 1: ADMIN PERSONAL CREDENTIALS (ZERO DB WRITES)                       */}
      {/* ========================================================================= */}
      {step === 'CREDENTIALS' && (
        <div style={{ transition: 'all 400ms ease' }}>
          {/* Stepper Node Style */}
          <Stepper currentStep={1} />

          <div style={{ marginBottom: '20px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#E5EAF2',
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px',
              }}
            >
              Admin Account Credentials
            </h1>
            <p style={{ fontSize: '13px', color: '#8C9BAE', margin: 0, lineHeight: 1.4 }}>
              Enter your administrative credentials to begin enterprise onboarding.
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(240, 122, 112, 0.12)',
                border: '1px solid rgba(240, 122, 112, 0.3)',
                borderRadius: '6px',
                color: '#F07A70',
                fontSize: '12.5px',
                marginBottom: '18px',
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                Full Name <span style={{ color: '#F07A70' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0D121A',
                  border: '1px solid #243042',
                  color: '#E5EAF2',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                Business Email <span style={{ color: '#F07A70' }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0D121A',
                  border: '1px solid #243042',
                  color: '#E5EAF2',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                Mobile Phone Number
              </label>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 14px',
                    backgroundColor: '#151C27',
                    border: '1px solid #243042',
                    borderRight: '0',
                    borderRadius: '8px 0 0 8px',
                    color: '#B9C5DA',
                    fontSize: '13.5px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 600,
                    userSelect: 'none',
                  }}
                >
                  +252
                </div>
                <input
                  type="tel"
                  placeholder="xxxxxxxxx"
                  value={phone}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const stripped = raw.startsWith('252') ? raw.slice(3) : raw;
                    setPhone(stripped.slice(0, 9));
                  }}
                  style={{
                    flex: 1,
                    padding: '11px 14px',
                    borderRadius: '0 8px 8px 0',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    color: '#E5EAF2',
                    fontSize: '13.5px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#6F7B90', marginTop: '4px', display: 'block' }}>
                Enter your 7 to 9 digit local phone number.
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #243042',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (onSwitchMode) {
                    onSwitchMode('login');
                  } else {
                    setActiveTab('login');
                  }
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 0,
                  color: '#8C9BAE',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Already have an account? <span style={{ color: '#6E9CF0', textDecoration: 'underline' }}>Sign in</span>
              </button>

              <button
                type="submit"
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 0,
                  borderRadius: '8px',
                  padding: '11px 24px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                }}
              >
                Continue to Company Setup
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: COMPANY & LEDGER PROFILE (IN MEMORY SETUP)                        */}
      {/* ========================================================================= */}
      {step === 'COMPANY' && (
        <div style={{ transition: 'all 400ms ease' }}>
          {/* Stepper Node Style */}
          <Stepper currentStep={2} />

          <div style={{ marginBottom: '20px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#E5EAF2',
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px',
              }}
            >
              Company &amp; Ledger Profile
            </h1>
            <p style={{ fontSize: '13px', color: '#8C9BAE', margin: 0, lineHeight: 1.4 }}>
              Configure your corporate legal identity and primary document currency.
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(240, 122, 112, 0.12)',
                border: '1px solid rgba(240, 122, 112, 0.3)',
                borderRadius: '6px',
                color: '#F07A70',
                fontSize: '12.5px',
                marginBottom: '18px',
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCompanySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                Company Legal Name <span style={{ color: '#F07A70' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0D121A',
                  border: '1px solid #243042',
                  color: '#E5EAF2',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                Physical Office Address <span style={{ color: '#F07A70' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="123 Business Way, Suite 400"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0D121A',
                  border: '1px solid #243042',
                  color: '#E5EAF2',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Official Phone
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 12px',
                      backgroundColor: '#151C27',
                      border: '1px solid #243042',
                      borderRight: '0',
                      borderRadius: '8px 0 0 8px',
                      color: '#B9C5DA',
                      fontSize: '13px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 600,
                      userSelect: 'none',
                    }}
                  >
                    +252
                  </div>
                  <input
                    type="tel"
                    placeholder="xxxxxxxxx"
                    value={businessPhone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const stripped = raw.startsWith('252') ? raw.slice(3) : raw;
                      setBusinessPhone(stripped.slice(0, 9));
                    }}
                    style={{
                      flex: 1,
                      padding: '11px 12px',
                      borderRadius: '0 8px 8px 0',
                      backgroundColor: '#0D121A',
                      border: '1px solid #243042',
                      color: '#E5EAF2',
                      fontSize: '13px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Base Currency
                </label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value as 'USD' | 'SOS')}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    color: '#E5EAF2',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="SOS">SOS (Sh.So.)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                Tax Identification Number (TIN)
              </label>
              <input
                type="text"
                placeholder="Optional (e.g. TAX-0012345)"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0D121A',
                  border: '1px solid #243042',
                  color: '#E5EAF2',
                  fontSize: '13px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #243042',
              }}
            >
              <button
                type="button"
                onClick={() => setStep('CREDENTIALS')}
                disabled={loading}
                style={{
                  backgroundColor: 'transparent',
                  border: 0,
                  color: '#8C9BAE',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ← Back to Credentials
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 0,
                  borderRadius: '8px',
                  padding: '12px 26px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                }}
              >
                {loading ? 'Dispatching Code...' : 'Proceed to Verification'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: FINAL VERIFICATION GATE (EMAIL OTP)                               */}
      {/* ========================================================================= */}
      {step === 'OTP' && (
        <div style={{ transition: 'all 400ms ease' }}>
          {/* Stepper Node Style */}
          <Stepper currentStep={3} />

          <div style={{ marginBottom: '20px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#E5EAF2',
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px',
              }}
            >
              Verify Email &amp; Launch Ledger
            </h1>
            <p style={{ fontSize: '13px', color: '#8C9BAE', margin: 0, lineHeight: 1.4 }}>
              Enter the 6-digit confirmation code dispatched to{' '}
              <b style={{ color: '#E5EAF2' }}>{email}</b>.
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(240, 122, 112, 0.12)',
                border: '1px solid rgba(240, 122, 112, 0.3)',
                borderRadius: '6px',
                color: '#F07A70',
                fontSize: '12.5px',
                marginBottom: '18px',
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleVerifyAndLaunch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
              <OtpInput
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={loading}
              />
            </div>

            <div style={{ textAlign: 'center', fontSize: '12.5px', color: '#8C9BAE' }}>
              {resendCooldown > 0 ? (
                <span>
                  Resend code in <b style={{ color: '#E5EAF2' }}>{resendCooldown}s</b>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    backgroundColor: 'transparent',
                    border: 0,
                    color: '#6E9CF0',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '12.5px',
                  }}
                >
                  Resend verification code
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #243042',
              }}
            >
              <button
                type="button"
                onClick={() => setStep('COMPANY')}
                disabled={loading}
                style={{
                  backgroundColor: 'transparent',
                  border: 0,
                  color: '#8C9BAE',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ← Back to Company
              </button>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 0,
                  borderRadius: '8px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                  opacity: loading || otp.length !== 6 ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                }}
              >
                {loading ? 'Verifying & Initializing...' : 'Verify & Launch Enterprise Ledger'}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: IN-PLACE MORPHING SUCCESS CELEBRATION                             */}
      {/* ========================================================================= */}
      {step === 'SUCCESS' && (
        <div
          style={{
            textAlign: 'center',
            padding: '24px 8px',
            animation: 'fadeIn 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Clean Success Emblem */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(92, 197, 140, 0.15)',
              border: '2px solid #5CC58C',
              color: '#5CC58C',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 0 24px rgba(92, 197, 140, 0.35)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#E5EAF2',
              margin: '0 0 8px 0',
              letterSpacing: '-0.3px',
            }}
          >
            Welcome, {companyName || 'Acme Corporation'}!
          </h1>

          <p style={{ fontSize: '13.5px', color: '#8C9BAE', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Your enterprise billing engine and <b style={{ color: '#E5EAF2' }}>{baseCurrency}</b> multi-currency ledger are ready for operations.
          </p>

          {/* Provisioned Specs Summary Card */}
          <div
            style={{
              backgroundColor: '#0D121A',
              border: '1px solid #243042',
              borderRadius: '10px',
              padding: '16px 20px',
              textAlign: 'left',
              marginBottom: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: '#6F7B90' }}>Corporate Entity:</span>
              <span style={{ color: '#E5EAF2', fontWeight: 600 }}>{companyName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: '#6F7B90' }}>Headquarters:</span>
              <span style={{ color: '#B9C5DA' }}>{companyAddress}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: '#6F7B90' }}>Base Currency:</span>
              <span style={{ color: '#6E9CF0', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{baseCurrency}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: '#6F7B90' }}>Signatory Admin:</span>
              <span style={{ color: '#B9C5DA' }}>{fullName} ({email})</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenDashboard}
            style={{
              width: '100%',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 0,
              borderRadius: '8px',
              padding: '13px 28px',
              fontSize: '14.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 18px rgba(59, 130, 246, 0.45)',
              transition: 'all 200ms ease',
            }}
          >
            Open Dashboard →
          </button>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <AuthLayout mode="register" onModeChange={onSwitchMode}>
      {content}
    </AuthLayout>
  );
};

export default AdminOnboardingView;
