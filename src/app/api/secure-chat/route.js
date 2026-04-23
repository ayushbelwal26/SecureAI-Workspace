import { NextResponse } from 'next/server';
import SecurityMiddleware from '@/lib/SecurityMiddleware';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Module-level middleware instance so logs accumulate across requests
const middleware = new SecurityMiddleware();

export async function GET() {
  // Log polling endpoint for the SecurityDashboard
  return NextResponse.json({ logs: middleware.getLogs() });
}

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();

    // ── Layer 1: Anomaly detection ──────────────────────────────────────
    const anomalyResult = middleware.detectAnomaly(sessionId || 'anonymous', 'chat');

    // ── Layer 2: Input analysis ─────────────────────────────────────────
    const inputResult = middleware.analyzeInput(message);

    if (inputResult.blocked) {
      return NextResponse.json(
        {
          blocked: true,
          reason: inputResult.reason,
          threatLevel: inputResult.threatLevel,
          flags: inputResult.flags,
          securityLog: middleware.getLogs(),
          anomaly: anomalyResult,
        },
        { status: 200 }
      );
    }

    // ── Layer 3: Gemini call ────────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const result = await model.generateContent(message);
    const text = result.response.text();

    // ── Layer 4: Output analysis ────────────────────────────────────────
    const outputCheck = middleware.analyzeOutput(text);

    return Response.json({
      blocked: false,
      response: text,
      clean: outputCheck.clean,
      flagged: outputCheck.flagged,
      securityLog: middleware.getLogs()
    });
  } catch (error) {
    console.error('secure-chat error:', error);
    if (
      error.message?.includes('Quota exceeded') ||
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
