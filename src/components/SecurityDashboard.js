'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const STATUS_STYLES = {
  BLOCKED:  { bg: 'rgba(213,0,0,0.14)',   border: 'rgba(213,0,0,0.45)',   text: '#ff5252', dot: '#d50000', leftGlow: '#d50000', label: 'THREAT STOPPED'      },
  PASSED:   { bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.25)', text: '#00e676', dot: '#00e676', leftGlow: '#00e676', label: 'PROTECTED'            },
  REDACTED: { bg: 'rgba(255,214,0,0.1)',  border: 'rgba(255,214,0,0.3)',  text: '#ffd600', dot: '#ffd600', leftGlow: '#ffd600', label: 'SECRET REMOVED'       },
  ANOMALY:  { bg: 'rgba(255,109,0,0.1)',  border: 'rgba(255,109,0,0.3)',  text: '#ff6d00', dot: '#ff6d00', leftGlow: '#ff6d00', label: 'SUSPICIOUS ACTIVITY'  },
  WARNING:  { bg: 'rgba(255,109,0,0.07)', border: 'rgba(255,109,0,0.22)', text: '#ff9100', dot: '#ff9100', leftGlow: '#ff9100', label: 'WARNING'               },
  ERROR:    { bg: 'rgba(213,0,0,0.09)',   border: 'rgba(213,0,0,0.28)',   text: '#ff5252', dot: '#d50000', leftGlow: '#d50000', label: 'ERROR'                 },
  SYSTEM:   { bg: 'rgba(0,229,255,0.07)', border: 'rgba(0,229,255,0.18)', text: '#00e5ff', dot: '#00e5ff', leftGlow: '#00e5ff', label: 'SYSTEM'                },
};

const LAYER_ICONS = {
  'ANOMALY_DETECTION': '🔍',
  'INPUT_FILTER':      '🛡',
  'OUTPUT_FILTER':     '✂',
  'GROK':              '⚡',
  'SYSTEM':            '⚙',
  'AGENT':             '🤖',
};

function layerIcon(layer) {
  if (!layer || typeof layer !== 'string') return '◈';
  const up = layer.toUpperCase();
  const key = Object.keys(LAYER_ICONS).find((k) => up.includes(k));
  return key ? LAYER_ICONS[key] : '◈';
}

/* ── Sparkline (last 10 events, heights reflect recency) ── */
function Sparkline({ logs }) {
  const last10 = logs.slice(0, 10);
  const maxH = 28;
  return (
    <div style={{
      padding: '10px 18px 0',
      borderBottom: '1px solid #0d1826',
      background: '#070e18',
    }}>
      <div style={{ fontSize: '9px', color: '#2e5472', letterSpacing: '1.5px', marginBottom: '6px' }}>
        REQUEST VOLUME (LAST 10 EVENTS)
      </div>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '3px', height: `${maxH + 4}px`,
        marginBottom: '8px',
      }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const log    = last10[9 - i];          // oldest first → left
          const exists = Boolean(log);
          const h      = exists ? Math.max(6, Math.round(maxH * ((i + 1) / 10))) : 2;
          const color  = !exists ? '#0d1826'
            : log.status === 'BLOCKED'  ? '#ff5252'
            : log.status === 'ANOMALY'  ? '#ff6d00'
            : log.status === 'REDACTED' ? '#ffd600'
            : '#00e676';
          return (
            <div key={i} style={{
              flex: 1, height: `${h}px`,
              background: color,
              borderRadius: '2px 2px 0 0',
              opacity: exists ? 0.85 : 0.3,
              transition: 'height 0.4s ease',
              boxShadow: exists ? `0 0 4px ${color}66` : 'none',
            }} />
          );
        })}
      </div>
    </div>
  );
}

export default function SecurityDashboard() {
  const [logs,      setLogs]      = useState([]);
  const [stats,     setStats]     = useState({ blocked: 0, redacted: 0, anomalies: 0, score: 100 });
  const [isLive,    setIsLive]    = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedLogIndex, setSelectedLogIndex] = useState(0);
  const tableRef    = useRef(null);
  const intervalRef = useRef(null);
  const streamRef   = useRef(null);

  useEffect(() => { setIsMounted(true); }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res  = await fetch('/api/secure-chat');
      const data = await res.json();
      if (data.logs) {
        const raw      = data.logs;
        const blocked  = raw.filter((l) => l.status === 'BLOCKED').length;
        const redacted = raw.filter((l) => l.status === 'REDACTED').length;
        const anomalies = raw.filter((l) => l.status === 'ANOMALY').length;
        const total    = raw.length || 1;
        const score    = Math.max(0, Math.round(100 - ((blocked + anomalies) / total) * 100));
        setLogs([...raw].reverse());
        setStats({ blocked, redacted, anomalies, score });
      }
    } catch (_) {}
  }, []);

  const clearLogs = async () => {
    try {
      await fetch('/api/secure-chat', { method: 'DELETE' });
      await fetchLogs();
    } catch (_) {
      setLogs([]);
      setStats({ blocked: 0, redacted: 0, anomalies: 0, score: 100 });
    }
  };

  useEffect(() => { fetchLogs(); }, []);
  useEffect(() => {
    setSelectedLogIndex(0);
  }, [logs.length]);

  useEffect(() => {
    const stopFallback = () => clearInterval(intervalRef.current);
    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.close();
        streamRef.current = null;
      }
    };

    if (!isLive) {
      stopStream();
      stopFallback();
      return () => {
        stopStream();
        stopFallback();
      };
    }

    try {
      const es = new EventSource('/api/secure-chat/stream');
      streamRef.current = es;

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (Array.isArray(data.logs)) setLogs(data.logs);
          if (data.stats) setStats(data.stats);
        } catch (_) {}
      };

      // Fallback to polling if SSE fails.
      es.onerror = () => {
        stopStream();
        if (!intervalRef.current) {
          fetchLogs();
          intervalRef.current = setInterval(fetchLogs, 3000);
        }
      };
    } catch (_) {
      fetchLogs();
      intervalRef.current = setInterval(fetchLogs, 3000);
    }

    return () => {
      stopStream();
      stopFallback();
    };
  }, [isLive, fetchLogs]);

  const scoreColor = stats.score >= 90 ? '#00e676' : stats.score >= 70 ? '#ffd600' : '#ff5252';
  const selectedLog = logs[selectedLogIndex] || null;

  const remediation = (log) => {
    if (!log) return 'Select an event to inspect its security context.';
    if (log.layer === 'INPUT_ANALYSIS' || log.status === 'BLOCKED') {
      return 'Reject the request, keep the original system prompt intact, and ask the user to rephrase with benign intent.';
    }
    if (log.layer === 'OUTPUT_ANALYSIS' || log.status === 'REDACTED') {
      return 'Serve only the redacted output, never raw secrets. Rotate any exposed credentials in upstream systems.';
    }
    if (log.layer === 'ANOMALY_DETECTION' || log.status === 'ANOMALY') {
      return 'Throttle this session, add cooldown, and require human verification for repeated abuse patterns.';
    }
    if (log.layer === 'FILE_SCANNER') {
      return 'Use redacted file contents only. Store sanitized copies and notify owner to clean source files.';
    }
    return 'No immediate action needed. Keep monitoring for repeated patterns.';
  };

  const STAT_CARDS = [
    { label: 'Security Score',   value: `${stats.score}%`, color: scoreColor,  icon: '🛡' },
    { label: 'Blocked Attacks',  value: stats.blocked,     color: '#ff5252',   icon: '⛔' },
    { label: 'Outputs Redacted', value: stats.redacted,    color: '#ffd600',   icon: '✂' },
    { label: 'Anomalies',        value: stats.anomalies,   color: '#ff6d00',   icon: '⚡' },
  ];

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      background: '#080c12',
      border: '1px solid #0d1826',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #0d1826',
        background: '#070e18',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ color: '#00e5ff', fontSize: '11px', letterSpacing: '2px', fontWeight: 700 }}>
            PROTECTION REPORT
          </div>
          <div style={{ color: '#2e4a62', fontSize: '10px', marginTop: '2px' }}>
            Everything we kept safe — invisible to your team
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Clear logs */}
          <button
            onClick={clearLogs}
            style={{
              background: 'rgba(255,82,82,0.08)',
              border: '1px solid rgba(255,82,82,0.25)',
              borderRadius: '6px', color: '#ff5252',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px', padding: '5px 10px',
              cursor: 'pointer', letterSpacing: '1px',
              transition: 'all 0.15s',
            }}
            title="Clear log display"
          >
            CLEAR REPORT
          </button>
          {/* Live / Pause */}
          <button
            onClick={() => setIsLive((v) => !v)}
            style={{
              background: isLive ? 'rgba(0,230,118,0.1)' : 'rgba(213,0,0,0.1)',
              border: `1px solid ${isLive ? 'rgba(0,230,118,0.3)' : 'rgba(213,0,0,0.3)'}`,
              borderRadius: '6px',
              color: isLive ? '#00e676' : '#ff5252',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px', padding: '5px 12px',
              cursor: 'pointer', letterSpacing: '1px',
            }}
          >
            {isLive ? '● LIVE' : '○ PAUSED'}
          </button>
        </div>
      </div>

      {/* ── Sparkline ── */}
      <Sparkline logs={logs} />

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '1px', background: '#0d1826',
        borderBottom: '1px solid #0d1826',
      }}>
        {STAT_CARDS.map((card) => (
          <div key={card.label} style={{
            padding: '12px 14px', background: '#080c12',
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            <div style={{ fontSize: '9px', color: '#2e4a62', letterSpacing: '1px' }}>
              {card.icon} {card.label.toUpperCase()}
            </div>
            <div style={{
              fontSize: '26px', fontWeight: 700, color: card.color,
              textShadow: `0 0 16px ${card.color}44`, lineHeight: 1,
            }}>
              {String(card.value).padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>

      {/* ── Log list ── */}
      <div ref={tableRef} style={{ maxHeight: '420px', overflowY: 'auto', padding: '8px' }}>
        {logs.length === 0 ? (
          <div style={{
            color: '#1e3347', fontSize: '12px',
            textAlign: 'center', padding: '40px 20px', letterSpacing: '1px',
          }}>
            Your team is working safely. We're watching silently.
          </div>
        ) : (
          logs.map((log, i) => {
            const s = STATUS_STYLES[log.status] || STATUS_STYLES.PASSED;
            return (
              <button key={i} onClick={() => setSelectedLogIndex(i)} style={{
                display: 'grid', gridTemplateColumns: '70px 1fr',
                gap: '8px', padding: '8px 10px',
                marginBottom: '4px', borderRadius: '6px',
                background: s.bg,
                border: `1px solid ${selectedLogIndex === i ? '#00e5ff66' : s.border}`,
                /* left-side glow stripe */
                borderLeft: `3px solid ${s.leftGlow}`,
                boxShadow: `inset 3px 0 10px ${s.leftGlow}18`,
                fontSize: '11px',
                animation: i === 0 ? 'sdFadeIn 0.4s ease' : undefined,
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
              }}>
                {/* Status + time */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: s.dot, boxShadow: `0 0 4px ${s.dot}`, flexShrink: 0,
                    }} />
                    <span style={{ color: s.text, fontSize: '9px', letterSpacing: '1px' }}>
                      {s.label ?? log.status}
                    </span>
                  </div>
                  <span style={{ color: '#1e3347', fontSize: '9px' }}>
                    {isMounted ? new Date(log.timestamp).toLocaleTimeString() : '--:--'}
                  </span>
                </div>

                {/* Layer + reason */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                  <div style={{
                    color: '#4a6880', fontSize: '9px',
                    letterSpacing: '1px', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <span>{layerIcon(log.layer)}</span>
                    <span>{log.layer}</span>
                  </div>
                  <div style={{ color: '#8fafc8', fontSize: '11px', lineHeight: '1.4' }}>
                    {log.reason}
                  </div>
                  {log.preview && (
                    <div style={{
                      color: '#2e4a62', fontSize: '10px', fontStyle: 'italic',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      "{log.preview}"
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ── Explainability panel ── */}
      <div style={{
        borderTop: '1px solid #0d1826',
        background: '#070e18',
        padding: '10px 12px 12px',
      }}>
        <div style={{ color: '#00e5ff', fontSize: '10px', letterSpacing: '1.5px', marginBottom: '6px' }}>
          EXPLAINABILITY PANEL
        </div>
        {!selectedLog ? (
          <div style={{ color: '#2e4a62', fontSize: '11px' }}>
            No event selected yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '6px' }}>
            <div style={{ color: '#6b8aa3', fontSize: '11px' }}>
              <span style={{ color: '#9cc2dd' }}>Trigger:</span> {selectedLog.layer} / {selectedLog.status}
            </div>
            <div style={{ color: '#6b8aa3', fontSize: '11px' }}>
              <span style={{ color: '#9cc2dd' }}>Why:</span> {selectedLog.reason}
            </div>
            <div style={{ color: '#6b8aa3', fontSize: '11px' }}>
              <span style={{ color: '#9cc2dd' }}>Remediation:</span> {remediation(selectedLog)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sdFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
