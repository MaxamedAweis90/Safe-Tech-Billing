import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { toast } from '../../store/useUIStore';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { OtpInput } from './OtpInput';

export const VerifyView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);

  const { setUser } = useAuthStore();
  const { setActiveTab } = useNavStore();

  // Extract email from query string if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const initialEmail = urlParams.get('email') || hashParams.get('email');
      if (initialEmail) {
        setEmail(decodeURIComponent(initialEmail));
      }
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please specify the email to verify');
      return;
    }

    if (otp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code');
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
        setUser(res.data.user, token);
        toast(`Account verified! Welcome to Safe Tech Billing, ${res.data.user.fullName || res.data.user.email}.`);
        if (res.data.user.role === 'admin' && res.data.user.onboardingCompleted === false) {
          setActiveTab('onboarding');
        } else {
          setActiveTab('dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendCooldown > 0) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/request-otp', {
        target: email.trim().toLowerCase(),
        channel: 'email',
        purpose: 'verification',
      });

      if (res.data?.success) {
        toast(`New verification code sent to ${email}`);
        setResendCooldown(60);
        setOtp('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ width: '100%' }}>
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
            Email Verification
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
            Verify Your Email
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#8C9BAE', lineHeight: 1.4 }}>
            Enter the 6-digit confirmation code dispatched to your inbox.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(240, 122, 112, 0.12)',
              border: '1px solid rgba(240, 122, 112, 0.3)',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '18px',
              fontSize: '12.5px',
              color: '#F07A70',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="verifyEmailInput"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#B9C5DA',
                marginBottom: '6px',
              }}
            >
              Registered Email Address
            </label>
            <input
              id="verifyEmailInput"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@safetech.so"
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                backgroundColor: '#0D121A',
                border: '1px solid #243042',
                borderRadius: '8px',
                color: '#E5EAF2',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: '12.5px', color: '#8C9BAE', marginBottom: '8px' }}>
              6-Digit Security Code
            </div>
            <OtpInput
              value={otp}
              onChange={setOtp}
              hasError={Boolean(errorMsg)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            {resendCooldown > 0 ? (
              <span style={{ fontSize: '12.5px', color: '#6F7B90' }}>
                Resend code in <b style={{ color: '#E5EAF2' }}>{resendCooldown}s</b>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 0,
                  color: '#6E9CF0',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                Didn't receive the email? Resend code
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
              onClick={() => setActiveTab('login')}
              style={{
                background: 'transparent',
                border: 0,
                color: '#8C9BAE',
                fontSize: '13px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ← Back to Login
            </button>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '13.5px',
                border: 0,
                borderRadius: '8px',
                padding: '11px 24px',
                cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                opacity: loading || otp.length !== 6 ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loading ? 'Verifying...' : 'Activate & Enter'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};
