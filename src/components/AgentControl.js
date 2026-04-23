'use client';

import { useState, useEffect } from 'react';

const AGENT_NAMES = ['emailAgent', 'dataAgent', 'codeAgent'];

const AGENT_LABELS = {
  emailAgent: '📧 Email Assistant',
  dataAgent:  '🗄️  Data Analyst',
  codeAgent:  '💻 Code Reviewer',
};

/* ─────────────────────────────────────────────────────────── styles ── */
const styles = {
  root: {
    background: '#070d14',
    border: '1px solid #0d2137',
    borderRadius: '12px',
    padding: '28px',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    color: '#c9d8e8',
    maxWidth: '860px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#4a7fa5',
    marginBottom: '12px',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #0d2137',
    margin: '24px 0',
  },

  /* agent selector */
  agentBtnRow: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  agentBtn: (active) => ({
    flex: 1,
    minWidth: '140px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1px solid ${active ? '#00e5ff' : '#0d2137'}`,
    background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
    color: active ? '#00e5ff' : '#4a7fa5',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    boxShadow: active ? '0 0 12px rgba(0,229,255,0.18)' : 'none',
  }),

  /* permission tag columns */
  permGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  permCol: { display: 'flex', flexDirection: 'column', gap: '6px' },
  permColTitle: (color) => ({
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color,
    marginBottom: '4px',
  }),
  tag: (color, bg) => ({
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    background: bg,
    color,
    border: `1px solid ${color}33`,
    width: 'fit-content',
  }),

  /* action tester */
  inputRow: { display: 'flex', gap: '10px', marginBottom: '14px' },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: '#0a1520',
    border: '1px solid #0d2137',
    borderRadius: '8px',
    color: '#c9d8e8',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
  },
  execBtn: (loading) => ({
    padding: '10px 22px',
    borderRadius: '8px',
    border: '1px solid #00e5ff',
    background: loading ? 'rgba(0,229,255,0.04)' : 'rgba(0,229,255,0.12)',
    color: '#00e5ff',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
  }),
  quickRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' },
  quickBtn: (variant) => ({
    padding: '5px 12px',
    borderRadius: '5px',
    border: `1px solid ${variant === 'allowed' ? '#00ff8822' : '#ff003322'}`,
    background: variant === 'allowed' ? 'rgba(0,255,136,0.06)' : 'rgba(255,0,51,0.06)',
    color: variant === 'allowed' ? '#00ff88' : '#ff4466',
    fontFamily: 'inherit',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }),

  /* result panel */
  resultPanel: (allowed) => ({
    padding: '20px',
    borderRadius: '10px',
    border: `1px solid ${allowed ? '#00ff8855' : '#ff003355'}`,
    background: allowed ? 'rgba(0,255,136,0.04)' : 'rgba(255,0,51,0.05)',
    boxShadow: allowed
      ? '0 0 20px rgba(0,255,136,0.06)'
      : '0 0 20px rgba(255,0,51,0.06)',
  }),
  resultVerdict: (allowed) => ({
    fontSize: '18px',
    fontWeight: 900,
    letterSpacing: '0.05em',
    color: allowed ? '#00ff88' : '#ff4466',
    marginBottom: '14px',
  }),
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px',
  },
  resultField: {
    background: '#0a1520',
    border: '1px solid #0d2137',
    borderRadius: '6px',
    padding: '10px 12px',
  },
  resultLabel: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#4a7fa5',
    marginBottom: '4px',
  },
  resultValue: (highlight) => ({
    fontSize: '13px',
    color: highlight || '#c9d8e8',
    fontWeight: highlight ? 700 : 400,
    wordBreak: 'break-all',
  }),
  threatBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '4px',
    background: 'rgba(255,68,102,0.15)',
    color: '#ff4466',
    border: '1px solid #ff446644',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },

  /* history */
  historyList: {
    maxHeight: '220px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingRight: '4px',
  },
  historyRow: (allowed) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '6px',
    background: '#0a1520',
    border: `1px solid ${allowed ? '#00ff8820' : '#ff003320'}`,
    fontSize: '12px',
  }),
  historyBadge: (allowed) => ({
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    background: allowed ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)',
    color: allowed ? '#00ff88' : '#ff4466',
    border: `1px solid ${allowed ? '#00ff8844' : '#ff446644'}`,
    flexShrink: 0,
  }),
  historyTime: { color: '#2e5472', fontSize: '10px', flexShrink: 0 },
  historyAgent: { color: '#4a7fa5', flexShrink: 0 },
  historyAction: { color: '#c9d8e8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  emptyState: {
    textAlign: 'center',
    color: '#2e5472',
    fontSize: '12px',
    padding: '20px 0',
    letterSpacing: '0.06em',
  },
};

/* ──────────────────────────────────────────────────────── component ── */
export default function AgentControl() {
  const [agentProfiles, setAgentProfiles] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('emailAgent');
  const [customAction, setCustomAction]   = useState('');
  const [result,       setResult]         = useState(null);
  const [loading,      setLoading]        = useState(false);
  const [history,      setHistory]        = useState([]);

  /* ── load profiles on mount ── */
  useEffect(() => {
    fetch('/api/agent')
      .then((r) => r.json())
      .then(setAgentProfiles)
      .catch(console.error);
  }, []);

  const profile = agentProfiles?.[selectedAgent] ?? { allowed: [], restricted: [] };

  /* ── execute action ── */
  const executeAction = async (action = customAction) => {
    const act = action.trim();
    if (!act) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName: selectedAgent, action: act, sessionId: 'demo-session' }),
      });
      const data = await res.json();
      const entry = { ...data, action: act, agentName: selectedAgent, ts: new Date() };
      setResult(entry);
      setHistory((prev) => [entry, ...prev].slice(0, 8));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickRun = (action) => {
    setCustomAction(action);
    executeAction(action);
  };

  const fmt = (d) =>
    d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  /* ── render ── */
  return (
    <div style={styles.root}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '22px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '3px', color: '#00e5ff', marginBottom: '4px', margin: '0 0 4px' }}>⚙ ACCESS CONTROL POLICIES</p>
        <p style={{ fontSize: '11px', color: '#2e5472', letterSpacing: '1px', margin: 0 }}>Define exactly what your AI can and cannot do</p>
      </div>

      {/* ── Agent Selector ── */}
      <p style={styles.sectionTitle}>Select AI Role</p>
      <div style={styles.agentBtnRow}>
        {AGENT_NAMES.map((name) => (
          <button
            key={name}
            style={styles.agentBtn(selectedAgent === name)}
            onClick={() => { setSelectedAgent(name); setResult(null); setCustomAction(''); }}
          >
            {AGENT_LABELS[name]}
          </button>
        ))}
      </div>

      {/* permission grid */}
      {agentProfiles ? (
        <div style={styles.permGrid}>
          <div style={styles.permCol}>
            <p style={styles.permColTitle('#00ff88')}>✓ Allowed Actions</p>
            {profile.allowed.map((a) => (
              <span key={a} style={styles.tag('#00ff88', 'rgba(0,255,136,0.08)')}>{a}</span>
            ))}
          </div>
          <div style={styles.permCol}>
            <p style={styles.permColTitle('#ff4466')}>⛔ Restricted Actions</p>
            {profile.restricted.map((a) => (
              <span key={a} style={styles.tag('#ff4466', 'rgba(255,68,102,0.08)')}>{a}</span>
            ))}
          </div>
        </div>
      ) : (
        <p style={styles.emptyState}>Loading profiles…</p>
      )}

      <hr style={styles.divider} />

      {/* ── Action Tester ── */}
      <p style={styles.sectionTitle}>POLICY TESTER</p>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          type="text"
          placeholder="Type an action name…"
          value={customAction}
          onChange={(e) => setCustomAction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeAction()}
        />
        <button
          style={styles.execBtn(loading)}
          onClick={() => executeAction()}
          disabled={loading}
        >
          {loading ? 'RUNNING…' : '▶ VALIDATE ACCESS'}
        </button>
      </div>

      {agentProfiles && (
        <>
          <div style={styles.quickRow}>
            {profile.allowed.map((a) => (
              <button key={a} style={styles.quickBtn('allowed')} onClick={() => quickRun(a)}>
                ✓ {a}
              </button>
            ))}
          </div>
          <div style={styles.quickRow}>
            {profile.restricted.map((a) => (
              <button key={a} style={styles.quickBtn('restricted')} onClick={() => quickRun(a)}>
                ⛔ {a}
              </button>
            ))}
          </div>
        </>
      )}

      <hr style={styles.divider} />

      {/* ── Result Panel ── */}
      <p style={styles.sectionTitle}>EVALUATION RESULT</p>

      {result ? (
        <div style={styles.resultPanel(result.allowed)}>
          <p style={styles.resultVerdict(result.allowed)}>
            {result.allowed ? '✓ ACTION AUTHORIZED' : '⛔ ACTION BLOCKED'}
          </p>

          <div style={styles.resultGrid}>
            <div style={styles.resultField}>
              <p style={styles.resultLabel}>Agent</p>
              <p style={styles.resultValue('#00e5ff')}>{result.agentName}</p>
            </div>
            <div style={styles.resultField}>
              <p style={styles.resultLabel}>Action</p>
              <p style={styles.resultValue()}>{result.action}</p>
            </div>
            {result.reason && (
              <div style={styles.resultField}>
                <p style={styles.resultLabel}>Reason</p>
                <p style={styles.resultValue()}>{result.reason}</p>
              </div>
            )}
            {result.result && (
              <div style={styles.resultField}>
                <p style={styles.resultLabel}>Result</p>
                <p style={styles.resultValue('#00ff88')}>{result.result}</p>
              </div>
            )}
            {result.threatLevel && (
              <div style={styles.resultField}>
                <p style={styles.resultLabel}>Threat Level</p>
                <span style={styles.threatBadge}>🔴 {result.threatLevel}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p style={styles.emptyState}>No action executed yet — select an agent and run an action above.</p>
      )}

      <hr style={styles.divider} />

      {/* ── History Log ── */}
      <p style={styles.sectionTitle}>ACCESS AUDIT LOG</p>

      {history.length === 0 ? (
        <p style={styles.emptyState}>No history yet.</p>
      ) : (
        <div style={styles.historyList}>
          {history.map((h, i) => (
            <div key={i} style={styles.historyRow(h.allowed)}>
              <span style={styles.historyTime}>{fmt(h.ts)}</span>
              <span style={styles.historyAgent}>{h.agentName}</span>
              <span style={styles.historyAction}>{h.action}</span>
              <span style={styles.historyBadge(h.allowed)}>
                {h.allowed ? 'ALLOWED' : 'BLOCKED'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
