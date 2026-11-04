import React, { useState } from 'react';
import api from '../../lib/api';
import { useNavStore } from '../../store/useNavStore';
import { toast } from '../../store/useUIStore';

export const SignupView: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { setActiveTab } = useNavStore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full name is required');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('A valid business email address is required');
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    const cleanPhone = cleanDigits ? `+252${cleanDigits}` : undefined;

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        companyName: companyName.trim() || undefined,
      });

      if (res.data?.success) {
        toast('Verification code sent to your email');
        const encodedEmail = encodeURIComponent(email.trim().toLowerCase());
        // Navigate to verify
        if (typeof window !== 'undefined') {
          window.location.hash = `#verify?email=${encodedEmail}`;
        }
        setActiveTab('verify');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D121A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: '#E5EAF2',
        fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#151C27',
          border: '1px solid #243042',
          borderRadius: '8px',
          padding: '32px 28px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              backgroundColor: '#0D121A',
              border: '1px solid #243042',
              borderRadius: '8px',
              marginBottom: '12px',
            }}
          >
            <span style={{ color: '#6E9CF0', fontWeight: 800, fontSize: '18px' }}>ST</span>
          </div>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
            }}
          >
            ADMINISTRATOR SIGNUP
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#9AA6BA' }}>
            Register the primary administrator account for your company
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(240, 122, 112, 0.12)',
              border: '1px solid #F07A70',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#F07A70',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="fullName"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#9AA6BA',
                marginBottom: '6px',
              }}
            >
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              autoFocus
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                backgroundColor: '#0D121A',
                border: '1px solid #243042',
                borderRadius: '6px',
                color: '#E5EAF2',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="companyName"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#9AA6BA',
                marginBottom: '6px',
              }}
            >
              Company / Business Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corporation"
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                backgroundColor: '#0D121A',
                border: '1px solid #243042',
                borderRadius: '6px',
                color: '#E5EAF2',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="signupEmail"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#9AA6BA',
                marginBottom: '6px',
              }}
            >
              Business Email *
            </label>
            <input
              id="signupEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@example.com"
              required
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                backgroundColor: '#0D121A',
                border: '1px solid #243042',
                borderRadius: '6px',
                color: '#E5EAF2',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="signupPhone"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#9AA6BA',
                marginBottom: '6px',
              }}
            >
              Phone Number
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
                  borderRadius: '6px 0 0 6px',
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
                id="signupPhone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const stripped = raw.startsWith('252') ? raw.slice(3) : raw;
                  setPhone(stripped.slice(0, 9));
                }}
                placeholder="xxxxxxxxx"
                style={{
                  flex: 1,
                  height: '40px',
                  padding: '0 12px',
                  backgroundColor: '#0D121A',
                  border: '1px solid #243042',
                  borderRadius: '0 6px 6px 0',
                  color: '#E5EAF2',
                  fontSize: '14px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: '#6F7B90', marginTop: '4px' }}>
              Enter 7 to 9 digit local phone number for optional OTP verification.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '42px',
              backgroundColor: '#6E9CF0',
              color: '#0B1424',
              fontWeight: 700,
              fontSize: '14px',
              border: 0,
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating Account...' : 'Register & Receive Code'}
          </button>
        </form>

        {/* Footer Link */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid #243042',
            textAlign: 'center',
            fontSize: '12.5px',
            color: '#9AA6BA',
          }}
        >
          Already have an account?{' '}
          <a
            href="#login"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('login');
            }}
            style={{ color: '#6E9CF0', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
};

