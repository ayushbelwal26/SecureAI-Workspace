'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const HeroCanvas = dynamic(() => import('../components/HeroCanvas'), { ssr: false });

export default function HomePage() {
  useEffect(() => {
    const initGSAP = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      gsap.from('.hero-headline', { y: 80, opacity: 0, duration: 1.2, ease: 'power4.out', delay: 0.2 });
      gsap.from('.hero-sub', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.5 });
      gsap.from('.hero-buttons', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.8 });

      gsap.from('.stat-item', {
        scrollTrigger: { trigger: '.stats-bar', start: 'top 85%' },
        y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out'
      });

      gsap.from('.step-card', {
        scrollTrigger: { trigger: '.steps-section', start: 'top 70%' },
        x: -60, opacity: 0, duration: 0.9, stagger: 0.2, ease: 'power3.out'
      });

      gsap.from('.feature-card', {
        scrollTrigger: { trigger: '.features-section', start: 'top 75%' },
        scale: 0.7, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.7)'
      });

      gsap.from('.cta-section', {
        scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
        scale: 0.9, opacity: 0, y: 60, duration: 1, ease: 'power4.out'
      });

      gsap.to('.orb-1', { y: -30, x: 20, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.orb-2', { y: 20, x: -30, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });

      const cards = gsap.utils.toArray('.feature-card');
      if (window.innerWidth > 900 && cards.length > 0) {
        gsap.to(cards, {
          scrollTrigger: {
            trigger: '.features-section',
            start: 'top top',
            end: '+=600',
            scrub: 1,
            pin: true,
          },
          x: -100 * (cards.length - 1) + '%',
          ease: 'none'
        });
      }
    };

    initGSAP();

    return () => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach(t => t.kill());
      });
    };
  }, []);

  return (
    <div style={{ background: '#080c12', minHeight: '100vh', color: '#e2edf5', fontFamily: "'Inter', 'Space Grotesk', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@600;700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes livePulse { 0%{box-shadow:0 0 0 0 rgba(255,45,85,.55)} 70%{box-shadow:0 0 0 8px rgba(255,45,85,0)} 100%{box-shadow:0 0 0 0 rgba(255,45,85,0)} }
        @keyframes tealPulse { 0%{box-shadow:0 0 0 0 rgba(0,229,255,.55)} 70%{box-shadow:0 0 0 7px rgba(0,229,255,0)} 100%{box-shadow:0 0 0 0 rgba(0,229,255,0)} }
        @keyframes waveAnim { 0%,100%{d:path("M0,80 C150,120 350,40 500,80 C650,120 850,40 1000,80 L1000,200 L0,200 Z")} 50%{d:path("M0,100 C150,60 350,140 500,100 C650,60 850,140 1000,100 L1000,200 L0,200 Z")} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes scanMove { 0%{top:0} 100%{top:100%} }
        .hero-btn-primary { display:inline-flex; align-items:center; gap:8px; padding:12px 28px; border-radius:9px; background:#00e5ff; color:#060a12; font-size:13px; font-weight:700; letter-spacing:.4px; text-decoration:none; transition:opacity .2s, box-shadow .2s; }
        .hero-btn-primary:hover { opacity:.88; box-shadow:0 0 28px rgba(0,229,255,.45); }
        .hero-btn-outline { display:inline-flex; align-items:center; gap:8px; padding:12px 28px; border-radius:9px; border:1px solid rgba(0,229,255,.3); color:#00e5ff; font-size:13px; font-weight:600; letter-spacing:.4px; text-decoration:none; transition:background .2s, border-color .2s; }
        .hero-btn-outline:hover { background:rgba(0,229,255,.07); border-color:rgba(0,229,255,.5); }
        .feature-card { background:#0d1826; border:1px solid rgba(0,229,255,.08); border-radius:14px; overflow:hidden; transition:border-color .2s, box-shadow .2s, transform .2s; }
        .feature-card:hover { border-color:rgba(0,229,255,.22); box-shadow:0 0 28px rgba(0,229,255,.07); transform:translateY(-3px); }
        .stat-card { background:#0d1826; border:1px solid rgba(0,229,255,.08); border-radius:12px; padding:28px 24px; text-align:center; transition:border-color .2s; }
        .stat-card:hover { border-color:rgba(0,229,255,.2); }
        .nav-link-lp { font-size:13px; font-weight:500; color:#6b9aaa; text-decoration:none; transition:color .18s; }
        .nav-link-lp:hover { color:#e2edf5; }
        code { font-family:'JetBrains Mono',monospace; }
        @media (max-width:768px) {
          .hero-btns { flex-direction:column !important; align-items:stretch !important; }
          .hero-btns a { text-align:center; justify-content:center; }
          .feat-grid { grid-template-columns:1fr !important; }
          .stats-grid { grid-template-columns:repeat(2,1fr) !important; }
          .lp-nav-links { display:none !important; }
          .code-section { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ── 3D Canvas (fixed background) ── */}
      <HeroCanvas />

      <div style={{ position:'relative', zIndex:1 }}>

        {/* ── Navbar ── */}
        <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', height:56, borderBottom:'1px solid rgba(255,255,255,0.04)', background:'rgba(8,12,18,0.85)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:100 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'linear-gradient(135deg,rgba(0,180,255,.25),rgba(99,102,241,.15))', border:'1px solid rgba(56,189,248,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🛡</div>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, color:'#e2edf5' }}>SecureAI</span>
          </div>
          <div className="lp-nav-links" style={{ display:'flex', gap:32, alignItems:'center' }}>
            {[{l:'Guard',h:'/'},{l:'Workspace',h:'/workspace'},{l:'Threats',h:'/threats'},{l:'Analytics',h:'/analytics'}].map(x=>(
              <Link key={x.h} href={x.h} className="nav-link-lp">{x.l}</Link>
            ))}
          </div>
          <Link href="/workspace" style={{ padding:'7px 18px', borderRadius:8, background:'linear-gradient(135deg,#38bdf8,#818cf8)', color:'#060a12', fontSize:12, fontWeight:700, letterSpacing:.5, textDecoration:'none' }}>
            Get Started
          </Link>
        </nav>

        {/* ── 3D Scroll Journey ── */}
        <div id="hero-scroll-container" style={{ position:'relative', minHeight:'500vh' }}>

          {/* Scene 1: Hero — Shield assembles */}
          <div className="scene-panel" style={{ position:'sticky', top:0, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', textAlign:'center', padding:'0 32px', pointerEvents:'none' }}>
            {/* Dark scrim behind text so particles don't bleed through */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(6,10,20,0.72) 0%, rgba(6,10,20,0.18) 70%, transparent 100%)', pointerEvents:'none' }} />
            <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, border:'1px solid rgba(56,189,248,.45)', background:'rgba(4,20,40,0.75)', backdropFilter:'blur(8px)', marginBottom:32, fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:2.5, color:'#38bdf8', fontWeight:700 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#38bdf8', animation:'tealPulse 2s ease-in-out infinite' }} />
                ACTIVE SECURITY FRAMEWORK
              </div>
              <h1 className="hero-headline" style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(36px,6vw,68px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-1.5px', marginBottom:24, maxWidth:760, textShadow:'0 2px 40px rgba(0,0,0,0.9), 0 0 80px rgba(6,10,20,0.8)' }}>
                The Invisible Security Layer<br />
                <span style={{ background:'linear-gradient(100deg, #38bdf8 0%, #818cf8 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', filter:'drop-shadow(0 0 16px rgba(56,189,248,0.6))' }}>for AI Development</span>
              </h1>
              <p className="hero-sub" style={{ fontSize:'clamp(14px,1.8vw,17px)', color:'#c8dfe8', lineHeight:1.8, maxWidth:520, marginBottom:44, pointerEvents:'auto', textShadow:'0 1px 20px rgba(0,0,0,0.95)', background:'rgba(6,10,20,0.45)', backdropFilter:'blur(4px)', borderRadius:12, padding:'12px 20px' }}>
                Real-time prompt injection prevention, PII scrubbing, and adversarial defense — built directly into your LLM pipeline.
              </p>
              <div className="hero-btns hero-buttons" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', pointerEvents:'auto' }}>
                <Link href="/workspace" className="hero-btn-primary">Deploy Agent →</Link>
                <Link href="/threats" className="hero-btn-outline">View Documentation</Link>
              </div>
            </div>
            <div style={{ position:'absolute', bottom:40, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:0.7 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2, color:'#38bdf8', textShadow:'0 0 10px rgba(56,189,248,0.8)' }}>SCROLL TO EXPLORE</span>
              <div style={{ width:1, height:40, background:'linear-gradient(to bottom, #38bdf8, transparent)' }} />
            </div>
          </div>

          {/* Scene 2: Threat Detection */}
          <div style={{ position:'sticky', top:0, height:'100vh', display:'flex', alignItems:'center', justifyContent:'flex-start', padding:'0 8vw' }} className="scene-2">
            <div style={{ maxWidth:440, background:'rgba(6,10,18,0.88)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,45,85,0.35)', borderRadius:20, padding:'40px 36px', boxShadow:'0 8px 60px rgba(0,0,0,0.6)' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:3, color:'#ff2d55', marginBottom:16 }}>ACTIVE DEFENSE · SCENE 02</div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(24px,3vw,38px)', fontWeight:800, lineHeight:1.2, marginBottom:16, letterSpacing:'-0.5px', textShadow:'0 2px 20px rgba(0,0,0,0.8)' }}>
                Prompt Injection<br /><span style={{ color:'#ff2d55' }}>Firewall</span>
              </h2>
              <p style={{ color:'#b8d4e0', fontSize:14, lineHeight:1.8 }}>Adversarial prompts hit the shield and are deflected before they ever reach your model. Zero false negatives on known attack vectors.</p>
              <div style={{ marginTop:24, display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#ff2d55', boxShadow:'0 0 12px #ff2d55' }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#ff2d55', letterSpacing:1.5 }}>BLOCKING THREATS IN REAL-TIME</span>
              </div>
            </div>
          </div>

          {/* Scene 3: PII Scrubbing */}
          <div style={{ position:'sticky', top:0, height:'100vh', display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 8vw' }} className="scene-3">
            <div style={{ maxWidth:440, background:'rgba(6,10,18,0.88)', backdropFilter:'blur(24px)', border:'1px solid rgba(56,189,248,0.35)', borderRadius:20, padding:'40px 36px', boxShadow:'0 8px 60px rgba(0,0,0,0.6)' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:3, color:'#38bdf8', marginBottom:16 }}>VIRIDANCE MODULE · SCENE 03</div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(24px,3vw,38px)', fontWeight:800, lineHeight:1.2, marginBottom:16, letterSpacing:'-0.5px', textShadow:'0 2px 20px rgba(0,0,0,0.8)' }}>
                Zero-Knowledge<br /><span style={{ color:'#38bdf8' }}>PII Scrubbing</span>
              </h2>
              <p style={{ color:'#b8d4e0', fontSize:14, lineHeight:1.8 }}>Data packets stream through the shield, exit clean. API keys, emails, SSNs — detected and masked before leaving your infrastructure.</p>
              <div style={{ marginTop:24, display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#38bdf8', boxShadow:'0 0 12px #38bdf8' }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#38bdf8', letterSpacing:1.5 }}>40+ SECRET PATTERNS ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Scene 4: Agent Control */}
          <div style={{ position:'sticky', top:0, height:'100vh', display:'flex', alignItems:'center', justifyContent:'flex-start', padding:'0 8vw' }} className="scene-4">
            <div style={{ maxWidth:440, background:'rgba(6,10,18,0.88)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,170,0,0.35)', borderRadius:20, padding:'40px 36px', boxShadow:'0 8px 60px rgba(0,0,0,0.6)' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:3, color:'#ffaa00', marginBottom:16 }}>AGENT CONTROL · SCENE 04</div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(24px,3vw,38px)', fontWeight:800, lineHeight:1.2, marginBottom:16, letterSpacing:'-0.5px', textShadow:'0 2px 20px rgba(0,0,0,0.8)' }}>
                Permission<br /><span style={{ color:'#ffaa00' }}>Orbital Lock</span>
              </h2>
              <p style={{ color:'#b8d4e0', fontSize:14, lineHeight:1.8 }}>Every AI agent is locked to exactly what it needs. Restricted actions enforced at the API layer — not just a policy document.</p>
              <div style={{ marginTop:24, display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#ffaa00', boxShadow:'0 0 12px #ffaa00' }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#ffaa00', letterSpacing:1.5 }}>ZERO PRIVILEGE ESCALATION</span>
              </div>
            </div>
          </div>

          {/* Scene 5: CTA / Shield reassembles */}
          <div style={{ position:'sticky', top:0, height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', textAlign:'center', padding:'0 32px' }} className="scene-5">
            {/* Dark radial scrim */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,10,20,0.75) 0%, rgba(6,10,20,0.15) 70%, transparent 100%)', pointerEvents:'none' }} />
            <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#7ecfea', letterSpacing:2.5, marginBottom:18 }}>FULLY PROTECTED</div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(28px,5vw,54px)', fontWeight:800, letterSpacing:'-1px', marginBottom:16, background:'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', filter:'drop-shadow(0 0 20px rgba(56,189,248,0.5))' }}>Your AI stack, secured.</h2>
              <p style={{ color:'#c8dfe8', fontSize:15, marginBottom:44, maxWidth:460, textShadow:'0 1px 20px rgba(0,0,0,0.9)', background:'rgba(6,10,20,0.5)', backdropFilter:'blur(4px)', borderRadius:10, padding:'10px 18px' }}>No infrastructure changes. No employee retraining. Just an invisible shield around every AI call.</p>
              <Link href="/workspace" className="hero-btn-primary" style={{ fontSize:15, padding:'16px 44px', pointerEvents:'auto', background:'linear-gradient(135deg,#38bdf8,#818cf8)', boxShadow:'0 0 40px rgba(56,189,248,0.3)' }}>
                Launch Workspace →
              </Link>
            </div>
          </div>

        </div>{/* end hero-scroll-container */}


        {/* ── Stats bar ── */}
        <div className="stats-bar" style={{ maxWidth:900, margin:'0 auto 80px', padding:'0 32px' }}>
          <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'rgba(0,229,255,0.06)', borderRadius:14, border:'1px solid rgba(0,229,255,0.1)', overflow:'hidden' }}>
            {[
              { value:'99.9%', label:'Attack Block Rate' },
              { value:'<5ms',  label:'Added Latency' },
              { value:'40+',   label:'Secret Patterns' },
              { value:'0',     label:'Bytes Leaked' },
            ].map((s,i)=>(
              <div key={i} className="stat-item" style={{ padding:'28px 20px', textAlign:'center', background:'rgba(8,12,18,0.8)' }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:32, fontWeight:800, color:'#00e5ff', textShadow:'0 0 20px rgba(0,229,255,0.4)', lineHeight:1, marginBottom:6 }}>{s.value}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#2a4a5a', letterSpacing:1.5 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature cards ── */}
        <section className="features-section" style={{ maxWidth:1100, margin:'0 auto 100px', padding:'0 32px' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:3, color:'#00e5ff', marginBottom:14 }}>VIRIDANCE MODULES</div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(26px,4vw,40px)', fontWeight:800, letterSpacing:'-0.5px' }}>Every attack surface, covered.</h2>
          </div>

          <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {[
              { icon:'🔍', title:'Secret Scrubbing & PII Redaction', desc:'Automatically detect and mask API keys, passwords, and sensitive personal data before they ever reach the model training set or prompt log.', color:'#00e5ff', tag:'VIRIDANCE MODULE' },
              { icon:'💉', title:'Prompt Injection Firewall', desc:'Our neural scanner intercepts adversarial prompts designed to bypass model guardrails or leak internal system instructions.', color:'#ff2d55', tag:'ACTIVE DEFENSE' },
              { icon:'⚡', title:'Zero-Knowledge Token Encryption', desc:'Your data is encrypted at the token level before leaving your infrastructure. We secure the pipeline without ever seeing the content.', color:'#bf5af2', tag:'END-TO-END' },
              { icon:'🤖', title:'Agent Permission Control', desc:'Every AI agent locked to exactly what it needs. Restricted actions are enforced at the API layer — not just a policy doc.', color:'#ffaa00', tag:'AGENT CONTROL' },
              { icon:'📈', title:'Anomaly Detection', desc:'Behavioral patterns catch attacks no filter can see. Rate limiting and session analysis stop sophisticated multi-step attacks.', color:'#00ff88', tag:'BEHAVIORAL AI' },
              { icon:'📋', title:'Compliance Audit Log', desc:'Every security event logged with full context for GDPR, SOC2, HIPAA, and PCI-DSS compliance and forensic investigation.', color:'#00e5ff', tag:'COMPLIANCE' },
            ].map((f,i)=>(
              <div key={i} className="feature-card" style={{ padding:'28px 24px', animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2, color:f.color, marginBottom:14, opacity:0.8 }}>{f.tag}</div>
                <div style={{ fontSize:28, marginBottom:12 }}>{f.icon}</div>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:'#e2edf5', marginBottom:10, lineHeight:1.3 }}>{f.title}</h3>
                <p style={{ fontSize:13, color:'#6b9aaa', lineHeight:1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Processing latency + block rate ── */}
        <section style={{ maxWidth:1100, margin:'0 auto 100px', padding:'0 32px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

            {/* Latency card */}
            <div style={{ background:'#0d1826', border:'1px solid rgba(0,229,255,0.08)', borderRadius:14, padding:'36px 32px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, #00e5ff44, transparent)' }} />
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:2, color:'#6b9aaa', marginBottom:16 }}>PROCESSING LATENCY</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:64, fontWeight:800, color:'#00e5ff', textShadow:'0 0 40px rgba(0,229,255,0.35)', lineHeight:1 }}>&lt;5ms</div>
              <div style={{ marginTop:20 }}>
                <svg viewBox="0 0 200 40" style={{ width:'100%', height:40 }}>
                  <polyline points="0,30 20,25 40,32 60,18 80,28 100,10 120,22 140,16 160,28 180,14 200,20" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeOpacity="0.6" />
                  <polyline points="0,30 20,25 40,32 60,18 80,28 100,10 120,22 140,16 160,28 180,14 200,20 200,40 0,40" fill="#00e5ff" fillOpacity="0.05" />
                </svg>
              </div>
            </div>

            {/* Block rate card */}
            <div style={{ background:'#0d1826', border:'1px solid rgba(0,229,255,0.08)', borderRadius:14, padding:'36px 32px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, rgba(0,255,136,0.4), transparent)' }} />
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:2, color:'#6b9aaa', marginBottom:16 }}>ATTACK BLOCK RATE</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:64, fontWeight:800, color:'#00ff88', textShadow:'0 0 40px rgba(0,255,136,0.35)', lineHeight:1 }}>99.9%</div>
              <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ height:4, flex:1, background:'rgba(0,255,136,0.1)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:'99.9%', background:'#00ff88', boxShadow:'0 0 8px rgba(0,255,136,0.5)', borderRadius:2 }} />
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#00ff88' }}>SOC 2 TYPE II CERTIFIED</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Code integration ── */}
        <section style={{ maxWidth:900, margin:'0 auto 100px', padding:'0 32px' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:3, color:'#00e5ff', marginBottom:14 }}>INTEGRATION PATHS</div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(24px,4vw,38px)', fontWeight:800, letterSpacing:'-0.5px' }}>Three Lines of Code to Active Protection</h2>
          </div>
          <div style={{ background:'#080e1a', border:'1px solid rgba(0,229,255,0.1)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#ff2d55' }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#ffaa00' }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#00ff88' }} />
              <span style={{ marginLeft:8, fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#2a4a5a', letterSpacing:1 }}>secure_ai_wrapper.py</span>
            </div>
            <div style={{ padding:'28px 28px', fontFamily:"'JetBrains Mono',monospace", fontSize:13, lineHeight:2, overflowX:'auto' }}>
              <div><span style={{ color:'#6b9aaa' }}>import</span> <span style={{ color:'#00e5ff' }}>secureai</span></div>
              <div><span style={{ color:'#6b9aaa' }}>from</span> <span style={{ color:'#00e5ff' }}>secureai.guard</span> <span style={{ color:'#6b9aaa' }}>import</span> <span style={{ color:'#e2edf5' }}>OpenAI</span></div>
              <div style={{ height:16 }} />
              <div style={{ color:'#2a4a5a' }}># Invisible drop-in replacement</div>
              <div><span style={{ color:'#e2edf5' }}>guard</span> <span style={{ color:'#6b9aaa' }}>=</span> <span style={{ color:'#e2edf5' }}>secureai</span><span style={{ color:'#6b9aaa' }}>.</span><span style={{ color:'#00e5ff' }}>Guard</span><span style={{ color:'#e2edf5' }}>(api_key=</span><span style={{ color:'#00ff88' }}>"sk-secur_..."</span><span style={{ color:'#e2edf5' }}>)</span></div>
              <div style={{ height:16 }} />
              <div style={{ color:'#2a4a5a' }}># Your code runs with invisible security</div>
              <div><span style={{ color:'#e2edf5' }}>secure_llm</span> <span style={{ color:'#6b9aaa' }}>=</span> <span style={{ color:'#e2edf5' }}>guard</span><span style={{ color:'#6b9aaa' }}>.</span><span style={{ color:'#00e5ff' }}>wrap</span><span style={{ color:'#e2edf5' }}>(OpenAI(temperature=0))</span></div>
              <div><span style={{ color:'#e2edf5' }}>response</span> <span style={{ color:'#6b9aaa' }}>=</span> <span style={{ color:'#e2edf5' }}>secure_llm</span><span style={{ color:'#6b9aaa' }}>.</span><span style={{ color:'#00e5ff' }}>predict</span><span style={{ color:'#e2edf5' }}>(</span><span style={{ color:'#ff2d55' }}>"Process sensitive user query..."</span><span style={{ color:'#e2edf5' }}>)</span></div>
            </div>
          </div>
        </section>

        {/* ── Compliance strip ── */}
        <div style={{ maxWidth:900, margin:'0 auto 100px', padding:'0 32px', position:'relative', zIndex:10 }}>
          <div style={{ background:'rgba(6,10,20,0.7)', backdropFilter:'blur(12px)', border:'1px solid rgba(0,255,136,0.2)', borderRadius:14, padding:'24px 40px', display:'flex', alignItems:'center', gap:32, flexWrap:'wrap', justifyContent:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.5)' }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#7e9cb3', letterSpacing:1 }}>COMPLIANCE READY</span>
            {['GDPR','SOC2','HIPAA','PCI-DSS'].map(c=>(
              <div key={c} style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ color:'#00ff88', fontSize:12 }}>✓</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#e2edf5', textShadow:'0 2px 10px rgba(0,0,0,0.8)' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <section className="cta-section" style={{ textAlign:'center', padding:'60px 32px 100px', borderTop:'1px solid rgba(255,255,255,0.04)', position:'relative' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,10,20,0.85) 0%, rgba(6,10,20,0.2) 70%, transparent 100%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:10 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#7ecfea', letterSpacing:2.5, marginBottom:18 }}>GET STARTED</div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(26px,5vw,50px)', fontWeight:800, letterSpacing:'-1px', marginBottom:16, textShadow:'0 2px 20px rgba(0,0,0,0.8)' }}>Ready to secure your AI stack?</h2>
            <p style={{ color:'#c8dfe8', fontSize:15, marginBottom:40, textShadow:'0 1px 15px rgba(0,0,0,0.9)' }}>No infrastructure changes. No employee retraining. Just protection.</p>
            <Link href="/workspace" className="hero-btn-primary" style={{ fontSize:14, padding:'14px 40px', boxShadow:'0 0 30px rgba(0,229,255,0.3)' }}>
              Launch Workspace →
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ textAlign:'center', padding:'20px 32px', borderTop:'1px solid rgba(255,255,255,0.1)', fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#7e9cb3', letterSpacing:1, position:'relative', background:'rgba(6,10,20,0.85)', backdropFilter:'blur(10px)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8, maxWidth:900, margin:'0 auto', position:'relative', zIndex:10 }}>
            <span>© 2024 SECUREAI PLATFORM. ALL RIGHTS RESERVED. SOC2 TYPE II CERTIFIED.</span>
            <div style={{ display:'flex', gap:24 }}>
              {['Security Policy','Blog','Docs','Enterprise'].map(l=>(
                <Link key={l} href="#" style={{ color:'#b8d4e0', textDecoration:'none', transition:'color .2s' }}
                  onMouseEnter={undefined}>{l}</Link>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
