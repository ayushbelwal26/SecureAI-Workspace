'use client';

import { useState, useRef, useEffect } from 'react';

function generateSessionId() {
  return 'sess-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now();
}

const THREAT_COLORS = {
  SAFE: '#00e5ff',
  MEDIUM: '#ffd600',
  HIGH: '#ff6d00',
  CRITICAL: '#d50000',
};

const THREAT_BG = {
  SAFE: 'rgba(0,229,255,0.08)',
  MEDIUM: 'rgba(255,214,0,0.08)',
  HIGH: 'rgba(255,109,0,0.08)',
  CRITICAL: 'rgba(213,0,0,0.08)',
};

export default function ChatInterface({ fileContext = '', onClearContext }) {
  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'system',
      content: 'SecureAI protection is active. Upload your files and work normally. All sensitive data is automatically protected.',
      timestamp: new Date().toISOString(),
      status: 'SYSTEM',
      threatLevel: 'SAFE',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    setSessionId('sess-' + Math.random().toString(36).slice(2, 9));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = {
      id: Date.now() + '-user',
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      status: 'SENT',
      threatLevel: 'SAFE',
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const truncatedContext = fileContext ? fileContext.slice(0, 1500) : '';

    const fullMessage = truncatedContext
      ? `I have uploaded a file. Here is its content (secrets already redacted):\n\n${truncatedContext}\n\nMy question: ${trimmed}`
      : trimmed;

    // Build conversation history for memory
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'ai')
      .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content || m.text || '' }));

    try {
      const res = await fetch('/api/secure-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullMessage, sessionId, history }),
      });
      const data = await res.json();
      console.log('API Response:', data);

      let errorMessage = null;

      if (res.status === 429 || data.rateLimited) {
        errorMessage = '⏱ Rate limit reached — wait a moment and try again';
      } else if (data.anomaly?.score >= 0.9) {
        errorMessage = '🚨 Anomaly detected — too many requests in a short time. Slow down and try again in 60 seconds';
      } else if (data.blocked) {
        errorMessage = `🛡 Message blocked by SecureAI — ${data.reason}`;
      } else if (data.error) {
        errorMessage = `Error: ${data.error}`;
      }

      if (errorMessage) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + '-err',
            role: 'security',
            content: errorMessage,
            timestamp: new Date().toISOString(),
            status: data.blocked ? 'BLOCKED' : 'ERROR',
            threatLevel: data.threatLevel || 'HIGH',
            flags: data.flags || [],
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + '-ai',
          role: 'ai',
          content: data.response,
          timestamp: new Date().toISOString(),
          status: data.clean === false ? 'REDACTED' : 'CLEAN',
          threatLevel: data.threatLevel || 'SAFE',
          sanitized: data.clean === false,
          flagged: data.flagged || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + '-err',
          role: 'security',
          content: `Error: ${err.message}`,
          timestamp: new Date().toISOString(),
          status: 'ERROR',
          threatLevel: 'HIGH',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        background: '#080c12',
        border: '1px solid #0d1826',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '520px',
        overflow: 'hidden',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid #0d1826',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#070e18',
        }}
      >
        <span style={{ color: '#00e5ff', fontSize: '11px', letterSpacing: '2px', fontWeight: 700 }}>
          COMPANY AI WORKSPACE
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#00e676',
              boxShadow: '0 0 6px #00e676',
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ color: '#4a6880', fontSize: '10px' }}>WORKSPACE SESSION: {sessionId ? sessionId.slice(0, 16) : 'connecting...'}</span>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {/* Label row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
              }}
            >
              <span style={{ color: '#2e4a62', fontSize: '9px', letterSpacing: '1px' }}>
                {msg.role === 'user' ? 'YOU' : msg.role === 'ai' ? 'GROK' : msg.role.toUpperCase()}
              </span>
              <StatusBadge status={msg.status} />
              {msg.threatLevel && msg.threatLevel !== 'SAFE' && (
                <ThreatBadge level={msg.threatLevel} />
              )}
              <span style={{ color: '#1e3347', fontSize: '9px' }}>
                {isMounted ? new Date(msg.timestamp).toLocaleTimeString() : '--:--'}
              </span>
            </div>

            {/* Bubble */}
            <div
              style={{
                maxWidth: '84%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background:
                  msg.status === 'BLOCKED'
                    ? 'rgba(213,0,0,0.12)'
                    : msg.status === 'REDACTED'
                    ? 'rgba(255,214,0,0.08)'
                    : msg.role === 'user'
                    ? 'rgba(0,229,255,0.08)'
                    : msg.role === 'system'
                    ? 'rgba(0,230,118,0.06)'
                    : '#080e1a',
                border:
                  msg.status === 'BLOCKED'
                    ? '1px solid rgba(213,0,0,0.4)'
                    : msg.status === 'REDACTED'
                    ? '1px solid rgba(255,214,0,0.3)'
                    : msg.role === 'user'
                    ? '1px solid rgba(0,229,255,0.15)'
                    : '1px solid #0d1826',
                color:
                  msg.status === 'BLOCKED'
                    ? '#ff5252'
                    : msg.status === 'REDACTED'
                    ? '#ffd600'
                    : msg.role === 'system'
                    ? '#00e676'
                    : '#c9d8e8',
                fontSize: '13px',
                lineHeight: '1.6',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content || '[No response received]'}
              {msg.sanitized && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    background: 'rgba(255,214,0,0.1)',
                    border: '1px solid rgba(255,214,0,0.3)',
                    borderRadius: '6px',
                    color: '#ffd600',
                    fontSize: '11px',
                  }}
                >
                  ⚠ Output was sanitized — sensitive data removed
                </div>
              )}
              {msg.flags && msg.flags.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {msg.flags.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(213,0,0,0.2)',
                        border: '1px solid rgba(213,0,0,0.4)',
                        color: '#ff5252',
                      }}
                    >
                      {f.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#00e5ff',
                    opacity: 0.6,
                    animation: `blink 1.2s ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <span style={{ color: '#2e4a62', fontSize: '11px' }}>Processing through security layers...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* File context banner */}
      {fileContext && (
        <div style={{
          padding: '7px 18px',
          borderBottom: '1px solid rgba(0,229,255,0.15)',
          background: 'rgba(0,229,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}>
          <span style={{
            fontSize: '11px',
            color: '#00e5ff',
            letterSpacing: '0.5px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            📄 File loaded as context — ask anything about it
          </span>
          <button
            onClick={onClearContext}
            style={{
              background: 'none',
              border: 'none',
              color: '#2e5472',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
            title="Clear file context"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid #0d1826',
          background: '#070e18',
        }}
      >
        {/* Textarea row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={handleKey}
            disabled={loading}
            placeholder="Ask anything about your codebase or files..."
            rows={1}
            style={{
              flex: 1,
              background: '#080e1a',
              border: `1px solid ${input.length >= 1900 ? 'rgba(255,45,85,0.5)' : input.length >= 1500 ? 'rgba(255,170,0,0.4)' : '#0d1826'}`,
              borderRadius: '8px',
              color: '#c9d8e8',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              padding: '10px 14px',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.5',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#00e5ff44')}
            onBlur={(e) => (e.target.style.borderColor =
              input.length >= 1900 ? 'rgba(255,45,85,0.5)'
              : input.length >= 1500 ? 'rgba(255,170,0,0.4)'
              : '#0d1826'
            )}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? '#0d1826' : 'rgba(0,229,255,0.12)',
                border: `1px solid ${loading || !input.trim() ? '#0d1826' : 'rgba(0,229,255,0.3)'}`,
                borderRadius: '8px',
                color: loading || !input.trim() ? '#2e4a62' : '#00e5ff',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                padding: '0 14px',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                letterSpacing: '1px',
                transition: 'all 0.2s',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <span>🔒</span>
              {input.trim() ? 'SEND' : 'PROTECTED SEND'}
            </button>
          </div>
        </div>

        {/* Char counter */}
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.5px',
            color: input.length >= 1900 ? '#ff2d55'
              : input.length >= 1500 ? '#ffaa00'
              : '#1e3347',
          }}>
            {input.length} / 2000
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:0.2} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    BLOCKED: { bg: 'rgba(213,0,0,0.2)', border: 'rgba(213,0,0,0.5)', text: '#ff5252' },
    CLEAN: { bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.3)', text: '#00e676' },
    REDACTED: { bg: 'rgba(255,214,0,0.1)', border: 'rgba(255,214,0,0.3)', text: '#ffd600' },
    SENT: { bg: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.3)', text: '#00e5ff' },
    SYSTEM: { bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)', text: '#00e676' },
    ERROR: { bg: 'rgba(255,109,0,0.1)', border: 'rgba(255,109,0,0.3)', text: '#ff6d00' },
  };
  const c = colors[status] || colors.CLEAN;
  return (
    <span
      style={{
        fontSize: '9px',
        padding: '1px 5px',
        borderRadius: '3px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        letterSpacing: '1px',
      }}
    >
      {status}
    </span>
  );
}

function ThreatBadge({ level }) {
  const colors = {
    MEDIUM: '#ffd600',
    HIGH: '#ff6d00',
    CRITICAL: '#d50000',
  };
  return (
    <span
      style={{
        fontSize: '9px',
        padding: '1px 5px',
        borderRadius: '3px',
        background: `${colors[level]}22`,
        border: `1px solid ${colors[level]}66`,
        color: colors[level],
        letterSpacing: '1px',
        fontWeight: 700,
      }}
    >
      ⚡ {level}
    </span>
  );
}
