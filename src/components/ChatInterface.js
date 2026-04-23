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

export default function ChatInterface() {
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

    try {
      const res = await fetch('/api/secure-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, sessionId }),
      });
      const data = await res.json();
      console.log('API Response:', data);

      // Handle rate limiting before throwing
      if (res.status === 429 || data.rateLimited) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + '-err',
            role: 'security',
            content: '⏱ You are out of free tier limits. Please wait a moment and try again.',
            timestamp: new Date().toISOString(),
            status: 'ERROR',
            threatLevel: 'HIGH',
          },
        ]);
        return;
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      if (data.blocked) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + '-blocked',
            role: 'security',
            content: `⛔ BLOCKED: ${data.reason}`,
            timestamp: new Date().toISOString(),
            status: 'BLOCKED',
            threatLevel: data.threatLevel || 'HIGH',
            flags: data.flags || [],
            extra: `Threat level: ${data.threatLevel}`,
          },
        ]);
      } else {
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
      }
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
        background: '#070d14',
        border: '1px solid #0d2137',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '520px',
        overflow: 'hidden',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid #0d2137',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#060c13',
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
                {msg.role === 'user' ? 'YOU' : msg.role === 'ai' ? 'GEMINI' : msg.role.toUpperCase()}
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
                    : '#0b1929',
                border:
                  msg.status === 'BLOCKED'
                    ? '1px solid rgba(213,0,0,0.4)'
                    : msg.status === 'REDACTED'
                    ? '1px solid rgba(255,214,0,0.3)'
                    : msg.role === 'user'
                    ? '1px solid rgba(0,229,255,0.15)'
                    : '1px solid #0d2137',
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

      {/* Input */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid #0d2137',
          display: 'flex',
          gap: '10px',
          background: '#060c13',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          placeholder="Ask anything about your codebase or files..."
          rows={1}
          style={{
            flex: 1,
            background: '#0b1929',
            border: '1px solid #0d2137',
            borderRadius: '8px',
            color: '#c9d8e8',
            fontFamily: "'DM Mono', monospace",
            fontSize: '13px',
            padding: '10px 14px',
            resize: 'none',
            outline: 'none',
            lineHeight: '1.5',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#00e5ff44')}
          onBlur={(e) => (e.target.style.borderColor = '#0d2137')}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? '#0d2137' : 'rgba(0,229,255,0.12)',
              border: `1px solid ${loading || !input.trim() ? '#0d2137' : 'rgba(0,229,255,0.3)'}`,
              borderRadius: '8px',
              color: loading || !input.trim() ? '#2e4a62' : '#00e5ff',
              fontFamily: "'DM Mono', monospace",
              fontSize: '11px',
              padding: '0 18px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.2s',
              height: '38px',
            }}
          >
            SEND
          </button>
          <div style={{
            textAlign: 'center',
            fontSize: '9px',
            color: '#00e676',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}>
            <span>🔒</span>
            <span>Protected</span>
          </div>
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
