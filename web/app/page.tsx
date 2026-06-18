'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { EcosystemAvatar } from '@/components/ui/EcosystemAvatar';

// ── Background Canvas Component ──────────────────────────────────────────────
function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
    }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.05,
        color: Math.random() > 0.5 ? '#4ecdc4' : '#5a9e6f',
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Deep biophilic gradient background matching style.css
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#0f1f0f');
      bg.addColorStop(0.5, '#121e1a');
      bg.addColorStop(1, '#0d1a1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Draw drifting particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      });
      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none" />;
}

// ── Landing Page Component ───────────────────────────────────────────────────
export default function LandingPage() {
  const [activeBiome, setActiveBiome] = useState<'temperate-forest' | 'coral-reef' | 'alpine-meadow'>('temperate-forest');
  const [terraScore, setTerraScore] = useState(74);

  const BIOMES = [
    { id: 'temperate-forest', name: '🌲 Forest', emoji: '🌲' },
    { id: 'coral-reef', name: '🪸 Coral Reef', emoji: '🪸' },
    { id: 'alpine-meadow', name: '🏔️ Meadow', emoji: '🏔️' },
  ] as const;

  const healthLabel = terraScore >= 80 ? 'Thriving' : terraScore >= 60 ? 'Healthy' : 'Stressed ⚠️';
  const healthColor = terraScore >= 80 ? 'text-emerald-400' : terraScore >= 60 ? 'text-teal-400' : 'text-amber-400';

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden font-body bg-[#0f1f0f]">
      <BackgroundCanvas />

      <div className="relative z-10">
        {/* Inject animations in standard React style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.97); }
        }
        @keyframes pulse-logo {
          0%, 100% { box-shadow: 0 0 20px rgba(90,158,111,0.35); transform: scale(1); }
          50% { box-shadow: 0 0 35px rgba(90,158,111,0.6); transform: scale(1.05); }
        }
        .animate-drift {
          animation: drift 8s ease-in-out infinite;
        }
        .animate-pulse-logo {
          animation: pulse-logo 3s ease-in-out infinite;
        }
        .glass-card-dark-hover:hover {
          border-color: rgba(78,205,196,0.3);
          box-shadow: 0 0 40px rgba(78,205,196,0.15);
        }
      `}} />

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-white/5 bg-black/20 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5a9e6f] to-[#4ecdc4] flex items-center justify-center animate-pulse-logo">
            <span className="text-xl" role="img" aria-label="TerraPulse leaf">🌿</span>
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            Earth<span className="text-teal-300">Print</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-gradient-to-r from-[#5a9e6f] to-[#2aa8a8] hover:from-[#4ecdc4] hover:to-[#5a9e6f] text-white text-sm font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-[0_0_25px_rgba(90,158,111,0.4)] hover:scale-[1.02]"
          >
            Start Your Journey 🌱
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-16 pb-24 max-w-7xl mx-auto z-10">
        
        {/* Floating Biophilic Orbs from style.css */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div 
            className="absolute rounded-full filter blur-[60px] animate-drift opacity-40"
            style={{
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(45,90,61,0.5) 0%, transparent 70%)',
              top: '5%',
              left: '-10%',
              animationDelay: '0s',
            }}
          />
          <div 
            className="absolute rounded-full filter blur-[60px] animate-drift opacity-40"
            style={{
              width: '350px',
              height: '350px',
              background: 'radial-gradient(circle, rgba(26,107,107,0.4) 0%, transparent 70%)',
              top: '15%',
              right: '-5%',
              animationDelay: '2s',
            }}
          />
          <div 
            className="absolute rounded-full filter blur-[60px] animate-drift opacity-30"
            style={{
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(122,184,138,0.3) 0%, transparent 70%)',
              bottom: '5%',
              left: '30%',
              animationDelay: '4s',
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs text-teal-300 font-bold uppercase tracking-wider font-mono">
                Interactive Biophilic Sandbox
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-white">
              Keep Your <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">Planet Alive</span> & Thriving
            </h1>

            <p className="text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              EarthPrint transforms your daily choices into a living digital ecosystem.
              Watch your world flourish as you take meaningful climate action — no guilt, no spreadsheets, just growth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-[#5a9e6f] to-[#2aa8a8] hover:from-[#4ecdc4] hover:to-[#5a9e6f] text-white font-bold text-lg rounded-full transition-all duration-300 shadow-md hover:shadow-[0_0_25px_rgba(90,158,111,0.5)] hover:-translate-y-0.5 hover:scale-[1.03] w-full sm:w-auto text-center"
              >
                🌱 Grow Your Ecosystem
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 border border-white/20 hover:border-teal-400 text-white/80 hover:text-white text-lg rounded-full transition-all duration-200 w-full sm:w-auto text-center bg-white/5 hover:bg-white/10"
              >
                View Dashboard
              </Link>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 max-w-md mx-auto lg:mx-0 text-left">
              <div>
                <p className="font-display text-2xl md:text-3xl font-extrabold text-[#4ecdc4]">2.4M</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mt-1">Active Nurturers</p>
              </div>
              <div>
                <p className="font-display text-2xl md:text-3xl font-extrabold text-[#5a9e6f]">142K</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mt-1">Tonnes CO₂ Saved</p>
              </div>
              <div>
                <p className="font-display text-2xl md:text-3xl font-extrabold text-[#e8a842]">890K</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mt-1">Trees Planted</p>
              </div>
            </div>
          </div>

          {/* Right Sandbox Column */}
          <div className="lg:col-span-5 relative">
            <div className="glass-card-dark rounded-3xl p-6 border border-white/10 shadow-2xl relative z-10 flex flex-col gap-6 bg-black/40 backdrop-blur-xl">
              
              {/* Ecosystem Canvas Viewport */}
              <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-[#0A2318] border border-white/5">
                <EcosystemAvatar biome={activeBiome} terraScore={terraScore} className="absolute inset-0" />
                
                {/* Visual Badges overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white text-[10px] font-bold">
                    🌿 {activeBiome === 'coral-reef' ? 'Coral Reef' : activeBiome === 'alpine-meadow' ? 'Alpine Meadow' : 'Temperate Forest'}
                  </div>
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white text-[10px] font-bold">
                    🌡️ Health: <span className={healthColor}>{healthLabel}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Sandbox Controls */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2 font-mono">
                    Select Biome Template
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BIOMES.map((b) => {
                      const isActive = activeBiome === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => setActiveBiome(b.id)}
                          className={`py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                            isActive
                              ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-glow'
                              : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                          }`}
                        >
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider block font-mono">
                      Simulate Footprint Health
                    </label>
                    <span className="font-mono text-sm font-bold text-teal-400">
                      Score: {terraScore} / 100
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={terraScore}
                    onChange={(e) => setTerraScore(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 font-mono mt-1">
                    <span>High Carbon (Stressed)</span>
                    <span>Low Carbon (Thriving)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Background floating glows */}
            <div className="absolute -top-6 -right-6 w-72 h-72 rounded-full bg-teal-500/20 filter blur-3xl -z-10 pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-72 h-72 rounded-full bg-emerald-500/10 filter blur-3xl -z-10 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── Why TerraPulse / Features (Expanded to full 6 cards) ─────────────────────────────────────── */}
      <section className="px-6 py-24 relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-teal-400 font-mono">Why EarthPrint</span>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white leading-tight">
              A Living Relationship with Your Planet
            </h2>
            <p className="text-white/60 leading-relaxed text-sm md:text-base font-light">
              Not another spreadsheet. We replaced guilt-inducing carbon metrics with a positive nurturing metaphor. Keep your footprint low-carbon, and your virtual biome flourishes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🌍',
                colorClass: 'bg-[#5a9e6f]/15 text-[#9dd4a8]',
                title: 'Living Ecosystem Avatar',
                desc: 'Your personal biome—forest, reef, or meadow—flourishes or withers based on your choices. Every action sends a visible ripple through your living world.',
              },
              {
                icon: '⚡',
                colorClass: 'bg-[#4ecdc4]/15 text-[#4ecdc4]',
                title: 'Passive, Frictionless Tracking',
                desc: 'Smart activity logging with detailed emissions data across transport, diet, home energy, and goods. No manual input fatigue—just seamless awareness.',
              },
              {
                icon: '🤖',
                colorClass: 'bg-[#e8a842]/15 text-[#e8a842]',
                title: 'Planet Whisperer AI Coach',
                desc: "A wise, in-character coach learns your patterns and suggests tiny, contextual shifts at exactly the right moment—when you're most motivated to act.",
              },
              {
                icon: '🐝',
                colorClass: 'bg-[#7c5cbf]/15 text-[#a084e8]',
                title: 'Community Hive',
                desc: 'Join local impact circles. Compete on aspirational leaderboards. When your circle hits a collective goal, EarthPrint funds a real local restoration project.',
              },
              {
                icon: '🎯',
                colorClass: 'bg-[#5a9e6f]/15 text-[#9dd4a8]',
                title: 'Personal Carbon Budget',
                desc: 'Beautifully visualized against the IPCC 1.5°C per-capita target. Overdraft triggers ecosystem stress—always paired with a concrete, hopeful recovery plan.',
              },
              {
                icon: '🏆',
                colorClass: 'bg-[#4ecdc4]/15 text-[#4ecdc4]',
                title: 'Legacy Trees & Bloom Points',
                desc: 'Every 100 kg of verified reduction plants a real, geotagged tree. Earn Bloom Points, grow your Guardian tier, and build a living forest of lifetime impact.',
              },
            ].map((f, i) => (
              <div key={i} className="glass-card-dark rounded-3xl p-8 border border-white/5 bg-white/3 hover:border-teal-500/20 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(78,205,196,0.1)] flex flex-col items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${f.colorClass}`}>
                  {f.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-white">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Google Services Technology Stack ─────────────────────────────── */}
      <section className="px-6 py-16 border-t border-white/5 bg-black/10">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mb-6">
            Powered by Google Services & Cloud Infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              '🔐 Firebase Authentication',
              '🗄 Cloud Firestore',
              '🗺 Google Maps API',
              '👁 Cloud Vision OCR',
              '✨ Vertex AI Engine',
              '📊 BigQuery Streamer',
              '🔔 Firebase FCM Alerts',
              '📈 Google Analytics',
            ].map((service) => (
              <span
                key={service}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-teal-300 font-bold"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer / Call to Action ──────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-16 bg-black/40 relative z-10 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Ready to make your footprint smaller?
          </h2>
          <p className="text-white/60 font-light text-sm md:text-base leading-relaxed">
            Join thousands of climate strivers already reducing their carbon footprint with EarthPrint.
            Free forever for personal use.
          </p>
          <div className="pt-4">
            <Link
              href="/signup"
              className="inline-block px-10 py-4 bg-gradient-to-r from-[#5a9e6f] to-[#2aa8a8] hover:from-[#4ecdc4] hover:to-[#5a9e6f] text-white font-bold text-lg rounded-full transition-all duration-300 shadow-md hover:shadow-[0_0_25px_rgba(90,158,111,0.5)] hover:-translate-y-0.5 hover:scale-[1.03]"
            >
              Start for Free →
            </Link>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-16 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 mt-16 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-display text-lg font-bold text-white">
              EarthPrint
            </span>
          </div>
          <p className="text-xs font-light">Making carbon awareness seamless, emotionally resonant, and motivating.</p>
          <div className="flex items-center gap-6">
            <Link href="/impact" className="hover:text-white transition-colors">Impact</Link>
            <Link href="/impact" className="hover:text-white transition-colors">Methodology</Link>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
