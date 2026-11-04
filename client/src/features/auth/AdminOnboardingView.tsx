import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { toast } from '../../store/useUIStore';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { OtpInput } from './OtpInput';

export type OnboardingStep =
  | 'STEP_1_ACCOUNT'
  | 'STEP_1_OTP'
  | 'STEP_2_COMPANY'
  | 'STEP_3_SUCCESS';

export const AdminOnboardingView: React.FC = () => {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const { setActiveTab } = useNavStore();

  // If user is already authenticated as admin but has not completed company onboarding, resume at Step 2
  const [step, setStep] = useState<OnboardingStep>(() => {
    if (isAuthenticated && user?.role === 'admin' && user.onboardingCompleted === false) {
      return 'STEP_2_COMPANY';
    }
    return 'STEP_1_ACCOUNT';
  });

  // Step 1: Account credentials
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+252 61');

  // Step 1.5: OTP Verification
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 2: Company & Ledger Setup
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('Bakara Howlwadag, Mogadishu');
  const [businessPhone, setBusinessPhone] = useState(phone || '+252 61');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'SOS'>('USD');
  const [taxId, setTaxId] = useState('');

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
    if (phone && (!businessPhone || businessPhone === '+252 61')) {
      setBusinessPhone(phone);
    }
  }, [phone]);

  // Handle Step 1: Submit Admin Signup
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid business email address');
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone && cleanPhone !== '+25261' && !/^\+[1-9]\d{6,14}$/.test(cleanPhone)) {
      setErrorMsg('Phone number must be E.164 formatted (e.g. +25261XXXXXXX)');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone && cleanPhone !== '+25261' ? cleanPhone : undefined,
      });

      if (res.data?.success) {
        toast('Verification code sent to your email');
        setStep('STEP_1_OTP');
        setOtp('');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed. Please verify your information.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 1.5: Verify Email OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/verify-email', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (res.data?.success && res.data.user) {
        const token = res.data.token;
        setUser(
          {
            ...res.data.user,
            onboardingCompleted: false,
          },
          token
        );
        toast('Email verified successfully!');
        setStep('STEP_2_COMPANY');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/request-otp', {
        target: email.trim().toLowerCase(),
        channel: 'email',
        purpose: 'verification',
      });
      if (res.data?.success) {
        toast('New verification code sent');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Initialize Company & Ledger
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyName.trim()) {
      setErrorMsg('Company legal name is required');
      return;
    }

    if (!companyAddress.trim()) {
      setErrorMsg('Physical office address is required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/settings/onboard-company', {
        name: companyName.trim(),
        address: companyAddress.trim(),
        phone: businessPhone.trim().replace(/\s+/g, '') || phone.trim().replace(/\s+/g, ''),
        default_currency: baseCurrency,
        tax_id: taxId.trim() || undefined,
      });

      if (res.data?.success) {
        // Update user state to mark onboarding completed
        setUser({ onboardingCompleted: true, companyName: companyName.trim() });
        setStep('STEP_3_SUCCESS');

        // Automatically route to /dashboard after 1.5 seconds
        setTimeout(() => {
          setActiveTab('dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save company settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        {/* ========================================================================= */}
        {/* STATE 1: ADMIN ACCOUNT SETUP                                              */}
        {/* ========================================================================= */}
        {step === 'STEP_1_ACCOUNT' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(110, 156, 240, 0.12)',
                  border: '1px solid rgba(110, 156, 240, 0.25)',
                  color: '#6E9CF0',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  letterSpacing: '0.3px',
                }}
              >
                Step 1 of 2
              </div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#E5EAF2',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.3px',
                }}
              >
                Admin Account Setup
              </h1>
              <p style={{ fontSize: '13px', color: '#8C9BAE', margin: 0, lineHeight: 1.4 }}>
                Create your primary administrator credentials to launch your ledger.
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

            <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Full Name <span style={{ color: '#F07A70' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mohamed Aweys"
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
                  placeholder="admin@company.com"
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
                <input
                  type="tel"
                  placeholder="+252 61 4 324 507"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    color: '#E5EAF2',
                    fontSize: '13.5px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6F7B90', marginTop: '4px', display: 'block' }}>
                  Used for dual-rail SMS verification and emergency account recovery.
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
                  onClick={() => setActiveTab('login')}
                  style={{
                    backgroundColor: 'transparent',
                    border: 0,
                    color: '#8C9BAE',
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Already have an account? <span style={{ color: '#6E9CF0', textDecoration: 'underline' }}>Sign In</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    border: 0,
                    borderRadius: '8px',
                    padding: '11px 24px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? 'Creating...' : 'Continue'}
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
        {/* STATE 1.5: EMAIL OTP VERIFICATION                                         */}
        {/* ========================================================================= */}
        {step === 'STEP_1_OTP' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(110, 156, 240, 0.12)',
                  border: '1px solid rgba(110, 156, 240, 0.25)',
                  color: '#6E9CF0',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  letterSpacing: '0.3px',
                }}
              >
                Step 1 of 2 • Email Verification
              </div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#E5EAF2',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.3px',
                }}
              >
                Verify Email Address
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

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setErrorMsg('');
                }}
                disabled={loading}
                autoFocus
              />

              <div style={{ textAlign: 'center' }}>
                {resendCooldown > 0 ? (
                  <span style={{ fontSize: '12.5px', color: '#6F7B90' }}>
                    Resend code in <b style={{ color: '#E5EAF2' }}>{resendCooldown}s</b>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: '#6E9CF0',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Didn't receive the email? Resend Code
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
                  onClick={() => setStep('STEP_1_ACCOUNT')}
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
                  ← Edit email
                </button>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    border: 0,
                    borderRadius: '8px',
                    padding: '11px 24px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                    opacity: loading || otp.length !== 6 ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: BUSINESS & LEDGER PROFILE SETUP                                  */}
        {/* ========================================================================= */}
        {step === 'STEP_2_COMPANY' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(92, 197, 140, 0.12)',
                  border: '1px solid rgba(92, 197, 140, 0.25)',
                  color: '#5CC58C',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  letterSpacing: '0.3px',
                }}
              >
                Step 2 of 2
              </div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#E5EAF2',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.3px',
                }}
              >
                Company &amp; Ledger Profile
              </h1>
              <p style={{ fontSize: '13px', color: '#8C9BAE', margin: 0, lineHeight: 1.4 }}>
                Configure your business legal identity and default document currency.
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
                  placeholder="e.g. Hormuud Telecom / Safe Tech Logistics"
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
                  placeholder="e.g. Bakara Howlwadag, Mogadishu, Somalia"
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
                  <input
                    type="tel"
                    placeholder="+252 61..."
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
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
                  placeholder="Optional (e.g. SO-TIN-889021)"
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
                  justifyContent: 'flex-end',
                  marginTop: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #243042',
                }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    border: 0,
                    borderRadius: '8px',
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  }}
                >
                  {loading ? 'Initializing Ledger...' : 'Initialize Ledger & Launch'}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 3: IN-PLACE SUCCESS CELEBRATION                                     */}
        {/* ========================================================================= */}
        {step === 'STEP_3_SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
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
                margin: '0 0 10px 0',
                letterSpacing: '-0.3px',
              }}
            >
              Company Registered &amp; Ledger Ready!
            </h1>

            <p style={{ fontSize: '14px', color: '#8C9BAE', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Your business entity <b style={{ color: '#E5EAF2' }}>{companyName}</b> has been initialized.
              Redirecting you to your workspace...
            </p>

            <div
              style={{
                width: '160px',
                height: '4px',
                backgroundColor: '#1E293B',
                borderRadius: '2px',
                margin: '0 auto',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#5CC58C',
                  borderRadius: '2px',
                  animation: 'pulse 1.2s infinite ease-in-out',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

