'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AttackSimulator from '@/components/AttackSimulator';

const THREAT_INTEL = [
  { name: 'Prompt Injection',   desc: 'Attackers embed hidden instructions to override AI behavior',         sev: 'CRITICAL', sevColor: '#ff2d55', layer: 'Input Filter'   },
  { name: 'Jailbreak',          desc: 'Role-play or encoding tricks used to bypass AI safety guidelines',    sev: 'CRITICAL', sevColor: '#ff2d55', layer: 'Input Filter'   },
  { name: 'Data Exfiltration',  desc: 'AI coerced into leaking internal data through crafted queries',       sev: 'HIGH',     sevColor: '#ffaa00', layer: 'Agent Control'  },
  { name: 'PII Leak',           desc: 'Personally identifiable info surfaces in AI responses',               sev: 'HIGH',     sevColor: '#ffaa00', layer: 'Output Scanner' },
  { name: 'Role Hijacking',     desc: 'Convincing the AI it has a different identity or super-admin role',   sev: 'HIGH',     sevColor: '#ffaa00', layer: 'Input Filter'   },
  { name: 'Secret Extraction',  desc: 'Tokens, keys & credentials retrieved from context or files',          sev: 'CRITICAL', sevColor: '#ff2d55', layer: 'File Scanner'   },
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

export default function ThreatsPage() {
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
            border: '1px solid rgba(255,45,85,0.25)',
            background: 'rgba(255,45,85,0.08)',
            fontSize: '10px',
            color: '#ff2d55',
            letterSpacing: '2px',
            marginBottom: '20px',
            fontFamily: "'Space Mono', monospace",
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ff2d55', boxShadow: '0 0 6px #ff2d55', display: 'inline-block', animation: 'dot-pulse 1.5s ease-in-out infinite' }} />
            THREAT CENTER
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#e8f4f8',
            marginBottom: '8px',
          }}>Threat Center</h1>
          <p style={{ color: '#4a7a8a', fontSize: '13px', marginBottom: '28px' }}>
            Real attacks. Live interception. See exactly what we stop.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: '8 Attack Types',  color: '#ff2d55' },
              { label: '100% Block Rate', color: '#00ff88' },
              { label: '< 50ms Response', color: '#00d4ff' },
            ].map((s) => (
              <div key={s.label} style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: `1px solid ${s.color}30`,
                background: `${s.color}08`,
                color: s.color,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                fontFamily: "'Space Mono', monospace",
              }}>{s.label}</div>
            ))}
          </div>
        </div>

        {/* ── Two column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '28px', alignItems: 'start' }}>

          {/* Left */}
          <div>
            <SectionLabel icon="⚡" label="Live Threat Simulation" color="#ff2d55" />
            <AttackSimulator />
          </div>

          {/* Right */}
          <div style={{ position: 'sticky', top: '84px' }}>
            <SectionLabel icon="📡" label="Attack Intelligence" color="#ffaa00" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {THREAT_INTEL.map((t, i) => (
                <div key={i} className="glass" style={{
                  padding: '16px 18px',
                  borderLeft: `3px solid ${t.sevColor}`,
                  transition: 'transform 0.2s',
                  animation: `fadeSlideIn 0.4s ease ${i * 0.06}s both`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#e8f4f8',
                    }}>{t.name}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '8px',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      color: t.sevColor,
                      background: `${t.sevColor}12`,
                      border: `1px solid ${t.sevColor}30`,
                      flexShrink: 0,
                      fontFamily: "'Space Mono', monospace",
                    }}>{t.sev}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#4a7a8a', marginBottom: '8px', lineHeight: 1.6 }}>{t.desc}</p>
                  <div style={{
                    fontSize: '9px',
                    color: '#2a4a5a',
                    letterSpacing: '1.5px',
                    fontFamily: "'Space Mono', monospace",
                  }}>DETECTION LAYER: <span style={{ color: '#00d4ff' }}>{t.layer}</span></div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
