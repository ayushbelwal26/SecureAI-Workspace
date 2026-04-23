'use client';

import Navbar from '@/components/Navbar';
import AgentControl from '@/components/AgentControl';

export default function AccessPage() {
  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '96px 32px 60px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '40px', animation: 'fadeSlideIn 0.5s ease' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(191,90,242,0.25)',
            background: 'rgba(191,90,242,0.08)',
            fontSize: '10px',
            color: '#bf5af2',
            letterSpacing: '2px',
            marginBottom: '20px',
            fontFamily: "'Space Mono', monospace",
          }}>
            ⚙ ACCESS CONTROL
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#e8f4f8',
            marginBottom: '8px',
          }}>Access Control</h1>
          <p style={{ color: '#4a7a8a', fontSize: '13px', marginBottom: '24px' }}>
            Define exactly what your AI agents can and cannot do.
          </p>

          {/* Info banner */}
          <div className="glass" style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            borderLeft: '3px solid rgba(191,90,242,0.5)',
            background: 'rgba(191,90,242,0.04)',
            borderColor: 'rgba(191,90,242,0.15)',
            maxWidth: '860px',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🔐</span>
            <p style={{
              fontSize: '12px',
              color: '#7a8a9a',
              lineHeight: 1.8,
              fontFamily: "'Space Mono', monospace",
            }}>
              Access policies are enforced at the{' '}
              <span style={{ color: '#bf5af2', fontWeight: 700 }}>infrastructure level</span>
              {' '}— agents cannot override their own permissions. All policy changes are
              logged and audited in real time.
            </p>
          </div>
        </div>

        {/* ── Full width agent control ── */}
        <AgentControl />

      </div>
    </div>
  );
}
