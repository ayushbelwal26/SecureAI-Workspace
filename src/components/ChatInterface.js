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

const MODELS = [
  { id: 'google/gemini-2.5-flash',         label: 'Gemini 2.5 Flash',     icon: '🧠', color: '#4285f4' },
  { id: 'openai/gpt-4o-mini',              label: 'GPT-4o Mini',          icon: '🤖', color: '#00a67e' },
  { id: 'anthropic/claude-3-haiku',        label: 'Claude 3 Haiku',       icon: '🎭', color: '#d4a27f' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)', icon: '🦙', color: '#7c3aed' },
  { id: 'mistralai/mistral-7b-instruct:free',    label: 'Mistral 7B (Free)', icon: '⚡', color: '#ff6b35' },
  { id: 'google/gemini-2.0-flash-exp:free',      label: 'Gemini 2.0 Flash (Free)', icon: '✨', color: '#34a853' },
];

const THREAT_BG = {
  SAFE: 'rgba(0,229,255,0.08)',
  MEDIUM: 'rgba(255,214,0,0.08)',
  HIGH: 'rgba(255,109,0,0.08)',
  CRITICAL: 'rgba(213,0,0,0.08)',
};

export default function ChatInterface({
  fileContext = '',
  fileContextRaw = '',
  onClearContext,
  attackReplayRequest = null,
}) {
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
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [creditStats, setCreditStats] = useState(null);
  const [sessionTokens, setSessionTokens] = useState(0);
  const [securityPolicy, setSecurityPolicy] = useState('BALANCED');
  const [shadowMode, setShadowMode] = useState(false);
  const [lastShadow, setLastShadow] = useState(null);
  const bottomRef = useRef(null);
  const dropdownRef = useRef(null);
  const lastReplayIdRef = useRef('');

  useEffect(() => {
    setIsMounted(true);
    setSessionId('sess-' + Math.random().toString(36).slice(2, 9));
  }, []);

  useEffect(() => {
    fetch('/api/secure-chat')
      .then((res) => res.json())
      .then((data) => {
        if (data?.policy) setSecurityPolicy(data.policy);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!shadowMode) setLastShadow(null);
  }, [shadowMode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (overrideMessage) => {
    const text = typeof overrideMessage === 'string' ? overrideMessage : input;
    const trimmed = String(text ?? '').trim();
    if (!trimmed || loading) return;

    const usedOverride = typeof overrideMessage === 'string';

    const userMsg = {
      id: Date.now() + '-user',
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      status: 'SENT',
      threatLevel: 'SAFE',
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!usedOverride) {
      setInput('');
    }
    setLoading(true);
    if (shadowMode) setLastShadow(null);

    const maxCtx = 1500;
    const rawSlice = fileContextRaw ? fileContextRaw.slice(0, maxCtx) : '';
    const redactedSlice = fileContext ? fileContext.slice(0, maxCtx) : '';
    const useRawForModel = Boolean(rawSlice);
    const modelFileSlice = useRawForModel ? rawSlice : redactedSlice;

    const egressHint =
      '\n\n[SecureAI — required for this request: Values you output for anything present in the file above must match the file exactly. ' +
      'Do not replace secrets with labels like REDACTED_FOR_DEMO or shortened keys. Server egress redaction runs after your reply.]';

    const fullMessage = modelFileSlice
      ? useRawForModel && fileContextRaw !== fileContext
        ? `I have uploaded a file. Here is its exact content:\n\n${modelFileSlice}\n\nMy question: ${trimmed}${egressHint}`
        : `I have uploaded a file. Here is its content (secrets already redacted):\n\n${modelFileSlice}\n\nMy question: ${trimmed}`
      : trimmed;

    // Build conversation history for memory
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'ai')
      .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content || m.text || '' }));

    try {
      const res = await fetch('/api/secure-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullMessage,
          sessionId,
          history,
          model: selectedModel,
          shadowMode,
          verbatimFileContext:
            fileContextRaw && fileContextRaw !== fileContext
              ? fileContextRaw.slice(0, 1500)
              : undefined,
        }),
      });
      const data = await res.json();
      console.log('API Response:', data);

      if (data.shadow) setLastShadow(data.shadow);

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
        if (data.credits) {
          setCreditStats(data.credits);
        }
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

      if (data.credits) {
        setCreditStats(data.credits);
      }
      if (data.usage?.total_tokens) {
        setSessionTokens(prev => prev + data.usage.total_tokens);
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
          usage: data.usage?.total_tokens || 0,
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

  useEffect(() => {
    if (!attackReplayRequest?.id || loading) return;
    if (lastReplayIdRef.current === attackReplayRequest.id) return;
    lastReplayIdRef.current = attackReplayRequest.id;

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-replay`,
        role: 'system',
        content: `Attack replay launched: ${attackReplayRequest.label}`,
        timestamp: new Date().toISOString(),
        status: 'SYSTEM',
        threatLevel: 'SAFE',
      },
    ]);
    sendMessage(attackReplayRequest.prompt);
  }, [attackReplayRequest, loading]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updatePolicy = async (nextPolicy) => {
    setSecurityPolicy(nextPolicy);
    try {
      const res = await fetch('/api/secure-chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: nextPolicy }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setSecurityPolicy(data?.policy || 'BALANCED');
      }
    } catch (_) {
      setSecurityPolicy('BALANCED');
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
        height: shadowMode && lastShadow ? '580px' : '520px',
        overflow: 'hidden',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #0d1826', display: 'flex', alignItems: 'center', gap: '10px', background: '#070e18', position: 'relative' }}>
        <span style={{ color: '#00e5ff', fontSize: '11px', letterSpacing: '2px', fontWeight: 700 }}>COMPANY AI WORKSPACE</span>

        {/* Model selector */}
        <div ref={dropdownRef} style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            onClick={() => setModelDropdownOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
              color: '#00e5ff', fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px', letterSpacing: '0.5px', transition: 'all 0.2s',
            }}
          >
            <span>{MODELS.find(m => m.id === selectedModel)?.icon}</span>
            <span>{MODELS.find(m => m.id === selectedModel)?.label}</span>
            <span style={{ opacity: 0.5, fontSize: '8px' }}>{modelDropdownOpen ? '▲' : '▼'}</span>
          </button>

          {modelDropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 999,
              background: '#070e18', border: '1px solid rgba(0,229,255,0.15)',
              borderRadius: '10px', overflow: 'hidden', minWidth: '220px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedModel(m.id); setModelDropdownOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', background: selectedModel === m.id ? 'rgba(0,229,255,0.08)' : 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = selectedModel === m.id ? 'rgba(0,229,255,0.08)' : 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>{m.icon}</span>
                  <div>
                    <div style={{ color: m.color, fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700 }}>{m.label}</div>
                    <div style={{ color: '#2e4a62', fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.5px', marginTop: '1px' }}>{m.id}</div>
                  </div>
                  {selectedModel === m.id && <span style={{ marginLeft: 'auto', color: '#00e5ff', fontSize: '12px' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '10px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 6px #00e676', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#4a6880', fontSize: '10px' }}>SESSION: {sessionId ? sessionId.slice(0, 12) : '...'}</span>
        </div>

        <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShadowMode((v) => !v)}
            title="Show verifiable egress proof (SHA-256 digests of raw vs protected output)"
            style={{
              background: shadowMode ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.06)',
              border: `1px solid ${shadowMode ? 'rgba(167,139,250,0.45)' : 'rgba(167,139,250,0.2)'}`,
              borderRadius: '6px',
              color: shadowMode ? '#c4b5fd' : '#6b5b95',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.5px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Shadow {shadowMode ? 'ON' : 'OFF'}
          </button>
          <select
            value={securityPolicy}
            onChange={(e) => updatePolicy(e.target.value)}
            style={{
              background: 'rgba(255,170,0,0.08)',
              border: '1px solid rgba(255,170,0,0.28)',
              borderRadius: '6px',
              color: '#ffaa00',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.5px',
              padding: '4px 8px',
              outline: 'none',
              cursor: 'pointer',
            }}
            title="Security policy profile"
          >
            <option value="STRICT">STRICT</option>
            <option value="BALANCED">BALANCED</option>
            <option value="DEV">DEV</option>
          </select>
        </div>

        {/* Compact Credit Counter */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px', 
          background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', 
          borderRadius: '6px', padding: '4px 8px' 
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span style={{ color: '#00e5ff', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: '0.5px' }}>
            {sessionTokens.toLocaleString()} <span style={{ color: '#4a6880', fontWeight: 400 }}>/ {creditStats ? Number(creditStats.totalCredits).toLocaleString() : '50,000'}</span>
          </span>
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
                {msg.role === 'user' ? 'YOU' : msg.role === 'ai' ? MODELS.find(m => m.id === selectedModel)?.label ?? 'AI' : msg.role.toUpperCase()}
              </span>
              <StatusBadge status={msg.status} />
              {msg.threatLevel && msg.threatLevel !== 'SAFE' && (
                <ThreatBadge level={msg.threatLevel} />
              )}
              {msg.usage > 0 && (
                <span style={{ color: '#00e5ff', fontSize: '9px', background: 'rgba(0,229,255,0.08)', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(0,229,255,0.2)', letterSpacing: '1px' }}>
                  ⚡ {msg.usage}
                </span>
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
                      {f.type || f.name || 'FLAG'}{f.severity ? ` · ${f.severity}` : ''}{f.confidence ? ` · ${f.confidence}%` : ''}
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

      {shadowMode && lastShadow && (
        <EgressProofPanel shadow={lastShadow} />
      )}

      {/* File context banner */}
      {(fileContext || fileContextRaw) && (
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
              type="button"
              onClick={() => sendMessage()}
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

function EgressProofPanel({ shadow }) {
  const mono = { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', wordBreak: 'break-all' };
  return (
    <div
      style={{
        flexShrink: 0,
        maxHeight: '200px',
        overflowY: 'auto',
        padding: '10px 18px',
        borderTop: '1px solid rgba(167,139,250,0.25)',
        borderBottom: '1px solid rgba(167,139,250,0.12)',
        background: 'linear-gradient(180deg, rgba(167,139,250,0.08) 0%, rgba(8,12,18,0.95) 100%)',
      }}
    >
      <div style={{ color: '#c4b5fd', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '8px' }}>
        EGRESS PROOF
      </div>
      {shadow.inputBlocked ? (
        <p style={{ ...mono, color: '#a5b4fc', margin: 0, lineHeight: 1.5 }}>{shadow.assertion}</p>
      ) : shadow.egress ? (
        <>
          <p style={{ ...mono, color: '#e9d5ff', margin: '0 0 8px', lineHeight: 1.5 }}>{shadow.assertion}</p>
          {shadow.egress.rawProvenance === 'uploaded-file' && (
            <div style={{ ...mono, color: '#a78bfa', marginBottom: '6px', fontStyle: 'italic' }}>
              Raw column: verbatim secret lines from your upload (model text had no matching secret patterns).
            </div>
          )}
          <div style={{ ...mono, color: '#94a3b8', marginBottom: '6px' }}>
            {shadow.egress.boundary} · raw {shadow.egress.rawByteLength} B → protected {shadow.egress.protectedByteLength} B
            {shadow.egress.wouldLeakSecrets ? (
              <span style={{ color: '#fbbf24', marginLeft: '8px' }}>
                · {shadow.egress.totalSecretMatches} secret match(es)
              </span>
            ) : null}
          </div>
          <div style={{ display: 'grid', gap: '6px', marginBottom: '8px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '9px', letterSpacing: '0.5px' }}>RAW SHA-256</span>
              <div style={{ ...mono, color: '#f472b6' }}>{shadow.egress.rawDigest}</div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '9px', letterSpacing: '0.5px' }}>PROTECTED SHA-256</span>
              <div style={{ ...mono, color: '#34d399' }}>{shadow.egress.protectedDigest}</div>
            </div>
          </div>
          <div style={{ ...mono, color: shadow.egress.digestsMatch ? '#34d399' : '#fbbf24', marginBottom: '8px' }}>
            {shadow.egress.digestsMatch ? 'Digests match — no scrubbing.' : 'Digests differ — scrubbing verified.'}
          </div>
          {shadow.egress.findings?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {shadow.egress.findings.map((f, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(251,191,36,0.12)',
                    border: '1px solid rgba(251,191,36,0.35)',
                    color: '#fcd34d',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {f.type} ×{f.count}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '9px' }}>Raw preview</span>
              <pre
                style={{
                  ...mono,
                  color: '#cbd5e1',
                  margin: '4px 0 0',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '72px',
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {shadow.egress.rawPreview || '—'}
              </pre>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '9px' }}>Protected preview</span>
              <pre
                style={{
                  ...mono,
                  color: '#a7f3d0',
                  margin: '4px 0 0',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '72px',
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid rgba(52,211,153,0.15)',
                }}
              >
                {shadow.egress.protectedPreview || '—'}
              </pre>
            </div>
          </div>
        </>
      ) : null}
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
