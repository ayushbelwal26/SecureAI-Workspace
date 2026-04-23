'use client';

import { useState } from 'react';

/* ─────────────────────────────────────────── sample payloads ── */
const SAMPLES = [
  {
    label: 'API Key Leak',
    text: 'Here is your config: API_KEY=AIzaSyAbc123XYZ789 and connect to the database at db.internal.com',
  },
  {
    label: 'Password Exposed',
    text: 'Your credentials are username: admin password: SuperSecret123! please keep safe',
  },
  {
    label: 'Credit Card',
    text: 'Payment processed for card 4532 1234 5678 9010 expiry 12/26 CVV 123',
  },
  {
    label: 'Multiple Secrets',
    text: 'Token: Bearer eyJhbGciOiJIUzI1NiJ9.abc123 and SSN: 123-45-6789 on file',
  },
];

/* ─────────────────────────────────────────── scan patterns ── */
const PATTERNS = [
  { name: 'Google API Key',   regex: /AIza[0-9A-Za-z\-_]{10,}/g,                          replacement: '[GOOGLE_API_KEY_REDACTED]' },
  { name: 'Password',         regex: /password[\s:=]+\S+/gi,                               replacement: '[PASSWORD_REDACTED]' },
  { name: 'Credit Card',      regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,      replacement: '[CARD_NUMBER_REDACTED]' },
  { name: 'SSN',              regex: /\b\d{3}-\d{2}-\d{4}\b/g,                             replacement: '[SSN_REDACTED]' },
  { name: 'Bearer Token',     regex: /Bearer [a-zA-Z0-9\-._~+/]+=*/g,                      replacement: '[AUTH_TOKEN_REDACTED]' },
  { name: 'API Key (generic)',regex: /API_KEY[\s:=]+\S+/gi,                                 replacement: '[API_KEY_REDACTED]' },
  { name: 'Internal IP',      regex: /\b10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+\b/g,         replacement: '[INTERNAL_IP_REDACTED]' },
  { name: 'Stripe Secret Key',regex: /sk_live_[a-zA-Z0-9]{8,}/g,                            replacement: '[STRIPE_KEY_REDACTED]'  },
  { name: 'Stripe Test Key',  regex: /sk_test_[a-zA-Z0-9]{8,}/g,                            replacement: '[STRIPE_KEY_REDACTED]'  },
];

/* ─────────────────────────────────────── highlight helpers ── */
// Wrap every [*_REDACTED] token in the redacted string with a marker
// we then split on when rendering.
const REDACT_RE = /(\[[A-Z_]+_REDACTED\])/g;

function HighlightedText({ text, variant }) {
  // variant: 'raw' (red highlights on found patterns) | 'clean' (green on redact tokens)
  if (!text) return null;

  if (variant === 'clean') {
    const parts = text.split(REDACT_RE);
    return (
      <>
        {parts.map((part, i) =>
          REDACT_RE.test(part) ? (
            <mark key={i} style={{
              background: 'rgba(0,255,136,0.18)',
              color: '#00ff88',
              borderRadius: '3px',
              padding: '0 3px',
              fontWeight: 700,
            }}>{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  }

  // raw — highlight anything that will be caught by a pattern
  let marked = text;
  // Use a neutral placeholder so we don't double-highlight
  const spans = [];
  let remaining = text;
  // Collect all match ranges across all patterns
  const ranges = [];
  PATTERNS.forEach(({ regex }) => {
    const r = new RegExp(regex.source, regex.flags);
    let m;
    while ((m = r.exec(text)) !== null) {
      ranges.push([m.index, m.index + m[0].length]);
    }
  });
  // Merge overlapping ranges
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of ranges) {
    if (merged.length && s <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    } else {
      merged.push([s, e]);
    }
  }
  // Build parts
  let cursor = 0;
  const rawParts = [];
  merged.forEach(([s, e], i) => {
    if (cursor < s) rawParts.push(<span key={`t${i}`}>{text.slice(cursor, s)}</span>);
    rawParts.push(
      <mark key={`m${i}`} style={{
        background: 'rgba(255,50,50,0.22)',
        color: '#ff6b6b',
        borderRadius: '3px',
        padding: '0 2px',
        fontWeight: 700,
      }}>{text.slice(s, e)}</mark>
    );
    cursor = e;
  });
  if (cursor < text.length) rawParts.push(<span key="tail">{text.slice(cursor)}</span>);
  return <>{rawParts.length ? rawParts : text}</>;
}

/* ────────────────────────────────────────────────── styles ── */
const S = {
  root: {
    background: '#070d14',
    border: '1px solid #0d2137',
    borderRadius: '12px',
    padding: '28px',
    fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
    color: '#c9d8e8',
    maxWidth: '960px',
    margin: '0 auto',
  },
  header: { marginBottom: '22px' },
  title: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '3px',
    color: '#00e5ff',
    marginBottom: '4px',
  },
  subtitle: { fontSize: '11px', color: '#2e5472', letterSpacing: '1px' },

  sampleRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' },
  sampleBtn: (active) => ({
    padding: '6px 14px',
    borderRadius: '6px',
    border: `1px solid ${active ? '#00e5ff66' : '#0d2137'}`,
    background: active ? 'rgba(0,229,255,0.1)' : 'transparent',
    color: active ? '#00e5ff' : '#4a7fa5',
    fontFamily: 'inherit',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.16s',
    letterSpacing: '0.5px',
  }),

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' },
  colTitle: (color = '#4a7fa5') => ({
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color,
    marginBottom: '10px',
  }),
  panel: (border = '#0d2137') => ({
    background: '#0a1520',
    border: `1px solid ${border}`,
    borderRadius: '8px',
    padding: '14px',
    minHeight: '160px',
    position: 'relative',
  }),
  textarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#c9d8e8',
    fontFamily: 'inherit',
    fontSize: '12px',
    lineHeight: '1.7',
    resize: 'vertical',
    minHeight: '130px',
  },
  textDisplay: {
    fontSize: '12px',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    minHeight: '130px',
  },
  awaiting: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '130px',
    color: '#1e3347',
    fontSize: '12px',
    gap: '8px',
    letterSpacing: '1px',
  },

  scanBtn: (scanning) => ({
    marginTop: '14px',
    width: '100%',
    padding: '11px',
    borderRadius: '8px',
    border: `1px solid ${scanning ? '#0d2137' : '#00e5ff88'}`,
    background: scanning ? 'rgba(0,229,255,0.03)' : 'rgba(0,229,255,0.1)',
    color: scanning ? '#2e5472' : '#00e5ff',
    fontFamily: 'inherit',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '2px',
    cursor: scanning ? 'not-allowed' : 'pointer',
    transition: 'all 0.18s',
  }),

  divider: { border: 'none', borderTop: '1px solid #0d2137', margin: '0 0 22px' },

  // badges
  badge: (color, bg) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    background: bg,
    color,
    border: `1px solid ${color}44`,
    letterSpacing: '0.5px',
  }),

  // report
  report: {
    background: '#0a1520',
    border: '1px solid #0d2137',
    borderRadius: '10px',
    padding: '20px',
  },
  reportTitle: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#4a7fa5',
    marginBottom: '16px',
  },
  reportGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    gap: '10px 16px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  reportCount: (color) => ({
    fontSize: '32px',
    fontWeight: 900,
    color,
    lineHeight: 1,
  }),
  verdict: (found) => ({
    marginTop: '16px',
    padding: '14px 18px',
    borderRadius: '8px',
    border: `1px solid ${found ? '#ff446644' : '#00ff8844'}`,
    background: found ? 'rgba(255,68,102,0.06)' : 'rgba(0,255,136,0.05)',
    color: found ? '#ff8099' : '#00ff88',
    fontSize: '13px',
    fontWeight: found ? 700 : 400,
    letterSpacing: '0.03em',
  }),
};

/* ──────────────────────────────────────────── component ── */
export default function OutputScanner() {
  const [inputText, setInputText] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning,  setScanning]  = useState(false);
  const [scanned,   setScanned]   = useState(false);
  const [active,    setActive]    = useState(null); // which sample is active

  const loadSample = (idx) => {
    setInputText(SAMPLES[idx].text);
    setScanResult(null);
    setScanned(false);
    setActive(idx);
  };

  const runScan = () => {
    if (!inputText.trim() || scanning) return;
    setScanning(true);

    setTimeout(() => {
      let redacted = inputText;
      const flagged = [];

      PATTERNS.forEach(({ name, regex, replacement }) => {
        const r = new RegExp(regex.source, regex.flags);
        const matches = inputText.match(r);
        if (matches && matches.length > 0) {
          flagged.push({ name, count: matches.length });
          redacted = redacted.replace(new RegExp(regex.source, regex.flags), replacement);
        }
      });

      setScanResult({
        clean: flagged.length === 0,
        redacted,
        flagged,
      });
      setScanning(false);
      setScanned(true);
    }, 800);
  };

  const threatCount = scanResult?.flagged?.reduce((sum, f) => sum + f.count, 0) ?? 0;

  return (
    <div style={S.root}>

      {/* ── Header ── */}
      <div style={S.header}>
        <p style={S.title}>🔍 OUTPUT SANITIZATION LAYER</p>
        <p style={S.subtitle}>Prevents sensitive data from reaching users</p>
      </div>

      {/* ── Sample buttons ── */}
      <div style={S.sampleRow}>
        {SAMPLES.map((s, i) => (
          <button key={i} style={S.sampleBtn(active === i)} onClick={() => loadSample(i)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div style={S.grid}>

        {/* LEFT — raw input */}
        <div>
          <p style={S.colTitle('#ff6b6b')}>⚠ Raw AI Response (Unsanitized)</p>
          <div style={S.panel(scanned && !scanResult?.clean ? '#ff446633' : '#0d2137')}>
            {scanned ? (
              <div style={S.textDisplay}>
                <HighlightedText text={inputText} variant="raw" />
              </div>
            ) : (
              <textarea
                style={S.textarea}
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setScanResult(null); setScanned(false); setActive(null); }}
                placeholder="Paste a simulated AI response here, or load a sample above…"
              />
            )}
          </div>
          <button style={S.scanBtn(scanning)} onClick={runScan} disabled={scanning || !inputText.trim()}>
            {scanning ? '⟳ SCANNING…' : '▶ SCAN OUTPUT'}
          </button>
        </div>

        {/* RIGHT — sanitized output */}
        <div>
          <p style={S.colTitle('#00ff88')}>✓ Sanitized Output</p>
          <div style={S.panel(scanned && !scanResult?.clean ? '#00ff8822' : '#0d2137')}>
            {!scanned ? (
              <div style={S.awaiting}>
                <span style={{ fontSize: '22px' }}>🔒</span>
                <span>Awaiting scan…</span>
              </div>
            ) : (
              <>
                <div style={S.textDisplay}>
                  <HighlightedText text={scanResult.redacted} variant="clean" />
                </div>
                {scanResult.flagged.length > 0 && (
                  <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {scanResult.flagged.map((f, i) => (
                      <span key={i} style={S.badge('#ff8099', 'rgba(255,68,102,0.12)')}>
                        🚨 {f.name} ×{f.count}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Scan report ── */}
      {scanned && (
        <>
          <hr style={S.divider} />
          <div style={S.report}>
            <p style={S.reportTitle}>📋 Scan Report</p>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', flexWrap: 'wrap' }}>
              {/* big number */}
              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={S.reportCount(threatCount > 0 ? '#ff4466' : '#00ff88')}>
                  {threatCount}
                </div>
                <div style={{ fontSize: '9px', color: '#2e5472', letterSpacing: '1px', marginTop: '4px' }}>
                  THREATS FOUND
                </div>
              </div>

              {/* threat list */}
              <div style={{ flex: 1 }}>
                {scanResult.flagged.length === 0 ? (
                  <span style={S.badge('#00ff88', 'rgba(0,255,136,0.1)')}>✓ CLEAN</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {scanResult.flagged.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={S.badge('#ff8099', 'rgba(255,68,102,0.1)')}>
                          {f.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#4a7fa5' }}>
                          {f.count} instance{f.count !== 1 ? 's' : ''} detected &amp; redacted
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* verdict banner */}
            <div style={S.verdict(threatCount > 0)}>
              {threatCount > 0
                ? '⚠ This response was intercepted and sanitized before reaching the user'
                : '✓ Response passed all security checks'}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
