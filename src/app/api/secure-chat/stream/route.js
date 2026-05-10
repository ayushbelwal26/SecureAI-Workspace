import { NextResponse } from 'next/server';
import SecurityMiddleware from '@/lib/SecurityMiddleware';

const middleware = new SecurityMiddleware();

function buildPayload() {
  const raw = middleware.getLogs();
  const blocked = raw.filter((l) => l.status === 'BLOCKED').length;
  const redacted = raw.filter((l) => l.status === 'REDACTED').length;
  const anomalies = raw.filter((l) => l.status === 'ANOMALY').length;
  const total = raw.length || 1;
  const score = Math.max(0, Math.round(100 - ((blocked + anomalies) / total) * 100));
  return {
    logs: [...raw].reverse(),
    stats: { blocked, redacted, anomalies, score },
    policy: middleware.getPolicy(),
    ts: Date.now(),
  };
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const payload = buildPayload();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      // Send first payload immediately, then keep streaming.
      send();
      const interval = setInterval(send, 1500);

      this._cleanup = () => clearInterval(interval);
    },
    cancel() {
      if (this._cleanup) this._cleanup();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

