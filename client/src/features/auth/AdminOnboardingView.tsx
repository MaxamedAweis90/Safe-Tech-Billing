import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  onStepChange?: (step: WizardStep) => void;
  onSuccess?: () => void;
  googleData?: { email: string; name: string } | null;
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '240px' }}>
        {steps.map((num, idx) => {
          const isCompleted = currentStep > num;
          const isActive = currentStep === num;

          return (
            <React.Fragment key={num}>
              {/* Step Circle Node */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: 'all 250ms ease',
                  backgroundColor: isActive ? '#2563EB' : '#151C27',
                  border: '2px solid #2563EB',
                  color: isActive ? '#FFFFFF' : '#2563EB',
                }}
              >
                {isCompleted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
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
                    height: '2.5px',
                    backgroundColor: '#2563EB',
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
  onStepChange,
  onSuccess,
  googleData,
}) => {
  const { user, setUser } = useAuthStore();
  const { setActiveTab } = useNavStore();
  const navigate = useNavigate();

  // Wizard Step state machine
  const [step, setStep] = useState<WizardStep>('CREDENTIALS');

  // Notify parent of step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
    if (step === 'SUCCESS' && onSuccess) {
      onSuccess();
    }
  }, [step, onStepChange, onSuccess]);

  // Step 1: Admin Personal Credentials (in memory)
  const [fullName, setFullName] = useState(googleData?.name || user?.fullName || '');
  const [email, setEmail] = useState(googleData?.email || user?.email || '');
  const [phone, setPhone] = useState('');

  // Sync Google verified credentials reactively
  useEffect(() => {
    if (googleData?.email) {
      setEmail(googleData.email);
      if (googleData.name) {
        setFullName(googleData.name);
      }
    }
  }, [googleData]);

  // Step 2: Company & Ledger Profile (in memory)
  const [companyName, setCompanyName] = useState('');
  const [companyTagline, setCompanyTagline] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
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

  // Check for Google Onboarding query params: ?email=...&name=...&from=google
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromParam = params.get('from');
      const emailParam = params.get('email');
      const nameParam = params.get('name');

      if (fromParam === 'google') {
        if (emailParam && !email) setEmail(emailParam);
        if (nameParam && !fullName) setFullName(nameParam);
      }
    }
  }, []);

  const isGoogleOnboarding = Boolean(googleData?.email) || (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('from') === 'google'
  );

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
          tagline: companyTagline.trim() || undefined,
          address: companyAddress.trim(),
          phone: fullAdminPhone || '+252610000000',
          website: companyWebsite.trim() || undefined,
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
    }
    navigate('/dashboard', { replace: true });
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

          {/* Google Onboarding Verified Advisory Banner */}
          {isGoogleOnboarding && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '8px',
                marginBottom: '18px',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#E5EAF2', marginBottom: '2px' }}>
                  Google Account Verified: {email}
                </div>
                <div style={{ fontSize: '12px', color: '#8C9BAE', lineHeight: 1.4 }}>
                  No registered organization was found for this Google email. Complete your administrator details below to initialize your enterprise ledger.
                </div>
              </div>
            </div>
          )}

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Business Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Technology & Logistics"
                  value={companyTagline}
                  onChange={(e) => setCompanyTagline(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    color: '#E5EAF2',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Corporate Website
                </label>
                <input
                  type="text"
                  placeholder="https://company.so"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    color: '#E5EAF2',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
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
            padding: '32px 16px',
            maxWidth: '520px',
            width: '100%',
            margin: '0 auto',
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
            {companyTagline && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#6F7B90' }}>Tagline:</span>
                <span style={{ color: '#B9C5DA', fontStyle: 'italic' }}>{companyTagline}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: '#6F7B90' }}>Headquarters:</span>
              <span style={{ color: '#B9C5DA' }}>{companyAddress}</span>
            </div>
            {companyWebsite && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#6F7B90' }}>Website:</span>
                <span style={{ color: '#6E9CF0' }}>{companyWebsite}</span>
              </div>
            )}
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
    <AuthLayout mode="register" onModeChange={onSwitchMode} isSuccess={step === 'SUCCESS'}>
      {content}
    </AuthLayout>
  );
};

export default AdminOnboardingView;
