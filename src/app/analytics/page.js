'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SecurityDashboard from '@/components/SecurityDashboard';

function SectionLabel({ icon, label, color = '#00d4ff' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '11px', fontWeight: 700,
        letterSpacing: '3px', color,
        textTransform: 'uppercase',
      }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${color}44, transparent)` }} />
    </div>
  );
}

/* CSS-only circular progress */
function CircularScore({ score = 98 }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(0,255,136,0.08)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke="#00ff88" strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 6px #00ff88)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '36px', fontWeight: 800,
          color: '#00ff88',
          lineHeight: 1,
        }}>{score}</span>
        <span style={{ fontSize: '9px', color: '#4a7a8a', letterSpacing: '1.5px', marginTop: '2px' }}>/ 100</span>
      </div>
    </div>
  );
}

const QUICK_STATS = [
  { label: 'Response Time', value: '< 38ms', color: '#00d4ff' },
  { label: 'Uptime',        value: '99.9%',  color: '#00ff88' },
  { label: 'Threats Blocked', value: '100%', color: '#ff2d55' },
  { label: 'Data Leaked',   value: '0 bytes', color: '#ffaa00' },
];

const COMPLIANCE = [
  { label: 'GDPR Ready'     },
  { label: 'SOC2 Compatible' },
  { label: 'HIPAA Friendly'  },
  { label: 'PCI-DSS Aligned' },
];

export default function AnalyticsPage() {
  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '96px 32px 60px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '48px', animation: 'fadeSlideIn 0.5s ease' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(255,170,0,0.25)',
            background: 'rgba(255,170,0,0.07)',
            fontSize: '10px',
            color: '#ffaa00',
            letterSpacing: '2px',
            marginBottom: '20px',
            fontFamily: "'Space Mono', monospace",
          }}>
            📊 ANALYTICS &amp; AUDIT
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#e8f4f8',
            marginBottom: '8px',
          }}>Analytics &amp; Audit</h1>
          <p style={{ color: '#4a7a8a', fontSize: '13px' }}>
            Complete audit trail of everything SecureAI has protected.
          </p>
        </div>

        {/* ── Two column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '28px', alignItems: 'start' }}>

          {/* Left */}
          <div>
            <SectionLabel icon="📡" label="Security Events" color="#ffaa00" />
            <SecurityDashboard />
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '84px' }}>

            {/* Security score */}
            <div>
              <SectionLabel icon="🏆" label="Security Score" color="#00ff88" />
              <div className="glass glow-green" style={{ padding: '28px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <CircularScore score={98} />
                  <div>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#00ff88',
                      marginBottom: '6px',
                    }}>Excellent</div>
                    <p style={{ fontSize: '12px', color: '#4a7a8a', lineHeight: 1.7 }}>
                      Your AI infrastructure is operating at{' '}
                      <span style={{ color: '#00ff88' }}>peak protection</span>.
                      No active threats detected.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div>
              <SectionLabel icon="⚡" label="Quick Stats" color="#00d4ff" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {QUICK_STATS.map((s) => (
                  <div key={s.label} className="glass" style={{
                    padding: '18px 16px',
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '22px',
                      fontWeight: 800,
                      color: s.color,
                      marginBottom: '6px',
                      textShadow: `0 0 20px ${s.color}44`,
                    }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: '#4a7a8a', letterSpacing: '1px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance */}
            <div>
              <SectionLabel icon="✓" label="Compliance" color="#00ff88" />
              <div className="glass" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {COMPLIANCE.map((c) => (
                    <div key={c.label} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0,255,136,0.04)',
                      border: '1px solid rgba(0,255,136,0.1)',
                    }}>
                      <div style={{
                        width: '22px', height: '22px',
                        borderRadius: '50%',
                        background: 'rgba(0,255,136,0.15)',
                        border: '1px solid rgba(0,255,136,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', color: '#00ff88', fontWeight: 700, flexShrink: 0,
                      }}>✓</div>
                      <span style={{
                        fontSize: '12px',
                        color: '#c8e8d8',
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: '0.5px',
                      }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
