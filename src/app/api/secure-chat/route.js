import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { SECRET_PATTERNS } from '@/lib/patterns';
import SecurityMiddleware from '@/lib/SecurityMiddleware';
import { ArmorIQClient } from '@armoriq/sdk';


function sha256Utf8(s) {
  return createHash('sha256').update(s ?? '', 'utf8').digest('hex');
}

/** True if `s` matches any egress secret detector (same catalog as analyzeOutput). */
function textHasDetectableSecrets(s) {
  const str = String(s || '');
  for (const p of SECRET_PATTERNS) {
    const re = new RegExp(p.regex.source, p.regex.flags);
    if (re.test(str)) return true;
  }
  return false;
}

/** Lines from an uploaded file that contain detectable secrets (verbatim). */
function extractSecretLinesFromContent(fileContent) {
  const lines = String(fileContent || '').split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    if (textHasDetectableSecrets(line)) out.push(line);
  }
  return out.join('\n');
}

/**
 * Models often emit strings that still match our detectors (e.g. AIzaSy_REDACTED_FOR_DEMO…)
 * but are not the real value from the user's file. Prefer upload in that case.
 */
function modelOutputLooksSelfCensored(s) {
  return /\bREDACTED\b|FOR_DEMO|DEMO_|DUMMY|PLACEHOLDER|NOT[_ ]REAL|FAKE[_ ]?KEY|SANITIZED|MASKED|_ONLY\b|PURPOSES_ ?ONLY|SECURITY_ ?REASONS|EXAMPLE_ ?ONLY|\*{4,}|•{3,}/i.test(
    String(s || '')
  );
}

/**
 * When the model self-censors or uses demo placeholders, use verbatim secret lines from
 * the client-provided upload so raw egress / Shadow shows real-shaped keys and scrubbing still runs.
 */
function resolveEgressSource(modelText, verbatimFileContext) {
  let egressSource = String(modelText ?? '');
  let rawProvenance = 'model';
  const file = typeof verbatimFileContext === 'string' ? verbatimFileContext : '';
  const fromFile = file.trim() ? extractSecretLinesFromContent(file) : '';
  const modelHasShape = textHasDetectableSecrets(egressSource);
  const useFile =
    Boolean(fromFile.trim()) &&
    (!modelHasShape ||
      (modelHasShape && modelOutputLooksSelfCensored(egressSource)));

  if (useFile) {
    egressSource = fromFile;
    rawProvenance = 'uploaded-file';
  }
  return { egressSource, rawProvenance };
}

// Module-level middleware instance so logs accumulate across requests
const middleware = new SecurityMiddleware();

async function fetchCreditSnapshot(apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) return null;

    const payload = await res.json();
    const data = payload?.data || {};

    const rawLimit = data?.limit;
    const usage = Number(data?.usage) || 0;
    // Fallback to a limit of $5.00 if the key has no hard limit set
    const limit = rawLimit ? Number(rawLimit) : 5.00;

    // Convert to a gamified "Credit" system where $1 = 10,000 credits
    const MULTIPLIER = 10000;

    return {
      totalCredits: Math.floor(limit * MULTIPLIER),
      exhaustedCredits: Math.floor(usage * MULTIPLIER),
      remainingCredits: Math.floor(Math.max(limit - usage, 0) * MULTIPLIER),
      currency: 'CREDITS',
    };
  } catch (_) {
    return null;
  }
}

export async function GET() {
  // Log polling endpoint for the SecurityDashboard
  return NextResponse.json({
    logs: middleware.getLogs(),
    policy: middleware.getPolicy(),
    policyConfig: middleware.getPolicyConfig(),
  });
}

export async function DELETE() {
  middleware.clearLogs();
  return NextResponse.json({ cleared: true, logs: [] });
}

export async function PATCH(request) {
  try {
    const { policy } = await request.json();
    const result = middleware.setPolicy(policy);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid policy. Use STRICT, BALANCED, or DEV.',
          policy: middleware.getPolicy(),
          policyConfig: middleware.getPolicyConfig(),
        },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      policy: middleware.getPolicy(),
      policyConfig: middleware.getPolicyConfig(),
    });
  } catch (_) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body.' },
      { status: 400 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      message,
      sessionId,
      fileScan,
      history,
      model,
      shadowMode: bodyShadow,
      verbatimFileContext: bodyVerbatimFile,
    } = await request.json();
    const shadowMode = bodyShadow === true;
    const selectedModel = model || 'google/gemini-2.5-flash';
    const apiKey = process.env.OPENROUTER_API_KEY;

    // ── Layer 0: File scan report (fire-and-forget from FileUpload) ────────
    if (fileScan) {
      middleware.logFileScan(fileScan.fileName, fileScan.secretCount, fileScan.criticalCount);
    }

    if (message === '__FILE_SCAN_REPORT__') {
      return NextResponse.json({ blocked: false, response: '', clean: true, fileScanLogged: true });
    }

    // ── Layer 1: Anomaly detection ──────────────────────────────────────
    const anomalyResult = middleware.detectAnomaly(sessionId || 'anonymous', 'chat');

    // ── Layer 2: Input analysis ─────────────────────────────────────────
    const inputResult = middleware.analyzeInput(message);

    if (inputResult.blocked) {
      const credits = await fetchCreditSnapshot(apiKey);
      const body = {
        blocked: true,
        reason: inputResult.reason,
        threatLevel: inputResult.threatLevel,
        flags: inputResult.flags,
        securityLog: middleware.getLogs(),
        anomaly: anomalyResult,
        credits,
      };
      if (shadowMode) {
        body.shadow = {
          enabled: true,
          inputBlocked: true,
          assertion: 'Input blocked before model; no egress occurred.',
        };
      }
      return NextResponse.json(body, { status: 200 });
    }

    // ── Layer 3: Grok (xAI) call ────────────────────────────────────────
    const safeHistory = Array.isArray(history)
      ? history
          .filter(m =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0
          )
          .slice(-4) // keep only last 4 messages to save tokens
      : [];

    const systemPrompt =
      'You are SecureAI, a secure AI assistant. Be concise. ' +
      'Do not invent credentials from memory or the open web. ' +
      'When the user message includes an uploaded file block (e.g. .env), treat that block as the only source of truth for those variables. ' +
      'If they ask for a key or secret that appears there, answer with the exact same characters as in the file (full line or full value)—copy-paste fidelity, no paraphrasing. ' +
      'Critical: do NOT self-censor or substitute your own placeholders (no REDACTED, DEMO, fake stars, shortened keys, or “safe” stand-ins). That breaks our pipeline: a server-side egress filter MUST see the real-shaped secret to scrub it before display. ' +
      'If there is no uploaded file and someone asks for secrets, refuse.';

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...safeHistory,
      {
        role: 'user',
        content: typeof message === 'string' && message.trim().length > 0
          ? message.trim()
          : 'Hello',
      },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let grokRes;
    try {
      grokRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000', // OpenRouter requires these headers
          'X-Title': 'SecureAI',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          max_tokens: 512,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!grokRes.ok) {
      const errBody = await grokRes.json().catch(() => ({}));
      console.error('OpenRouter error body:', JSON.stringify(errBody));
      const errMsg = errBody?.error?.message || `OpenRouter API error: ${grokRes.status}`;
      if (grokRes.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit reached. Please wait a moment and try again.', rateLimited: true },
          { status: 429 }
        );
      }
      throw new Error(errMsg);
    }

    const grokData = await grokRes.json();
    const text = grokData.choices?.[0]?.message?.content ?? '';
    const credits = await fetchCreditSnapshot(apiKey);

    // ── Layer 4: Output analysis — always run on the model's actual reply ──
    const outputCheck = middleware.analyzeOutput(text);
    const protectedText = outputCheck.clean ? text : outputCheck.redacted;
    const totalSecretMatches = outputCheck.flagged.reduce(
      (acc, f) => acc + (f.count || 0),
      0
    );

    // Shadow mode: resolve egress source separately (for audit proof only)
    let shadowEgressSource = text;
    let rawProvenance = 'model';
    if (shadowMode && bodyVerbatimFile) {
      const resolved = resolveEgressSource(text, bodyVerbatimFile);
      shadowEgressSource = resolved.egressSource;
      rawProvenance = resolved.rawProvenance;
    }

    // ── Layer 5: ArmorIQ Intent Audit ──
    const armoriqClient = new ArmorIQClient({
      apiKey: process.env.ARMORIQ_API_KEY,
      userId: process.env.ARMORIQ_USER_ID || 'user_hackathon_demo',
      agentId: process.env.ARMORIQ_AGENT_ID,
    });

    let chatToken = 'chat-token-mock';
    try {
      const plan = {
        goal: `Answer chat query`,
        steps: [
          {
            action: 'llm_generate',
            tool: selectedModel,
            inputs: { message: message.slice(0, 100) },
          },
        ],
      };
      const planCapture = armoriqClient.capturePlan(selectedModel, `User Query`, plan);
      const rawToken = await armoriqClient.getIntentToken(planCapture);
      chatToken = typeof rawToken === 'string' ? rawToken : JSON.stringify(rawToken);
    } catch (_) {}

    const body = {
      blocked: false,
      response: protectedText,
      clean: outputCheck.clean,
      flagged: outputCheck.flagged,
      securityLog: middleware.getLogs(),
      usage: grokData.usage || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 },
      credits,
      intentToken: chatToken,
    };

    if (shadowMode) {
      const raw = String(shadowEgressSource ?? '');
      const prot = String(rawProvenance === 'uploaded-file'
        ? middleware.analyzeOutput(shadowEgressSource).redacted || raw
        : protectedText ?? '');
      const rawDigest = sha256Utf8(raw);
      const protectedDigest = sha256Utf8(prot);
      body.shadow = {
        enabled: true,
        egress: {
          boundary: 'post-model, pre-client',
          rawProvenance,
          rawByteLength: Buffer.byteLength(raw, 'utf8'),
          protectedByteLength: Buffer.byteLength(prot, 'utf8'),
          rawDigest,
          protectedDigest,
          digestsMatch: rawDigest === protectedDigest,
          wouldLeakSecrets: !outputCheck.clean,
          totalSecretMatches,
          findings: outputCheck.flagged,
          rawPreview: raw.slice(0, 240),
          protectedPreview: prot.slice(0, 240),
        },
        assertion:
          rawProvenance === 'uploaded-file'
            ? 'Shadow audit: raw column shows verbatim secret lines from your upload — demonstrating what egress scrubbing intercepts.'
            : rawDigest === protectedDigest
              ? 'Egress unchanged: raw and protected digests match.'
              : 'Egress modified: scrubbing applied; digests differ.',
      };
    }

    return Response.json(body);
  } catch (error) {
    console.error('secure-chat error:', error);
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out — the AI took too long to respond. Please try again.' },
        { status: 408 }
      );
    }
    if (
      error.message?.includes('Rate limit') ||
      error.message?.includes('429') ||
      error.message?.includes('quota')
    ) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait a moment and try again.', rateLimited: true },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

