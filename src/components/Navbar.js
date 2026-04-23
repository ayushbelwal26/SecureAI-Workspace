'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { icon: '🏠', label: 'Dashboard',  href: '/'          },
  { icon: '📁', label: 'Workspace',  href: '/workspace' },
  { icon: '🛡', label: 'Threats',    href: '/threats'   },
  { icon: '⚙',  label: 'Access',    href: '/access'    },
  { icon: '📊', label: 'Analytics',  href: '/analytics' },
];

const STATUS_DOTS = [
  { color: '#00ff88', label: 'PROTECTED' },
  { color: '#00d4ff', label: 'ONLINE'    },
  { color: '#ffaa00', label: 'SANDBOXED' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1px;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .nav-link:hover {
          color: #00d4ff !important;
          border-color: rgba(0,212,255,0.2);
          background: rgba(0,212,255,0.06);
        }
        .nav-link-active {
          color: #00d4ff !important;
          background: rgba(0,212,255,0.12) !important;
          border-color: rgba(0,212,255,0.25) !important;
          box-shadow: 0 0 16px rgba(0,212,255,0.12);
        }
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #ff2d55;
          border: 1px solid rgba(255,45,85,0.35);
          background: rgba(255,45,85,0.08);
        }
        .live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ff2d55;
          animation: live-pulse 1s ease-in-out infinite;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: dot-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        background: scrolled
          ? 'rgba(2,8,24,0.92)'
          : 'rgba(2,8,24,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        transition: 'background 0.3s ease',
      }}>

        {/* ── Left: Brand ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.05))',
            border: '1px solid rgba(0,212,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 20px rgba(0,212,255,0.2)',
            flexShrink: 0,
          }}>🛡</div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                color: '#e8f4f8',
                letterSpacing: '0.5px',
              }}>SecureAI</span>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                color: '#00d4ff',
              }}>Workspace</span>
            </div>
            <div style={{
              fontSize: '8px',
              letterSpacing: '3px',
              color: 'rgba(0,212,255,0.5)',
              marginTop: '1px',
              fontFamily: "'JetBrains Mono', monospace",
            }}>ENTERPRISE</div>
          </div>
        </div>

        {/* ── Center: Nav Links ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${isActive ? ' nav-link-active' : ''}`}
                style={{ color: isActive ? '#00d4ff' : '#4a7a8a' }}
              >
                <span style={{ fontSize: '12px' }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* ── Right: Status + Live Badge ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          minWidth: '280px',
          justifyContent: 'flex-end',
        }}>
          {STATUS_DOTS.map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="status-dot" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: s.color,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{s.label}</span>
            </div>
          ))}

          <div className="live-badge">
            <div className="live-dot" />
            LIVE
          </div>
        </div>

      </nav>
    </>
  );
}
