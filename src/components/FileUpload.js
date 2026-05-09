'use client';

import { useState, useRef } from 'react';
import { SECRET_PATTERNS } from '@/lib/patterns';

/* ─────────────────────────────────────────── scan patterns ── */
const PATTERNS = SECRET_PATTERNS.map((p) => ({
  id: p.id,
  name: p.name,
  severity: p.severity,
  regex: p.regex,
  replacement: p.redaction,
}));
const PATTERN_COUNT = PATTERNS.length;

/* ─────────────────────────────────────── scan a single file ── */
function scanContent(raw) {
  let redacted = raw;
  const flagged = [];

  PATTERNS.forEach(({ id, name, severity, regex, replacement }) => {
    const r = new RegExp(regex.source, regex.flags);
    const matches = raw.match(r);
    if (matches && matches.length > 0) {
      flagged.push({ id, name, severity, count: matches.length });
      redacted = redacted.replace(new RegExp(regex.source, regex.flags), replacement);
    }
  });

  return { clean: flagged.length === 0, flagged, redacted };
}

/* ──────────────────────────── format bytes helper ── */
function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/* ──────────────────────────────────────────── styles ── */
const S = {
  root: {
    background: '#080c12',
    border: '1px solid #0d1826',
    borderRadius: '12px',
    padding: '28px',
    fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
    color: '#c9d8e8',
    maxWidth: '960px',
    margin: '0 auto',
  },

  /* header */
  title: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '3px',
    color: '#00e5ff',
    marginBottom: '4px',
  },
  subtitle: { fontSize: '11px', color: '#2e5472', letterSpacing: '1px', marginBottom: '24px' },

  /* drop zone */
  dropZone: (over) => ({
    border: `2px dashed ${over ? '#00e5ff' : '#0d1826'}`,
    borderRadius: '12px',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: over ? 'rgba(0,229,255,0.04)' : 'rgba(10,21,32,0.6)',
    boxShadow: over ? '0 0 24px rgba(0,229,255,0.12)' : 'none',
    marginBottom: '28px',
    userSelect: 'none',
  }),
  cloudIcon: {
    fontSize: '52px',
    marginBottom: '12px',
    display: 'block',
    filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.4))',
  },
  dropMain: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#c9d8e8',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  dropOr: { fontSize: '12px', color: '#2e5472', marginBottom: '10px' },
  dropHint: {
    fontSize: '11px',
    color: '#1e3347',
    letterSpacing: '1px',
    marginTop: '8px',
  },

  /* file card */
  card: (status) => ({
    background: '#0a1520',
    border: `1px solid ${
      status === 'clean'  ? '#00ff9d33' :
      status === 'danger' ? '#ff2d5533' :
      '#0d1826'
    }`,
    borderRadius: '10px',
    padding: '18px 20px',
    marginBottom: '14px',
    transition: 'border-color 0.3s',
  }),
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '10px',
  },
  fileName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#c9d8e8',
    wordBreak: 'break-all',
  },
  fileSize: {
    fontSize: '11px',
    color: '#2e5472',
    marginTop: '2px',
  },
  scanning: {
    fontSize: '12px',
    color: '#00e5ff',
    letterSpacing: '2px',
    animation: 'pulse 1s ease-in-out infinite',
  },
  statusClean: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#00ff9d',
    letterSpacing: '1px',
  },
  statusDanger: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#ff2d55',
    letterSpacing: '1px',
  },

  /* badge */
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    background: 'rgba(255,45,85,0.12)',
    color: '#ff6b8a',
    border: '1px solid #ff2d5544',
    letterSpacing: '0.5px',
  },

  /* preview */
  preview: {
    marginTop: '12px',
    background: '#070e18',
    border: '1px solid #0d1826',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '11px',
    lineHeight: '1.7',
    color: '#4a7fa5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '120px',
    overflowY: 'auto',
  },
  previewLabel: {
    fontSize: '9px',
    color: '#1e3347',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },

  /* use-in-chat button */
  useBtn: {
    marginTop: '12px',
    padding: '7px 16px',
    borderRadius: '6px',
    border: '1px solid #00e5ff55',
    background: 'rgba(0,229,255,0.08)',
    color: '#00e5ff',
    fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    cursor: 'pointer',
    transition: 'all 0.16s',
  },
  useBtnCopied: {
    marginTop: '12px',
    padding: '7px 16px',
    borderRadius: '6px',
    border: '1px solid #00ff9d55',
    background: 'rgba(0,255,157,0.08)',
    color: '#00ff9d',
    fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    cursor: 'default',
    transition: 'all 0.16s',
  },

  /* summary bar */
  summary: {
    marginTop: '24px',
    padding: '14px 20px',
    borderRadius: '8px',
    border: '1px solid #0d1826',
    background: '#0a1520',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },
  summaryItem: {
    fontSize: '12px',
    color: '#4a7fa5',
    letterSpacing: '0.5px',
  },
  summaryNum: (color = '#00e5ff') => ({
    fontWeight: 900,
    color,
    fontSize: '14px',
  }),
  divider: {
    width: '1px',
    height: '18px',
    background: '#0d1826',
  },
};

/* ─────────────────────────────── scanResult status key ── */
// 'idle' | 'scanning' | 'clean' | 'danger'
function cardStatus(file) {
  if (file.scanning) return 'scanning';
  if (!file.scanResult) return 'idle';
  return file.scanResult.clean ? 'clean' : 'danger';
}

/* ──────────────────────────────────────── component ── */
export default function FileUpload({ onScanComplete }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const fileInputRef = useRef(null);

  /* ── process a FileList ── */
  const processFiles = (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    // Append new file stubs (scanning = true)
    const newEntries = files.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      content: '',
      scanResult: null,
      scanning: true,
    }));

    setUploadedFiles((prev) => [...prev, ...newEntries]);
    setScanning(true);

    files.forEach((f, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target.result;

        setTimeout(() => {
          const result = scanContent(raw);

          setUploadedFiles((prev) =>
            prev.map((entry) =>
              entry.id === newEntries[idx].id
                ? { ...entry, content: raw, scanResult: result, scanning: false }
                : entry
            )
          );

          // Clear global scanning flag when all files done
          setUploadedFiles((prev) => {
            const anyStillScanning = prev.some((e) => e.scanning);
            if (!anyStillScanning) setScanning(false);
            return prev;
          });

          // Fire-and-forget: log scan report to security dashboard
          const secretCount   = result.flagged.reduce((s, fl) => s + fl.count, 0);
          const criticalCount = result.flagged
            .filter((fl) => fl.severity === 'CRITICAL')
            .reduce((s, fl) => s + fl.count, 0);
          if (onScanComplete) onScanComplete({ fileName: f.name, secretCount, criticalCount, redactedText: result.redacted });
          fetch('/api/secure-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: '__FILE_SCAN_REPORT__',
              fileScan: {
                fileName:      f.name,
                secretCount,
                criticalCount,
              },
            }),
          }).catch(() => {});
        }, 1000);
      };

      reader.onerror = () => {
        setUploadedFiles((prev) =>
          prev.map((entry) =>
            entry.id === newEntries[idx].id
              ? { ...entry, scanResult: { clean: true, flagged: [], redacted: '(unreadable binary file)' }, scanning: false }
              : entry
          )
        );
      };

      reader.readAsText(f);
    });
  };

  /* ── drag handlers ── */
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  /* ── click to browse ── */
  const onInputChange = (e) => processFiles(e.target.files);

  /* ── copy redacted content for chat ── */
  const useInChat = (idx) => {
    const file = uploadedFiles[idx];
    if (!file?.scanResult) return;
    const context = `[FILE: ${file.name}]\n${file.scanResult.redacted}`;
    navigator.clipboard.writeText(context).then(() => {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  /* ── summary stats ── */
  const scannedFiles  = uploadedFiles.filter((f) => f.scanResult);
  const totalSecrets  = scannedFiles.reduce(
    (sum, f) => sum + f.scanResult.flagged.reduce((s, fl) => s + fl.count, 0),
    0
  );
  const cleanFiles    = scannedFiles.filter((f) => f.scanResult.clean).length;

  /* ─────────────── render ─────────────── */
  return (
    <div style={S.root}>

      {/* ── keyframe for scanning pulse ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes scanLine {
          0%   { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
        .fu-use-btn:hover {
          background: rgba(0,229,255,0.16) !important;
          box-shadow: 0 0 12px rgba(0,229,255,0.2);
        }
      `}</style>

      {/* ── Header ── */}
      <p style={S.title}>🛡 FILE UPLOAD SCANNER</p>
      <p style={S.subtitle}>Scans files with {PATTERN_COUNT}+ regex patterns before they reach AI — redacts automatically</p>

      {/* ── Drop Zone ── */}
      <div
        style={S.dropZone(dragOver)}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="File upload drop zone"
      >
        <span style={S.cloudIcon}>☁</span>
        <p style={S.dropMain}>Drop your codebase files here</p>
        <p style={S.dropOr}>or click to browse</p>
        <p style={S.dropHint}>Accepts all file types (text files scan best) · {PATTERN_COUNT}+ detection patterns active</p>

        {/* Demo download link — stops propagation so it doesn't open the file picker */}
        <a
          href="/demo/sample.env"
          download="sample.env"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-block',
            marginTop: '14px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(255,170,0,0.35)',
            background: 'rgba(255,170,0,0.08)',
            color: '#ffaa00',
            fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ↓ DOWNLOAD DEMO .env FILE &nbsp;({PATTERN_COUNT}+ live secrets detectable)
        </a>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={onInputChange}
        />
      </div>

      {/* ── File Cards ── */}
      {uploadedFiles.length > 0 && (
        <div>
          {uploadedFiles.map((file, idx) => {
            const status = cardStatus(file);
            const totalFound = file.scanResult?.flagged?.reduce((s, f) => s + f.count, 0) ?? 0;

            return (
              <div key={file.id} style={S.card(status)}>

                {/* Card header: name + status */}
                <div style={S.cardHeader}>
                  <div>
                    <div style={S.fileName}>📄 {file.name}</div>
                    <div style={S.fileSize}>{fmtBytes(file.size)}</div>
                  </div>

                  <div>
                    {file.scanning && (
                      <span style={S.scanning}>⟳ SCANNING…</span>
                    )}
                    {!file.scanning && file.scanResult?.clean && (
                      <span style={S.statusClean}>✓ File is clean — safe to use with AI</span>
                    )}
                    {!file.scanning && file.scanResult && !file.scanResult.clean && (
                      <span style={S.statusDanger}>⚠ {totalFound} secret{totalFound !== 1 ? 's' : ''} found — automatically redacted</span>
                    )}
                  </div>
                </div>

                {/* Secret type badges */}
                {!file.scanning && file.scanResult?.flagged?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {file.scanResult.flagged.map((fl, fi) => (
                      <span key={fi} style={S.badge}>
                        🚨 {fl.name} ×{fl.count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Redacted preview */}
                {!file.scanning && file.scanResult && (
                  <>
                    <p style={S.previewLabel}>Redacted Preview</p>
                    <div style={S.preview}>
                      {file.scanResult.redacted.slice(0, 300)}
                      {file.scanResult.redacted.length > 300 && (
                        <span style={{ color: '#1e3347' }}> …(truncated)</span>
                      )}
                    </div>

                    {/* Use in chat button + Download Redacted button */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        className="fu-use-btn"
                        style={copiedIndex === idx ? S.useBtnCopied : S.useBtn}
                        onClick={() => useInChat(idx)}
                        disabled={copiedIndex === idx}
                      >
                        {copiedIndex === idx ? '✓ COPIED TO CLIPBOARD' : '⊕ USE IN CHAT'}
                      </button>

                      {!file.scanResult.clean && (() => {
                        const nameParts  = file.name.split('.');
                        const ext        = nameParts.length > 1 ? nameParts.pop() : '';
                        const base       = nameParts.join('.');
                        const dlName     = ext ? `${base}.redacted.${ext}` : `${file.name}.redacted`;
                        return (
                          <button
                            style={{
                              ...S.useBtn,
                              marginTop: S.useBtn.marginTop,
                              border: '1px solid rgba(255,214,0,0.35)',
                              background: 'rgba(255,214,0,0.08)',
                              color: '#ffd600',
                            }}
                            onClick={() => {
                              const blob = new Blob([file.scanResult.redacted], { type: 'text/plain' });
                              const url  = URL.createObjectURL(blob);
                              const a    = document.createElement('a');
                              a.href     = url;
                              a.download = dlName;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            ↓ DOWNLOAD REDACTED
                          </button>
                        );
                      })()}
                    </div>
                  </>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* ── Summary Bar ── */}
      {scannedFiles.length > 0 && (
        <div style={S.summary}>
          <span style={S.summaryItem}>
            <span style={S.summaryNum()}>
              {scannedFiles.length}
            </span>{' '}
            file{scannedFiles.length !== 1 ? 's' : ''} scanned
          </span>

          <div style={S.divider} />

          <span style={S.summaryItem}>
            <span style={S.summaryNum(totalSecrets > 0 ? '#ff2d55' : '#00ff9d')}>
              {totalSecrets}
            </span>{' '}
            secret{totalSecrets !== 1 ? 's' : ''} found
          </span>

          <div style={S.divider} />

          <span style={S.summaryItem}>
            <span style={S.summaryNum('#00ff9d')}>
              {cleanFiles}
            </span>{' '}
            file{cleanFiles !== 1 ? 's' : ''} clean
          </span>
        </div>
      )}

    </div>
  );
}
