'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

/* ── animated counter hook ── */
function useCountUp(target, duration = 1200, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start || typeof target !== 'number') return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const pct = Math.min((ts - startTime) / duration, 1);
      setVal(Math.floor(pct * target));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return val;
}

/* ── intersection observer hook ── */
function useVisible(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── stat card ── */
const STATS = [
  { num: 13, label: 'Threat Patterns',   sub: 'Detected',   color: '#ff2d55', icon: '🚨' },
  { num: 6,  label: 'Secret Types',      sub: 'Scanned',    color: '#ffaa00', icon: '🔑' },
  { num: 3,  label: 'AI Agents',         sub: 'Controlled', color: '#bf5af2', icon: '🤖' },
  { num: null, label: 'Files',          sub: 'You Can Upload', color: '#00d4ff', icon: '☁' },
];

function StatCard({ stat, animate }) {
  const count = useCountUp(stat.num, 1000, animate && stat.num !== null);
  return (
    <div className="glass" style={{
      padding: '28px 24px',
      textAlign: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
      animation: animate ? 'fadeSlideIn 0.5s ease forwards' : 'none',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 12px 40px ${stat.color}22`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>{stat.icon}</div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '48px',
        fontWeight: 800,
        color: stat.color,
        lineHeight: 1,
        marginBottom: '8px',
        textShadow: `0 0 30px ${stat.color}55`,
        animation: animate ? 'count-up 0.4s ease' : 'none',
      }}>
        {stat.num === null ? '∞' : count}
      </div>
      <div style={{ fontSize: '12px', color: '#e8f4f8', fontWeight: 600, letterSpacing: '0.5px' }}>
        {stat.label}
      </div>
      <div style={{ fontSize: '10px', color: '#4a7a8a', letterSpacing: '1.5px', marginTop: '2px' }}>
        {stat.sub}
      </div>
    </div>
  );
}

/* ── how it works step ── */
const STEPS = [
  { icon: '☁',  step: '01', title: 'Upload',      color: '#00d4ff', desc: 'Drop any file — code, .env, documents. We scan for secrets instantly before anything leaves your machine.' },
  { icon: '🛡', step: '02', title: 'Protect',     color: '#00ff88', desc: 'Secrets are automatically redacted before AI ever sees them. Private keys, tokens, passwords — all replaced.' },
  { icon: '✓',  step: '03', title: 'Work Safely', color: '#bf5af2', desc: 'Your team uses AI normally. We watch silently in the background. Zero friction. Total protection.' },
];

/* ── threat preview ── */
const THREATS = [
  { name: 'Prompt Injection', desc: 'Attackers override AI instructions to hijack behavior', color: '#ff2d55', sev: 'CRITICAL' },
  { name: 'Data Exfiltration', desc: 'Unauthorized data extraction attempts via AI', color: '#ffaa00', sev: 'HIGH' },
  { name: 'Secret Leakage', desc: 'API keys & tokens exposed in AI responses', color: '#ffaa00', sev: 'HIGH' },
  { name: 'Agent Abuse', desc: 'AI agents performing restricted or dangerous actions', color: '#bf5af2', sev: 'CRITICAL' },
];

/* ─────────────────────── page ─────────────────────── */
export default function HomePage() {
  const [statsRef, statsVisible] = useVisible();
  const [howRef,   howVisible]   = useVisible();
  const [threatRef, threatVisible] = useVisible();

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{
        paddingTop: '140px',
        paddingBottom: '100px',
        paddingLeft: '32px',
        paddingRight: '32px',
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center',
        animation: 'fadeSlideIn 0.7s ease forwards',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '20px',
          border: '1px solid rgba(0,212,255,0.25)',
          background: 'rgba(0,212,255,0.06)',
          fontSize: '11px',
          color: '#00d4ff',
          letterSpacing: '2px',
          marginBottom: '36px',
          fontFamily: "'Space Mono', monospace",
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', display: 'inline-block', animation: 'dot-pulse 2s ease-in-out infinite' }} />
          ENTERPRISE AI SECURITY PLATFORM
        </div>

        <h1 style={{ marginBottom: '8px', lineHeight: 1.1 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: 800,
            color: '#e8f4f8',
            display: 'block',
          }}>Enterprise AI,</span>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'block',
          }}>Protected by default.</span>
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#4a7a8a',
          lineHeight: 1.8,
          maxWidth: '600px',
          margin: '28px auto 40px',
          fontFamily: "'Space Mono', monospace",
        }}>
          SecureAI sits invisibly between your team and AI.
          Files stay private. Secrets stay secret. Work stays safe.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
          <Link href="/workspace" style={{
            padding: '14px 32px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00d4ff, #0099bb)',
            color: '#020818',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
            letterSpacing: '0.5px',
            boxShadow: '0 0 30px rgba(0,212,255,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(0,212,255,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(0,212,255,0.3)'; }}
          >
            Open Workspace →
          </Link>
          <Link href="/threats" style={{
            padding: '14px 32px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e8f4f8',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
            letterSpacing: '0.5px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = '#00d4ff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#e8f4f8'; }}
          >
            See Threats ↗
          </Link>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          fontSize: '11px',
          color: '#2a4a5a',
          letterSpacing: '1px',
          flexWrap: 'wrap',
        }}>
          {['Protecting codebases', 'Zero leaks', 'Real-time'].map((t, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {i > 0 && <span style={{ color: '#0d2a3a' }}>·</span>}
              <span style={{ color: '#00d4ff' }}>✓</span> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Stats row ── */}
      <section ref={statsRef} style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 32px 100px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
      }}>
        {STATS.map((s, i) => (
          <StatCard key={i} stat={s} animate={statsVisible} />
        ))}
      </section>

      {/* ── How it works ── */}
      <section ref={howRef} style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 32px 100px',
        opacity: howVisible ? 1 : 0,
        transform: howVisible ? 'none' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800,
            color: '#e8f4f8',
            marginBottom: '12px',
          }}>How SecureAI protects your team</h2>
          <p style={{ color: '#4a7a8a', fontSize: '13px', letterSpacing: '0.5px' }}>
            Three invisible layers. Zero friction.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {STEPS.map((s, i) => (
            <div key={i} className="glass" style={{
              padding: '36px 28px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* step number watermark */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '64px',
                fontWeight: 800,
                color: `${s.color}08`,
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}>{s.step}</div>

              <div style={{
                width: '52px', height: '52px',
                borderRadius: '14px',
                background: `${s.color}12`,
                border: `1px solid ${s.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '20px',
                boxShadow: `0 0 20px ${s.color}15`,
              }}>{s.icon}</div>

              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: s.color,
                marginBottom: '12px',
              }}>{s.title}</h3>
              <p style={{ fontSize: '13px', color: '#4a7a8a', lineHeight: 1.8 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Threat preview ── */}
      <section ref={threatRef} style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 32px 100px',
        opacity: threatVisible ? 1 : 0,
        transform: threatVisible ? 'none' : 'translateY(20px)',
        transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800,
            color: '#e8f4f8',
            marginBottom: '12px',
          }}>What we stop every day</h2>
          <p style={{ color: '#4a7a8a', fontSize: '13px', letterSpacing: '0.5px' }}>
            Real threats. Real time. See the demo →
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {THREATS.map((t, i) => (
            <div key={i} className="glass" style={{
              padding: '28px 24px',
              borderLeft: `3px solid ${t.color}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 0 30px ${t.color}15`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#e8f4f8',
                }}>{t.name}</h3>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  color: t.color,
                  background: `${t.color}12`,
                  border: `1px solid ${t.color}30`,
                  flexShrink: 0,
                  marginLeft: '12px',
                }}>{t.sev}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#4a7a8a', marginBottom: '16px', lineHeight: 1.6 }}>{t.desc}</p>
              <Link href="/threats" style={{
                fontSize: '11px',
                color: t.color,
                textDecoration: 'none',
                letterSpacing: '0.5px',
                fontWeight: 600,
              }}>→ See demo</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 32px 120px',
        textAlign: 'center',
      }}>
        <div className="glass" style={{
          padding: '60px 48px',
          background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(191,90,242,0.05))',
          borderColor: 'rgba(0,212,255,0.15)',
        }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(24px, 3vw, 36px)',
            fontWeight: 800,
            color: '#e8f4f8',
            marginBottom: '16px',
          }}>Ready to protect your AI workspace?</h2>
          <p style={{ color: '#4a7a8a', fontSize: '13px', marginBottom: '36px', lineHeight: 1.8 }}>
            Set up in seconds. No configuration needed.
          </p>
          <Link href="/workspace" style={{
            padding: '16px 40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00d4ff, #0099bb)',
            color: '#020818',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none',
            boxShadow: '0 0 40px rgba(0,212,255,0.3)',
            display: 'inline-block',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(0,212,255,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(0,212,255,0.3)'; }}
          >
            Get Started →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '24px 32px',
        textAlign: 'center',
        fontSize: '10px',
        color: '#1a3040',
        letterSpacing: '2px',
        fontFamily: "'Space Mono', monospace",
      }}>
        SECUREAI WORKSPACE · ALL TRAFFIC MONITORED · ZERO LEAKS GUARANTEED
      </footer>
    </div>
  );
}
