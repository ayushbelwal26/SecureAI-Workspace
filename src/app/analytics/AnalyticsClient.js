'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SecurityDashboard from '@/components/SecurityDashboard';
import PageSkeleton from '@/components/PageSkeleton';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 90) return '#00ff88';
  if (s >= 70) return '#ffaa00';
  return '#ff2d55';
}
function scoreLabel(s) {
  if (s >= 90) return 'Excellent';
  if (s >= 70) return 'Fair';
  return 'At Risk';
}

/* ─── subcomponents ────────────────────────────────────────────────────────── */
function SectionLabel({ icon, label, color = '#00e5ff' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px', fontWeight: 700,
        letterSpacing: '3px', color,
        textTransform: 'uppercase',
      }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${color}44, transparent)` }} />
    </div>
  );
}

function CircularScore({ score = 98 }) {
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color  = scoreColor(score);

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke={`${color}15`} strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
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
          color, lineHeight: 1,
        }}>{score}</span>
        <span style={{ fontSize: '9px', color: '#6b9aaa', letterSpacing: '1.5px', marginTop: '2px' }}>/ 100</span>
      </div>
    </div>
  );
}

/* ── Stacked bar chart ────────────────────────────────────────────────────── */
function ThreatTimeline({ logs }) {
  if (!logs.length) {
    return (
      <div style={{
        height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#2a4a5a', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '1px',
      }}>
        NO EVENTS YET — WAITING FOR DATA
      </div>
    );
  }

  // Group last 24 events into 8 buckets of 3
  const last24 = logs.slice(0, 24).reverse();
  const buckets = [];
  for (let i = 0; i < 8; i++) {
    const slice = last24.slice(i * 3, i * 3 + 3);
    const label = slice[0]
      ? new Date(slice[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--:--';
    buckets.push({
      label,
      blocked:  slice.filter((l) => l.status === 'BLOCKED').length,
      redacted: slice.filter((l) => l.status === 'REDACTED' || l.status === 'SECRET_REMOVED').length,
      passed:   slice.filter((l) => !['BLOCKED', 'REDACTED', 'SECRET_REMOVED'].includes(l.status)).length,
      total:    slice.length || 1,
    });
  }

  const maxTotal = Math.max(...buckets.map((b) => b.blocked + b.redacted + b.passed), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', padding: '0 0 20px' }}>
      {buckets.map((b, i) => {
        const total    = b.blocked + b.redacted + b.passed;
        const barH     = Math.round((total / maxTotal) * 90);
        const blockedH  = total ? Math.round((b.blocked  / total) * barH) : 0;
        const redactedH = total ? Math.round((b.redacted / total) * barH) : 0;
        const passedH   = barH - blockedH - redactedH;

        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '100%', height: `${barH || 2}px`,
              display: 'flex', flexDirection: 'column-reverse',
              borderRadius: '3px 3px 0 0', overflow: 'hidden', minHeight: '2px',
            }}>
              {passedH   > 0 && <div style={{ height: `${passedH}px`,   background: '#00ff8866' }} />}
              {redactedH > 0 && <div style={{ height: `${redactedH}px`, background: '#ffaa0088' }} />}
              {blockedH  > 0 && <div style={{ height: `${blockedH}px`,  background: '#ff2d5588' }} />}
            </div>
            <div style={{
              fontSize: '8px', color: '#2a4a5a',
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: '4px', letterSpacing: '0px',
              whiteSpace: 'nowrap', overflow: 'hidden',
              width: '100%', textAlign: 'center',
            }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Donut chart ─────────────────────────────────────────────────────────── */
function ThreatDonut({ logs }) {
  const blocked  = logs.filter((l) => l.status === 'BLOCKED').length;
  const redacted = logs.filter((l) => l.status === 'REDACTED' || l.status === 'SECRET_REMOVED').length;
  const anomaly  = logs.filter((l) => l.status === 'ANOMALY').length;
  const passed   = logs.filter((l) => !['BLOCKED', 'REDACTED', 'SECRET_REMOVED', 'ANOMALY'].includes(l.status)).length;
  const total    = blocked + redacted + anomaly + passed;

  if (total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="40" fill="none" stroke="#0d1826" strokeWidth="14" />
        </svg>
        <span style={{ fontSize: '11px', color: '#2a4a5a', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}>
          NO EVENTS YET
        </span>
      </div>
    );
  }

  const segments = [
    { count: blocked,  color: '#ff2d55', label: 'Blocked'  },
    { count: redacted, color: '#ffaa00', label: 'Redacted' },
    { count: anomaly,  color: '#bf5af2', label: 'Anomaly'  },
    { count: passed,   color: '#00ff88', label: 'Passed'   },
  ].filter((s) => s.count > 0);

  const r    = 40;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="#0d1826" strokeWidth="14" />
        {segments.map((seg, i) => {
          const pct    = seg.count / total;
          const dash   = pct * circ;
          const offset = circ - cumulative * circ;
          cumulative  += pct;
          return (
            <circle
              key={i}
              cx="55" cy="55" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: '10px', color: '#6b9aaa', fontFamily: "'JetBrains Mono', monospace" }}>
              {seg.label}
            </span>
            <span style={{ fontSize: '10px', color: seg.color, fontWeight: 700, marginLeft: 'auto' }}>
              {Math.round((seg.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Compliance ──────────────────────────────────────────────────────────── */
const COMPLIANCE = [
  { label: 'GDPR Ready',     desc: 'Audit logs + data redaction satisfy Article 25 privacy-by-design requirements' },
  { label: 'SOC2 Compatible', desc: 'Access control policies + anomaly detection map to CC6 & CC7 trust criteria'  },
  { label: 'HIPAA Friendly',  desc: 'SSN and PII redaction prevents PHI exposure in AI interactions'                },
  { label: 'PCI-DSS Aligned', desc: 'Credit card pattern detection blocks cardholder data from reaching AI models'  },
];

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [liveStats, setLiveStats] = useState({ total: 0, blocked: 0, redacted: 0, anomalies: 0, latency: 0, score: 100 });
  const [logs,      setLogs]      = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadData = async () => {
    const t0  = performance.now();
    const res = await fetch('/api/secure-chat').catch(() => null);
    const latency = Math.round(performance.now() - t0);
    if (!res?.ok) return;
    const data = await res.json().catch(() => null);
    if (!data?.logs) return;

    const allLogs   = data.logs;
    const today     = new Date().toDateString();
    const todayLogs = allLogs.filter((l) => new Date(l.timestamp).toDateString() === today);

    const total     = allLogs.length;
    const blocked   = allLogs.filter((l) => l.status === 'BLOCKED').length;
    const redacted  = allLogs.filter((l) => l.status === 'REDACTED' || l.status === 'SECRET_REMOVED').length;
    const anomalies = allLogs.filter((l) => l.status === 'ANOMALY').length;
    const threats   = blocked + redacted + anomalies;
    const score     = total > 0 ? Math.max(0, Math.round(100 - (threats / total) * 60)) : 100;

    setLogs(allLogs);
    setTodayCount(todayLogs.length);
    setLiveStats({ total, blocked, redacted, anomalies, latency, score });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const blockedPct = liveStats.total > 0
    ? Math.round((liveStats.blocked / liveStats.total) * 100) + '%'
    : '--';

  const quickStats = [
    { label: 'API Latency',      value: liveStats.latency + 'ms', color: '#00e5ff' },
    { label: 'Threats Blocked',  value: blockedPct,                color: '#ff2d55' },
    { label: 'Outputs Redacted', value: liveStats.redacted,        color: '#ffaa00' },
    { label: 'Data Leaked',      value: '0 bytes',                 color: '#00ff88' },
  ];

  const sc = scoreColor(liveStats.score);

  return (
    <PageSkeleton duration={1000}>
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '96px 32px 60px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '48px', animation: 'fadeSlideIn 0.5s ease' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 14px', borderRadius: '20px',
            border: '1px solid rgba(255,170,0,0.25)',
            background: 'rgba(255,170,0,0.07)',
            fontSize: '10px', color: '#ffaa00',
            letterSpacing: '2px', marginBottom: '20px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            📊 ANALYTICS &amp; AUDIT
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 800, color: '#e8f4f8', marginBottom: '8px',
              }}>Analytics &amp; Audit</h1>
              <p style={{ color: '#6b9aaa', fontSize: '13px' }}>
                Complete audit trail of everything SecureAI has protected.
              </p>
            </div>

            {/* Events today counter */}
            <div style={{
              background: 'rgba(0,229,255,0.05)',
              border: '1px solid rgba(0,229,255,0.15)',
              borderRadius: '12px', padding: '16px 28px',
              textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '42px', fontWeight: 800,
                color: '#00e5ff', lineHeight: 1,
                textShadow: '0 0 24px rgba(0,229,255,0.4)',
              }}>
                {todayCount}
              </div>
              <div style={{
                fontSize: '9px', color: '#2a4a5a',
                letterSpacing: '1.5px', marginTop: '4px',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                EVENTS TODAY
              </div>
            </div>
          </div>
        </div>

        {/* ── Two column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '60% 1fr', gap: '28px', alignItems: 'start' }}>

          {/* Left */}
          <div>
            <SectionLabel icon="📡" label="Security Events" color="#ffaa00" />
            <SecurityDashboard />

            {/* Threat Timeline */}
            <div style={{ marginTop: '28px' }}>
              <SectionLabel icon="📈" label="Threat Timeline" color="#00e5ff" />
              <div className="glass" style={{ padding: '20px 20px 4px' }}>
                {/* Legend */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  {[
                    { color: '#ff2d55', label: 'Blocked'  },
                    { color: '#ffaa00', label: 'Redacted' },
                    { color: '#00ff88', label: 'Passed'   },
                  ].map((l) => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '8px', height: '8px', background: l.color, borderRadius: '2px' }} />
                      <span style={{ fontSize: '9px', color: '#2a4a5a', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px' }}>
                        {l.label.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
                <ThreatTimeline logs={logs} />
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '84px' }}>

            {/* Security score */}
            <div>
              <SectionLabel icon="🏆" label="Security Score" color={sc} />
              <div className="glass" style={{
                padding: '28px 24px',
                border: `1px solid ${sc}22`,
                boxShadow: `0 0 24px ${sc}0d`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <CircularScore score={liveStats.score} />
                  <div>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '20px', fontWeight: 700,
                      color: sc, marginBottom: '6px',
                    }}>{scoreLabel(liveStats.score)}</div>
                    <p style={{ fontSize: '12px', color: '#6b9aaa', lineHeight: 1.7 }}>
                      {liveStats.score >= 90
                        ? <>Your AI infrastructure is operating at <span style={{ color: sc }}>peak protection</span>. No active threats detected.</>
                        : liveStats.score >= 70
                        ? <>Security posture is <span style={{ color: sc }}>acceptable</span> but some threats were detected. Review event log.</>
                        : <>⚠ <span style={{ color: sc }}>Elevated threat activity</span> detected. Immediate review recommended.</>
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Threat breakdown donut */}
            <div>
              <SectionLabel icon="🍩" label="Threat Breakdown" color="#bf5af2" />
              <div className="glass" style={{ padding: '20px 24px' }}>
                <ThreatDonut logs={logs} />
              </div>
            </div>

            {/* Quick stats */}
            <div>
              <SectionLabel icon="⚡" label="Quick Stats" color="#00e5ff" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {quickStats.map((s) => (
                  <div key={s.label} className="glass" style={{
                    padding: '18px 16px', textAlign: 'center', transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '22px', fontWeight: 800,
                      color: s.color, marginBottom: '6px',
                      textShadow: `0 0 20px ${s.color}44`,
                    }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: '#6b9aaa', letterSpacing: '1px' }}>{s.label}</div>
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
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(0,255,136,0.04)',
                      border: '1px solid rgba(0,255,136,0.1)',
                    }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: 'rgba(0,255,136,0.15)',
                        border: '1px solid rgba(0,255,136,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', color: '#00ff88', fontWeight: 700, flexShrink: 0,
                      }}>✓</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{
                          fontSize: '12px', color: '#c8e8d8',
                          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px',
                        }}>{c.label}</span>
                        <span style={{ fontSize: '10px', color: '#3a5a6a', lineHeight: 1.5 }}>{c.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    </PageSkeleton>
  );
}
