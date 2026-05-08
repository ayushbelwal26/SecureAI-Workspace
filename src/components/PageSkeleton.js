'use client';

import { useState, useEffect } from 'react';

/**
 * PageSkeleton — shows a shimmer placeholder for `duration` ms after mount.
 * Wraps children; while loading it renders pulsing dark blocks instead.
 */
export default function PageSkeleton({ duration = 1000, children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!loading) return children;

  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .sk-shimmer {
          background: linear-gradient(
            90deg,
            #0d2137 0%,
            #1a3a5c 40%,
            #0d2137 80%
          );
          background-size: 800px 100%;
          animation: skeletonShimmer 1.4s ease-in-out infinite;
          border-radius: 10px;
        }
        .sk-row {
          width: 100%;
          height: 18px;
          margin-bottom: 12px;
        }
        .sk-row-short { width: 40%; }
        .sk-row-med   { width: 65%; }
        .sk-block {
          border-radius: 12px;
          margin-bottom: 20px;
        }
      `}</style>

      {/* Navbar spacer */}
      <div style={{ height: 64 }} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 32px 60px',
      }}>

        {/* Page header skeleton */}
        <div style={{ marginBottom: 40 }}>
          <div className="sk-shimmer sk-row sk-row-short" style={{ height: 12, width: 120, marginBottom: 20 }} />
          <div className="sk-shimmer sk-row" style={{ height: 40, width: '50%', marginBottom: 12 }} />
          <div className="sk-shimmer sk-row sk-row-med" style={{ height: 14 }} />
        </div>

        {/* Two-column content skeleton */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {/* Main block */}
          <div style={{ gridColumn: 'span 2' }}>
            <div className="sk-shimmer sk-block" style={{ height: 220 }} />
            <div className="sk-shimmer sk-block" style={{ height: 160 }} />
            <div className="sk-shimmer sk-block" style={{ height: 120 }} />
          </div>

          {/* Side block */}
          <div>
            <div className="sk-shimmer sk-block" style={{ height: 180 }} />
            <div className="sk-shimmer sk-block" style={{ height: 140 }} />
            <div className="sk-shimmer sk-block" style={{ height: 100 }} />
          </div>
        </div>

      </div>
    </>
  );
}
