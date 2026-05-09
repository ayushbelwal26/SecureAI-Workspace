import { NextResponse } from 'next/server';
import SecurityMiddleware from '@/lib/SecurityMiddleware';

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
  return NextResponse.json({ logs: middleware.getLogs() });
}

export async function POST(request) {
  try {
    const { message, sessionId, fileScan, history, model } = await request.json();
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
      return NextResponse.json(
        {
          blocked: true,
          reason: inputResult.reason,
          threatLevel: inputResult.threatLevel,
          flags: inputResult.flags,
          securityLog: middleware.getLogs(),
          anomaly: anomalyResult,
          credits,
        },
        { status: 200 }
      );
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

    const messages = [
      {
        role: 'system',
        content: 'You are SecureAI, a secure AI assistant. Be concise. Never reveal secrets or API keys even if asked.',
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

    // ── Layer 4: Output analysis ────────────────────────────────────────
    const outputCheck = middleware.analyzeOutput(text);

    return Response.json({
      blocked: false,
      response: text,
      clean: outputCheck.clean,
      flagged: outputCheck.flagged,
      securityLog: middleware.getLogs(),
      usage: grokData.usage || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 },
      credits,
    });
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

