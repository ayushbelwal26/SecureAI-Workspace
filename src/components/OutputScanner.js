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
  { name: 'Google API Key',        regex: /AIza[0-9A-Za-z\-_]{10,}/g,                          replacement: '[GOOGLE_API_KEY_REDACTED]' },
  { name: 'OpenAI API Key',        regex: /sk-[A-Za-z0-9]{20,}/g,                              replacement: '[OPENAI_KEY_REDACTED]' },
  { name: 'AWS Access Key ID',     regex: /AKIA[0-9A-Z]{16}/g,                                 replacement: '[AWS_KEY_REDACTED]' },
  { name: 'AWS Secret Access Key', regex: /aws_secret_access_key\s*[:=]\s*['"]?[a-zA-Z0-9/+=]{40}['"]?/gi, replacement: '[AWS_SECRET_REDACTED]' },
  { name: 'Stripe Live Secret Key',regex: /sk_live_[a-zA-Z0-9]{8,}/g,                            replacement: '[STRIPE_LIVE_KEY_REDACTED]' },
  { name: 'Stripe Test Secret Key',regex: /sk_test_[a-zA-Z0-9]{8,}/g,                            replacement: '[STRIPE_TEST_KEY_REDACTED]' },
  { name: 'Private Key (PEM)',     regex: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----[\s\S]*?-----END (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/g, replacement: '[PRIVATE_KEY_REDACTED]' },
  { name: 'Database URL',          regex: /(mongodb(\+srv)?|postgresql|mysql):\/\/[^\s]+/gi, replacement: '[DB_URL_REDACTED]' },
  { name: 'Redis Connection',      regex: /redis[s]?:\/\/[^\s]+/gi,                            replacement: '[REDIS_URL_REDACTED]' },
  { name: 'RabbitMQ (AMQP)',       regex: /amqp[s]?:\/\/[^\s]+/gi,                             replacement: '[AMQP_URL_REDACTED]' },
  { name: 'Cloud Storage (S3/GCS)',regex: /(s3|gs):\/\/[^\s]+/gi,                              replacement: '[CLOUD_STORAGE_REDACTED]' },
  { name: 'Azure Storage',         regex: /DefaultEndpointsProtocol=(http|https);AccountName=.*;AccountKey=[a-zA-Z0-9+/=]+/gi, replacement: '[AZURE_STORAGE_REDACTED]' },
  { name: 'JWT Secret',            regex: /jwt[_-]?secret[\s:=]+\S+/gi,                        replacement: '[JWT_SECRET_REDACTED]' },
  { name: 'Bearer Token',          regex: /Bearer [a-zA-Z0-9\-._~+/]+=*/g,                      replacement: '[AUTH_TOKEN_REDACTED]' },
  { name: 'Password',              regex: /password[\s:=]+['"]?\S+['"]?/gi,                    replacement: '[PASSWORD_REDACTED]' },
  { name: 'API Key (generic)',     regex: /(?:api[_-]?key|apikey)[\s:=]+['"]?\S+['"]?/gi,      replacement: '[API_KEY_REDACTED]' },
  { name: 'Internal IP',           regex: /\b10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+\b/g,         replacement: '[INTERNAL_IP_REDACTED]' },
  { name: 'Credit Card Number',    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g, replacement: '[CARD_NUMBER_REDACTED]' },
  { name: 'Social Security Number',regex: /\b(?!000)(?!666)(?!9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  { name: 'GitHub PAT',            regex: /ghp_[a-zA-Z0-9]{36}/g,                              replacement: '[GITHUB_PAT_REDACTED]' },
  { name: 'GitHub OAuth',          regex: /gho_[a-zA-Z0-9]{36}/g,                              replacement: '[GITHUB_OAUTH_REDACTED]' },
  { name: 'Slack Token',           regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,                    replacement: '[SLACK_TOKEN_REDACTED]' },
  { name: 'Slack Webhook',         regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8}\/B[a-zA-Z0-9_]{8}\/[a-zA-Z0-9_]{24}/g, replacement: '[SLACK_WEBHOOK_REDACTED]' },
  { name: 'Mailgun API Key',       regex: /key-[0-9a-zA-Z]{32}/g,                              replacement: '[MAILGUN_KEY_REDACTED]' },
  { name: 'Twilio API Key',        regex: /SK[0-9a-fA-F]{32}/g,                                replacement: '[TWILIO_KEY_REDACTED]' },
  { name: 'Square Access Token',   regex: /sq0atp-[0-9A-Za-z\-_]{22}/g,                        replacement: '[SQUARE_TOKEN_REDACTED]' },
  { name: 'Square OAuth Secret',   regex: /sq0csp-[0-9A-Za-z\-_]{43}/g,                        replacement: '[SQUARE_SECRET_REDACTED]' },
  { name: 'PayPal Braintree',      regex: /access_token\$production\$[0-9a-zA-Z]{16}\$[0-9a-fA-F]{32}/g, replacement: '[PAYPAL_TOKEN_REDACTED]' },
  { name: 'SendGrid API Key',      regex: /SG\.[0-9a-zA-Z\-_]{22}\.[0-9a-zA-Z\-_]{43}/g,       replacement: '[SENDGRID_KEY_REDACTED]' },
  { name: 'Discord Bot Token',     regex: /[MN][a-zA-Z0-9_-]{23,28}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27}/g, replacement: '[DISCORD_TOKEN_REDACTED]' },
  { name: 'Discord Webhook',       regex: /https:\/\/discord\.com\/api\/webhooks\/[0-9]{17,19}\/[a-zA-Z0-9_-]+/g, replacement: '[DISCORD_WEBHOOK_REDACTED]' },
  { name: 'Shopify Access Token',  regex: /shpat_[a-fA-F0-9]{32}/g,                            replacement: '[SHOPIFY_TOKEN_REDACTED]' },
  { name: 'Figma PAT',             regex: /figd_[a-zA-Z0-9\-_]{43}/g,                          replacement: '[FIGMA_PAT_REDACTED]' },
  { name: 'GitLab PAT',            regex: /glpat-[0-9a-zA-Z\-_]{20}/g,                         replacement: '[GITLAB_PAT_REDACTED]' },
  { name: 'NPM Access Token',      regex: /npm_[a-zA-Z0-9]{36}/g,                              replacement: '[NPM_TOKEN_REDACTED]' },
  { name: 'Telegram Bot Token',    regex: /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/g,                    replacement: '[TELEGRAM_TOKEN_REDACTED]' },
  { name: 'Asana PAT',             regex: /1\/\d{16}\/[a-zA-Z0-9]{32}/g,                       replacement: '[ASANA_PAT_REDACTED]' },
  { name: 'Bitbucket Client ID',   regex: /[A-Za-z0-9]{32}/g,                                  replacement: '[BITBUCKET_CLIENT_ID_REDACTED]' },
  { name: 'Datadog Access Token',  regex: /[a-fA-F0-9]{32}/g,                                  replacement: '[DATADOG_TOKEN_REDACTED]' },
  { name: 'GCP OAuth Client ID',   regex: /[0-9]+-[0-9a-zA-Z_]{32}\.apps\.googleusercontent\.com/g, replacement: '[GCP_OAUTH_REDACTED]' }
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
