import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { toast } from '../../store/useUIStore';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { OtpInput } from './OtpInput';

type LoginChannel = 'email' | 'sms';

export const LoginView: React.FC = () => {
  const [channel, setChannel] = useState<LoginChannel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+252 61');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const { setUser } = useAuthStore();
  const { setActiveTab } = useNavStore();

  const currentTarget = channel === 'email' ? email.trim() : phone.trim().replace(/\s+/g, '');

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (channel === 'email') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMsg('Please enter a valid business email address');
        return;
      }
    } else {
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      if (!cleanPhone || !/^\+[1-9]\d{6,14}$/.test(cleanPhone)) {
        setErrorMsg('Please enter a valid phone number (e.g. +25261XXXXXXX)');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/request-otp', {
        target: currentTarget,
        channel,
        purpose: 'login',
      });

      if (res.data?.success) {
        toast(res.data.message || `Login code dispatched to ${currentTarget}`);
        setStep('otp');
        setOtp('');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request login code. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/verify-otp', {
        target: currentTarget,
        otp: otp.trim(),
        purpose: 'login',
      });

      if (res.data?.success && res.data.user) {
        const token = res.data.token;
        setUser(res.data.user, token);
        toast(`Signed in as ${res.data.user.fullName || res.data.user.email}`);

        // Route Guard Invariant: If admin has not completed onboarding, resume at Step 2
        if (res.data.user.role === 'admin' && res.data.user.onboardingCompleted === false) {
          setActiveTab('onboarding');
        } else {
          setActiveTab('dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#E5EAF2',
              margin: '0 0 6px 0',
              letterSpacing: '-0.3px',
            }}
          >
            Welcome Back
          </h1>
          <p style={{ fontSize: '13.5px', color: '#8C9BAE', margin: 0 }}>
            Sign in to access your business ledger.
          </p>
        </div>

        {/* Dual-Rail Segmented Toggle */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0D121A',
            border: '1px solid #243042',
            borderRadius: '8px',
            padding: '3px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setChannel('email');
              setStep('input');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 0,
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: channel === 'email' ? '#18263D' : 'transparent',
              color: channel === 'email' ? '#6E9CF0' : '#8C9BAE',
              transition: 'all 0.15s ease',
            }}
          >
            Email with OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setChannel('sms');
              setStep('input');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 0,
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: channel === 'sms' ? '#18263D' : 'transparent',
              color: channel === 'sms' ? '#6E9CF0' : '#8C9BAE',
              transition: 'all 0.15s ease',
            }}
          >
            Phone with OTP
          </button>
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

        {/* ========================================================================= */}
        {/* STEP 1: CREDENTIAL INPUT FORM                                             */}
        {/* ========================================================================= */}
        {step === 'input' ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {channel === 'email' ? (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Business Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
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
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
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
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 0,
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
              }}
            >
              {loading ? 'Sending Code...' : 'Send Login Code'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #243042',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                style={{
                  backgroundColor: 'transparent',
                  border: 0,
                  color: '#8C9BAE',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                New business? <span style={{ color: '#6E9CF0', textDecoration: 'underline' }}>Create an admin account</span>
              </button>
            </div>
          </form>
        ) : (
          /* ========================================================================= */
          /* STEP 2: 6-DIGIT OTP VERIFICATION FORM                                     */
          /* ========================================================================= */
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#8C9BAE' }}>
                Enter the 6-digit code dispatched to <b style={{ color: '#E5EAF2' }}>{currentTarget}</b>
              </span>
            </div>

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
                  onClick={() => handleRequestOtp()}
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
                  Didn't receive the code? Resend
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid #243042',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setOtp('');
                  setErrorMsg('');
                }}
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
                ← Change credential
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
                {loading ? 'Verifying...' : 'Sign In'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};
