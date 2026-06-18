'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { useAuth } from '@/providers/AuthProvider';

export function SilenceHour() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [energyLevel, setEnergyLevel] = useState(50); // 0 to 100 scale of energy logs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch energy logs for the past 30 days to compute star brightness
  useEffect(() => {
    if (!user) return;
    const db = getFirebaseDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffIso = cutoffDate.toISOString().split('T')[0]!;

    const logsRef = collection(db, 'users', user.uid, 'logs');
    const q = query(logsRef, where('category', '==', 'energy'), where('activityDate', '>=', cutoffIso));

    getDocs(q).then((snap) => {
      let totalKwh = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.source === 'grid-electricity' || data.source === 'natural-gas') {
          totalKwh += data.kgCo2e || 0;
        }
      });
      // Set energyLevel between 0 (clean/low energy usage) and 100 (high footprint)
      // Normal range: 0 to 200 kg CO2e for energy logs
      setEnergyLevel(Math.min(100, Math.max(10, (totalKwh / 200) * 100)));
    }).catch((err) => {
      console.error('Failed to load energy logs for starfield', err);
    });
  }, [user]);

  // Starfield animation loop when active
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Generate stars. High energyLevel = fewer, dimmer stars. Low energyLevel = clear night sky.
    const starCount = Math.max(50, Math.floor(600 - energyLevel * 4.5));
    const stars: Array<{ x: number; y: number; size: number; speed: number; opacity: number; alphaDir: number }> = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.2,
        speed: Math.random() * 0.05 + 0.01,
        opacity: Math.random(),
        alphaDir: Math.random() > 0.5 ? 0.01 : -0.01,
      });
    }

    const render = () => {
      // Clear with dark sky blue background
      // High energy usage adds a faint orange/grey "smog" background glow
      const red = Math.floor(10 + energyLevel * 0.15);
      const green = Math.floor(12 + energyLevel * 0.1);
      const blue = Math.floor(22 + energyLevel * 0.05);

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw light pollution dome if energy usage is high
      if (energyLevel > 30) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height, 10,
          canvas.width / 2, canvas.height, canvas.height * 0.8
        );
        gradient.addColorStop(0, `rgba(245, 158, 11, ${energyLevel * 0.0018})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw and animate stars
      stars.forEach((star) => {
        // Slow rotation/movement
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }

        // Twinkle
        star.opacity += star.alphaDir;
        if (star.opacity > 0.9) {
          star.opacity = 0.9;
          star.alphaDir = -0.01;
        } else if (star.opacity < 0.15) {
          star.opacity = 0.15;
          star.alphaDir = 0.01;
        }

        // Apply energy light pollution damping
        // Higher energy level dims the overall maximum brightness of stars
        const starsMaxBrightness = Math.max(0.2, 1 - energyLevel * 0.007);
        const actualOpacity = star.opacity * starsMaxBrightness;

        ctx.fillStyle = `rgba(255, 255, 255, ${actualOpacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, energyLevel]);

  // Timer Countdown
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🤫</span> The Silence Hour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-ink-soft">
            Commit to a digital detox. Disconnect from devices for one hour. Observe a starfield representing the sky clarity based on your recent energy usage footprints.
          </p>

          <div className="p-4 rounded-xl bg-forest-deep/5 border border-forest-action/20 flex flex-col items-center">
            <span className="text-3xl font-mono font-bold text-forest-deep mb-2">
              {formatTime(timeLeft)}
            </span>
            <Button
              variant={isActive ? 'ghost' : 'primary'}
              size="md"
              onClick={() => {
                setIsActive(!isActive);
                if (!isActive) setTimeLeft(3600);
              }}
            >
              {isActive ? 'Cancel Detox' : 'Begin Silence Hour'}
            </Button>
          </div>

          <p className="text-[10px] text-ink-soft text-center">
            Sky light pollution simulated from your 30-day electricity and gas footprint.
          </p>
        </CardContent>
      </Card>

      {/* Full screen active starfield overlay */}
      {isActive && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white select-none">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-4 max-w-md bg-black/35 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
            <h2 className="font-display text-2xl font-bold">The Silence Hour</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Put down your phone. Look at the stars. Hear the silence.
            </p>
            <div className="text-4xl font-mono font-bold tracking-widest text-emerald-300">
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => setIsActive(false)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs transition-colors cursor-pointer"
            >
              End Session
            </button>
          </div>
        </div>
      )}
    </>
  );
}
