import React from 'react';

export interface AuthTeaserMeta {
  companyName?: string;
  inviterName?: string;
  roleLabel?: string;
}

interface AuthTeaserPanelProps {
  meta?: AuthTeaserMeta;
}

export const AuthTeaserPanel: React.FC<AuthTeaserPanelProps> = ({ meta }) => {
  const isInvitedStaff = Boolean(meta?.companyName || meta?.inviterName);

  const headline = isInvitedStaff
    ? `Welcome to ${meta?.companyName || 'the Team'}`
    : 'Audit-ready invoicing & real-time ledgers';

  const bodyText = isInvitedStaff
    ? `You've been invited by ${meta?.inviterName || 'your administrator'} to join ${meta?.companyName || 'the organization'} as an authorized ${meta?.roleLabel || 'Staff Member'}.`
    : 'Audit-ready invoicing & real-time ledgers built for modern Somali enterprises.';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0A0F17',
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Subtle Radial Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '15%',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.28) 0%, rgba(14, 165, 233, 0) 70%)',
          filter: 'blur(35px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '40%',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30, 64, 175, 0.35) 0%, rgba(30, 64, 175, 0) 70%)',
          filter: 'blur(45px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '55%',
          right: '15%',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110, 156, 240, 0.22) 0%, rgba(110, 156, 240, 0) 70%)',
          filter: 'blur(35px)',
          pointerEvents: 'none',
        }}
      />

      {/* 1. Brand Wordmark & Shield Logo */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            backgroundColor: '#151C27',
            border: '1px solid #243042',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <img
            src="/logo.png"
            alt="Safe Tech"
            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            onError={(e) => {
              // Graceful SVG fallback if image is missing
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div>
          <div style={{ color: '#E5EAF2', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.3px' }}>
            Safe Tech <span style={{ color: '#6E9CF0' }}>Billing</span>
          </div>
          <div style={{ color: '#6F7B90', fontSize: '11px', letterSpacing: '0.2px' }}>
            Enterprise Financial Engine
          </div>
        </div>
      </div>

      {/* 2. Floating Interactive Preview Teasers */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          margin: '36px 0',
          minHeight: '260px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '320px', height: '220px' }}>
          {/* Card 1: Sample Invoice Snippet */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '235px',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(21, 28, 39, 0.78)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 18px 38px rgba(0, 0, 0, 0.55)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#E5EAF2', letterSpacing: '-0.2px' }}>
                Invoice #STB-9021
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#4EBA6F',
                  backgroundColor: 'rgba(78, 186, 111, 0.15)',
                  border: '1px solid rgba(78, 186, 111, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                Paid
              </span>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10.5px', color: '#8C9BAE', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                Balance
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#4EBA6F',
                  fontFamily: "'IBM Plex Mono', Menlo, monospace",
                  letterSpacing: '-0.5px',
                }}
              >
                $1,450.00
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
              <span style={{ fontSize: '10.5px', color: '#6F7B90' }}>Status: Verified</span>
              <span style={{ fontSize: '10.5px', color: '#8C9BAE' }}>Jun 8, 2026</span>
            </div>
          </div>

          {/* Card 2: Mini Real-Time Transaction Feed Snippet (Overlapping) */}
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '185px',
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(110, 156, 240, 0.22)',
              boxShadow: '0 20px 42px rgba(0, 0, 0, 0.65)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(110, 156, 240, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6E9CF0',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#E5EAF2', lineHeight: 1.2 }}>
                Real-Time Ledger
              </div>
            </div>

            {/* Micro Progress Bar */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#8C9BAE', marginBottom: '3px' }}>
                <span>Reconciled</span>
                <span style={{ color: '#4EBA6F', fontWeight: 600 }}>100%</span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#1E293B', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#38BDF8', borderRadius: '2px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#6F7B90' }}>Received</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#E5EAF2', fontFamily: "'IBM Plex Mono', Menlo, monospace" }}>
                +$150.00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Context-Aware Copy */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#E5EAF2',
            letterSpacing: '-0.3px',
            marginBottom: '8px',
            lineHeight: 1.3,
          }}
        >
          {headline}
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: '#8C9BAE',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {bodyText}
        </p>
      </div>
    </div>
  );
};

