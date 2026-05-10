import { NextResponse } from 'next/server';
import SecurityMiddleware from '@/lib/SecurityMiddleware';
import { SECRET_PATTERNS, CRITICAL_IDS } from '@/lib/patterns';

/* ── Shared singleton — survives hot-reloads in development ── */
const middleware =
  global.__secureai_middleware ||
  (global.__secureai_middleware = new SecurityMiddleware());

/* ── Max content size: 500 KB ── */
const MAX_BYTES = 500 * 1024;
const BROAD_PATTERN_IDS = new Set([
  'api_key_generic',
  'password_literal',
  'internal_ip',
]);

function confidenceForFinding({ severity, id, count }) {
  const base = severity === 'CRITICAL' ? 95 : severity === 'HIGH' ? 86 : 74;
  const volumeBoost = Math.min(8, Math.round(Math.log2((count || 1) + 1) * 2));
  const broadPenalty = BROAD_PATTERN_IDS.has(id) ? 10 : 0;
  return Math.max(55, Math.min(99, base + volumeBoost - broadPenalty));
}

function evidenceFromMatch(match) {
  const raw = String(match || '');
  const trimmed = raw.length > 36 ? `${raw.slice(0, 18)}...${raw.slice(-10)}` : raw;
  return trimmed.replace(/[A-Za-z0-9]/g, '•');
}

/* ─────────────────────────────────────────────────────────────
   POST /api/scan-file
   Body Option A: { fileName, secretCount, criticalCount }
   Body Option B: { fileName, content }
───────────────────────────────────────────────────────────── */
export async function POST(request) {
  try {
    const body = await request.json();
    const { fileName = 'unknown', secretCount, criticalCount, content } = body;

    /* ── Option A: pre-computed stats from the client scanner ── */
    if (typeof secretCount === 'number' && typeof criticalCount === 'number') {
      middleware.detectAnomaly('file-scanner', 'file_scan');
      middleware.logFileScan(fileName, secretCount, criticalCount);
      return NextResponse.json({ logged: true });
    }

    /* ── Option B: full server-side scan ── */
    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Body must contain either { secretCount, criticalCount } or { content }.' },
        { status: 400 }
      );
    }

    /* Size guard */
    const byteLength = Buffer.byteLength(content, 'utf8');
    if (byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: `Content exceeds maximum size of 500 KB (${byteLength} bytes received).` },
        { status: 413 }
      );
    }

    /* Anomaly detection on every scan */
    middleware.detectAnomaly('file-scanner', 'file_scan');

    /* Run all patterns */
    let redactedContent = content;
    const findings      = [];
    let secretCountCalc   = 0;
    let criticalCountCalc = 0;

    for (const pattern of SECRET_PATTERNS) {
      // Re-instantiate regex to guarantee lastIndex is reset
      const re      = new RegExp(pattern.regex.source, pattern.regex.flags);
      const matches = content.match(re);

      if (matches && matches.length > 0) {
        const count = matches.length;
        secretCountCalc   += count;
        if (CRITICAL_IDS.has(pattern.id)) criticalCountCalc += count;

        findings.push({
          id:        pattern.id,
          name:      pattern.name,
          severity:  pattern.severity,
          count,
          confidence: confidenceForFinding({ severity: pattern.severity, id: pattern.id, count }),
          evidence: evidenceFromMatch(matches[0]),
          redaction: pattern.redaction,
        });

        redactedContent = redactedContent.replace(
          new RegExp(pattern.regex.source, pattern.regex.flags),
          pattern.redaction
        );
      }
    }

    const clean     = findings.length === 0;
    const lineCount = content.split('\n').length;

    /* Log to the security dashboard */
    middleware.logFileScan(fileName, secretCountCalc, criticalCountCalc);

    return NextResponse.json({
      clean,
      secretCount:    secretCountCalc,
      criticalCount:  criticalCountCalc,
      findings,
      redactedContent,
      lineCount,
    });
  } catch (error) {
    console.error('scan-file POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/scan-file
   Returns the full pattern catalog for UI display.
───────────────────────────────────────────────────────────── */
export async function GET() {
  const patterns = SECRET_PATTERNS.map(({ id, name, severity, redaction, why }) => ({
    id,
    name,
    severity,
    redaction,
    why,
  }));

  return NextResponse.json({
    patternCount: patterns.length,
    patterns,
  });
}
