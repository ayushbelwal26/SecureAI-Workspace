'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Guard',      href: '/'          },
  { label: 'Workspace',  href: '/workspace' },
  { label: 'Threats',    href: '/threats'   },
  { label: 'Analytics',  href: '/analytics' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiOk,    setApiOk]    = useState(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    fn();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    fetch('/api/secure-chat').then(r => setApiOk(r.ok)).catch(() => setApiOk(false));
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <style>{`
        .nl {
          position: relative;
          padding: 6px 0;
          font-size: 13px;
          font-weight: 500;
          color: #6b9aaa;
          letter-spacing: 0.2px;
          transition: color 0.18s;
          white-space: nowrap;
        }
        .nl:hover { color: #e2edf5; }
        .nl.active { color: #00e5ff; }
        .nl.active::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0; right: 0;
          height: 2px;
          background: #00e5ff;
          border-radius: 1px;
          box-shadow: 0 0 8px rgba(0,229,255,0.6);
        }
        .nav-cta {
          padding: 7px 18px;
          border-radius: 8px;
          background: #00e5ff;
          color: #060a12;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          transition: opacity 0.18s, box-shadow 0.18s;
        }
        .nav-cta:hover {
          opacity: 0.88;
          box-shadow: 0 0 20px rgba(0,229,255,0.4);
        }
        .icon-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          color: #6b9aaa;
          background: transparent;
          border: none; cursor: pointer;
          transition: color 0.18s, background 0.18s;
          font-size: 15px;
        }
        .icon-btn:hover { color: #e2edf5; background: rgba(255,255,255,0.05); }
        .mob-link {
          display: flex; align-items: center;
          padding: 11px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          color: #6b9aaa;
          transition: all 0.18s;
        }
        .mob-link:hover, .mob-link.active {
          color: #00e5ff;
          background: rgba(0,229,255,0.07);
        }
      `}</style>

      {/* ── Main nav bar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 1000, height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 24,
        background: scrolled ? 'rgba(8,12,18,0.97)' : 'rgba(8,12,18,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.25), rgba(0,229,255,0.08))',
            border: '1px solid rgba(0,229,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, boxShadow: '0 0 14px rgba(0,229,255,0.2)',
          }}>🛡</div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: 15,
            color: '#e2edf5', letterSpacing: 0.3,
          }}>SecureAI</span>
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1 }}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nl${pathname === link.href ? ' active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {/* System status pill */}
          {!isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(0,229,255,0.06)',
              border: `1px solid ${apiOk === false ? 'rgba(255,45,85,0.25)' : 'rgba(0,229,255,0.15)'}`,
              fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700, letterSpacing: 1.2,
              color: apiOk === false ? '#ff2d55' : '#00e5ff',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: apiOk === false ? '#ff2d55' : '#00e5ff',
                animation: 'teal-pulse 2s ease-in-out infinite',
              }} />
              {apiOk === false ? 'OFFLINE' : 'SYSTEM ACTIVE'}
            </div>
          )}

          <button className="icon-btn" aria-label="Search">🔍</button>
          <button className="icon-btn" aria-label="Alerts">🔔</button>

          <Link href="/workspace" className="nav-cta">
            {isMobile ? '→' : 'Get Started'}
          </Link>

          {isMobile && (
            <button
              className="icon-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              style={{ fontSize: 18 }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile dropdown ── */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', top: 56, left: 0, right: 0,
          background: 'rgba(8,12,18,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,229,255,0.1)',
          padding: '12px 16px 20px',
          zIndex: 999,
          display: 'flex', flexDirection: 'column', gap: 2,
          animation: 'fadeSlideIn 0.2s ease',
        }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`mob-link${pathname === link.href ? ' active' : ''}`}
            >
              {link.label}
              {pathname === link.href && (
                <span style={{
                  marginLeft: 'auto', fontSize: 9,
                  color: '#00e5ff', fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 1,
                }}>ACTIVE</span>
              )}
            </Link>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />
          <Link href="/workspace" className="nav-cta" style={{ textAlign: 'center' }}>
            Get Started
          </Link>
        </div>
      )}
    </>
  );
}
