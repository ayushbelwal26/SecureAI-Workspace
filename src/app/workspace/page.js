'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import ChatInterface from '@/components/ChatInterface';
import SecurityDashboard from '@/components/SecurityDashboard';

const PIPELINE_STEPS = [
  { label: 'FILE SCAN',      color: '#00d4ff' },
  { label: 'THREAT DETECT',  color: '#ffaa00' },
  { label: 'REDACT',         color: '#ff2d55' },
  { label: 'AI CHAT',        color: '#bf5af2' },
  { label: 'OUTPUT FILTER',  color: '#00ff88' },
];

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

export default function WorkspacePage() {
  const [sessionFiles, setSessionFiles] = useState(0);
  const [sessionSecrets, setSessionSecrets] = useState(0);

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '96px 32px 60px' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: '40px', animation: 'fadeSlideIn 0.5s ease' }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#e8f4f8',
            marginBottom: '8px',
          }}>AI Workspace</h1>
          <p style={{ color: '#4a7a8a', fontSize: '13px', marginBottom: '28px' }}>
            Upload files, ask questions. Everything protected automatically.
          </p>

          {/* Protection pipeline */}
          <div className="glass" style={{
            padding: '14px 24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0',
            flexWrap: 'wrap',
            rowGap: '8px',
          }}>
            {PIPELINE_STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: `${s.color}12`,
                  border: `1px solid ${s.color}30`,
                  color: s.color,
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  fontFamily: "'Space Mono', monospace",
                  whiteSpace: 'nowrap',
                  boxShadow: `0 0 12px ${s.color}15`,
                }}>{s.label}</div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '14px', margin: '0 4px' }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Two column layout ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '55% 1fr',
          gap: '28px',
          alignItems: 'start',
        }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            <div>
              <SectionLabel icon="☁" label="Secure File Scanner" color="#00d4ff" />
              <FileUpload />
            </div>
            <div>
              <SectionLabel icon="💬" label="AI Assistant" color="#bf5af2" />
              <ChatInterface />
            </div>
          </div>

          {/* Right column — sticky */}
          <div style={{ position: 'sticky', top: '84px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Protection status */}
            <div>
              <SectionLabel icon="🔒" label="Protection Status" color="#00ff88" />
              <div className="glass glow-green" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  {[
                    { label: 'Files Scanned', value: sessionFiles, color: '#00d4ff' },
                    { label: 'Secrets Removed', value: sessionSecrets, color: '#ff2d55' },
                  ].map((s) => (
                    <div key={s.label} style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '10px',
                      padding: '16px',
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '32px',
                        fontWeight: 800,
                        color: s.color,
                        lineHeight: 1,
                        marginBottom: '6px',
                      }}>{s.value}</div>
                      <div style={{ fontSize: '10px', color: '#4a7a8a', letterSpacing: '1px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(0,255,136,0.06)',
                  border: '1px solid rgba(0,255,136,0.15)',
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', animation: 'dot-pulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700, letterSpacing: '1.5px', fontFamily: "'Space Mono', monospace" }}>YOUR DATA IS SAFE</span>
                </div>
              </div>
            </div>

            {/* Session log */}
            <div>
              <SectionLabel icon="📋" label="Session Log" color="#ffaa00" />
              <SecurityDashboard />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
