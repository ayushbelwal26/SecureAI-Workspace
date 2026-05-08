'use client';

import { useState, useEffect } from 'react';
import PageSkeleton from '@/components/PageSkeleton';
import Navbar from '@/components/Navbar';

/* ─── helpers ───────────────────────────────────────────────────────────── */
function tag(label, type) {
  const isAllow = type === 'allow';
  return (
    <span key={label} style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.3px',
      background: isAllow ? 'rgba(0,255,136,0.07)' : 'rgba(255,45,85,0.07)',
      border:     isAllow ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,45,85,0.2)',
      color:      isAllow ? '#00ff88' : '#ff2d55',
    }}>
      {label.replace(/_/g, ' ')}
    </span>
  );
}

function UsageBar({ used, limit }) {
  const pct  = Math.min((used / limit) * 100, 100);
  const fill = pct >= 95 ? '#ff2d55' : pct >= 80 ? '#ffaa00' : '#00e5ff';
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '10px', color: '#2a4a5a',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.5px', marginBottom: '6px',
      }}>
        <span>{used} of {limit} daily actions used</span>
        <span style={{ color: fill }}>{Math.round(pct)}%</span>
      </div>
      <div style={{
        height: '4px', background: 'rgba(255,255,255,0.05)',
        borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: fill,
          boxShadow: `0 0 6px ${fill}88`,
          borderRadius: '2px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

/* ─── Agent Card ────────────────────────────────────────────────────────── */
function AgentCard({ agentKey, profile, isMobile }) {
  const [action,  setAction]  = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null); // { allowed, reason, action }

  const testAction = async () => {
    const trimmed = action.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch('/api/agent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agentName: agentKey, action: trimmed }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ allowed: false, reason: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const c = profile.color || '#00e5ff';

  return (
    <div style={{
      background: 'rgba(13,24,38,0.8)',
      border: `1px solid ${c}22`,
      borderRadius: '14px',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>

      {/* Card header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: `1px solid ${c}18`,
        background: `${c}06`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '28px',
            width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${c}12`, borderRadius: '10px',
            border: `1px solid ${c}25`,
          }}>{profile.icon || '🤖'}</span>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '17px', fontWeight: 700, color: '#e8f4f8',
              marginBottom: '3px',
            }}>
              {profile.label || agentKey}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#00ff88', boxShadow: '0 0 5px #00ff88',
                display: 'inline-block',
              }} />
              <span style={{
                fontSize: '9px', color: '#00ff88',
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px',
              }}>ACTIVE</span>
            </div>
          </div>
        </div>
        <div style={{
          padding: '5px 12px', borderRadius: '20px',
          background: `${c}10`, border: `1px solid ${c}25`,
          fontSize: '10px', color: c,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px',
          whiteSpace: 'nowrap',
        }}>
          {profile.dailyLimit} actions/day
        </div>
      </div>

      {/* Permissions columns */}
      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{
            fontSize: '10px', color: '#00ff88',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px',
            marginBottom: '10px', fontWeight: 700,
          }}>✓ ALLOWED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profile.allowed.map((a) => tag(a, 'allow'))}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: '10px', color: '#ff2d55',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px',
            marginBottom: '10px', fontWeight: 700,
          }}>⛔ RESTRICTED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profile.restricted.map((r) => tag(r, 'block'))}
          </div>
        </div>
      </div>

      {/* Test action */}
      <div style={{ padding: '0 24px 20px' }}>
        <div style={{
          height: '1px', background: 'rgba(255,255,255,0.04)',
          marginBottom: '16px',
        }} />
        <div style={{ fontSize: '10px', color: '#2a4a5a', letterSpacing: '1px', marginBottom: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
          TEST AN ACTION
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && testAction()}
            placeholder="e.g. read_email or deploy_production"
            style={{
              flex: 1,
              background: '#0b1929',
              border: '1px solid #0d1826',
              borderRadius: '8px',
              color: '#c9d8e8',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              padding: '9px 14px',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = `${c}55`)}
            onBlur={(e)  => (e.target.style.borderColor = '#0d1826')}
          />
          <button
            onClick={testAction}
            disabled={loading || !action.trim()}
            style={{
              padding: '0 18px',
              borderRadius: '8px',
              background: loading || !action.trim() ? '#0d1826' : `${c}18`,
              border: `1px solid ${loading || !action.trim() ? '#0d1826' : `${c}40`}`,
              color: loading || !action.trim() ? '#2a4a5a' : c,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px', fontWeight: 700,
              letterSpacing: '1px',
              cursor: loading || !action.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : 'TEST ACTION'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            marginTop: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: result.allowed ? 'rgba(0,255,136,0.06)' : 'rgba(255,45,85,0.06)',
            border: result.allowed ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,45,85,0.2)',
            display: 'flex', alignItems: 'center', gap: '10px',
            animation: 'fadeSlideIn 0.3s ease',
          }}>
            <span style={{ fontSize: '16px' }}>{result.allowed ? '✓' : '⛔'}</span>
            <div>
              <div style={{
                fontSize: '12px', fontWeight: 700,
                color: result.allowed ? '#00ff88' : '#ff2d55',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.5px',
              }}>
                {result.allowed ? 'AUTHORIZED' : 'BLOCKED'}
                {result.threatLevel && (
                  <span style={{
                    marginLeft: '8px', fontSize: '9px',
                    padding: '1px 6px', borderRadius: '3px',
                    background: 'rgba(255,45,85,0.15)',
                    border: '1px solid rgba(255,45,85,0.3)',
                  }}>⚡ {result.threatLevel}</span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#6b9aaa', marginTop: '2px' }}>
                {result.allowed
                  ? `Action "${result.action}" executed successfully`
                  : result.reason || 'Action is restricted for this agent'
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage bar */}
      <div style={{
        padding: '14px 24px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(0,0,0,0.15)',
      }}>
        <UsageBar used={0} limit={profile.dailyLimit} />
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
const WHY = [
  {
    icon: '💥',
    title: 'Blast Radius Control',
    desc: 'If an AI agent is compromised, permissions limit the damage to only what it was allowed to do. A rogue email agent cannot delete your database.',
  },
  {
    icon: '🔑',
    title: 'Principle of Least Privilege',
    desc: 'Every agent operates with the minimum permissions needed for its task. Unused capabilities are removed by default, not granted on request.',
  },
  {
    icon: '📋',
    title: 'Audit Trail',
    desc: 'Every permission check is logged with agent name, action, decision, and timestamp. Full forensic record for compliance and incident response.',
  },
];

export default function AccessPage() {
  const [profiles, setProfiles] = useState(null);
  const [error,    setError]    = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetch('/api/agent')
      .then((r) => r.json())
      .then(setProfiles)
      .catch(() => setError('Failed to load agent profiles'));
  }, []);

  return (
    <PageSkeleton duration={1000}>
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '96px 32px 60px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '48px', animation: 'fadeSlideIn 0.5s ease' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 14px', borderRadius: '20px',
            border: '1px solid rgba(0,229,255,0.25)',
            background: 'rgba(0,229,255,0.07)',
            fontSize: '10px', color: '#00e5ff',
            letterSpacing: '2px', marginBottom: '20px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            ⚙ ACCESS CONTROL
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800, color: '#e8f4f8', marginBottom: '8px',
          }}>
            Agent Permission Manager
          </h1>
          <p style={{ color: '#6b9aaa', fontSize: '13px', maxWidth: '520px' }}>
            Define exactly what your AI agents can and cannot do.
            Changes take effect immediately.
          </p>
        </div>

        {/* ── Agent cards ── */}
        {error && (
          <div style={{
            padding: '20px 24px', borderRadius: '10px',
            background: 'rgba(255,45,85,0.07)',
            border: '1px solid rgba(255,45,85,0.2)',
            color: '#ff2d55', fontSize: '13px',
          }}>{error}</div>
        )}

        {!profiles && !error && (
          <div style={{ color: '#2a4a5a', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '1px' }}>
            LOADING AGENT PROFILES...
          </div>
        )}

        {profiles && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '72px' }}>
            {Object.entries(profiles).map(([key, profile]) => (
              <AgentCard key={key} agentKey={key} profile={profile} isMobile={isMobile} />
            ))}
          </div>
        )}

        {/* ── Why it matters ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '48px',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px', letterSpacing: '2px',
            color: '#00e5ff', marginBottom: '32px',
            fontWeight: 700,
          }}>
            WHY AGENT PERMISSIONS MATTER
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {WHY.map((w) => (
              <div key={w.title} style={{
                background: 'rgba(13,24,38,0.8)',
                border: '1px solid rgba(0,229,255,0.08)',
                borderRadius: '12px',
                padding: '24px',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{w.icon}</div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '15px', fontWeight: 700,
                  color: '#e8f4f8', marginBottom: '8px',
                }}>{w.title}</div>
                <p style={{ fontSize: '13px', color: '#6b9aaa', lineHeight: 1.7, margin: 0 }}>
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
    </PageSkeleton>
  );
}
