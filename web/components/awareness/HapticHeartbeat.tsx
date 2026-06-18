'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export function HapticHeartbeat() {
  const { userProfile } = useAuth();
  const terraScore = userProfile?.terraScore ?? 75;
  const activeBiome = userProfile?.activeBiome ?? 'temperate-forest';

  const [isPressing, setIsPressing] = useState(false);
  const [pulseScale, setPulseScale] = useState(1);
  const [hapticSupported, setHapticSupported] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHapticSupported(typeof navigator !== 'undefined' && 'vibrate' in navigator);
  }, []);

  // Determine pulse speed and patterns based on score
  const isStressed = terraScore < 60;
  const isThriving = terraScore >= 80;

  // Pulse speed (ms per beat)
  const pulseInterval = isStressed ? 1600 : isThriving ? 750 : 1000;

  useEffect(() => {
    let scaleDirection = 1;
    const animatePulse = setInterval(() => {
      setPulseScale(scaleDirection === 1 ? 1.08 : 1);
      scaleDirection = scaleDirection === 1 ? 0 : 1;
    }, pulseInterval / 2);

    return () => clearInterval(animatePulse);
  }, [pulseInterval]);

  // Handle heartbeat vibration pattern while pressed
  const startHeartbeat = () => {
    setIsPressing(true);
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

    let pattern: number[] = [];
    if (isStressed) {
      // Stressed: faint, slow, irregular heartbeat
      pattern = [50, 1500, 50, 200, 50, 1200];
    } else if (isThriving) {
      // Thriving: strong, rapid, steady heartbeat
      pattern = [150, 100, 150, 500];
    } else {
      // Healthy: normal, steady heartbeat
      pattern = [100, 150, 100, 750];
    }

    // Vibrate repeatedly
    navigator.vibrate(pattern);
    intervalRef.current = setInterval(() => {
      navigator.vibrate(pattern);
    }, pattern.reduce((a, b) => a + b, 0));
  };

  const stopHeartbeat = () => {
    setIsPressing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(0); // Stop vibration
    }
  };

  // Biome specific colors
  const coreColors = {
    'temperate-forest': {
      bg: 'from-emerald-600 to-green-400',
      shadow: 'rgba(52, 211, 153, 0.4)',
    },
    'coral-reef': {
      bg: 'from-cyan-500 to-teal-400',
      shadow: 'rgba(34, 211, 238, 0.4)',
    },
    'alpine-meadow': {
      bg: 'from-indigo-500 to-sky-400',
      shadow: 'rgba(99, 102, 241, 0.4)',
    },
  }[activeBiome as 'temperate-forest' | 'coral-reef' | 'alpine-meadow'] || {
    bg: 'from-emerald-600 to-green-400',
    shadow: 'rgba(52, 211, 153, 0.4)',
  };

  return (
    <Card className="glass-card overflow-hidden relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💓</span> Haptic Heartbeat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-ink-soft mb-6 max-w-sm">
          Press and hold the pulse core. Feel the steady, living heartbeat of your digital biome matching its health.
        </p>

        {/* Pulse core container */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Pulsing ring outer */}
          <div
            className={`absolute rounded-full w-36 h-36 border-2 border-forest-action/30 transition-transform duration-300`}
            style={{
              transform: `scale(${pulseScale * 1.3})`,
              opacity: isPressing ? 0.8 : 0.4,
            }}
          />
          {/* Pulsing ring inner */}
          <div
            className={`absolute rounded-full w-28 h-28 border border-forest-action/20 transition-transform duration-300`}
            style={{
              transform: `scale(${pulseScale * 1.15})`,
              opacity: isPressing ? 0.9 : 0.6,
            }}
          />

          {/* Actual Press Target */}
          <button
            onMouseDown={startHeartbeat}
            onMouseUp={stopHeartbeat}
            onMouseLeave={stopHeartbeat}
            onTouchStart={(e) => {
              e.preventDefault();
              startHeartbeat();
            }}
            onTouchEnd={stopHeartbeat}
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${coreColors.bg} flex items-center justify-center transition-all duration-150 relative z-10 cursor-pointer outline-none focus:ring-4 focus:ring-forest-action/30`}
            style={{
              transform: `scale(${isPressing ? 0.92 : pulseScale})`,
              boxShadow: `0 0 30px ${isPressing ? '12px' : '6px'} ${coreColors.shadow}`,
            }}
          >
            <span className="text-2xl select-none">{isStressed ? '🌱' : isThriving ? '🌲' : '🌿'}</span>
          </button>
        </div>

        <div className="mt-6">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-forest-action/10 border border-forest-action/20 text-forest-deep">
            Biome: <span className="capitalize">{activeBiome.replace('-', ' ')}</span> ({terraScore}/100 Health)
          </span>
        </div>

        <p className="text-[10px] text-ink-soft mt-4">
          {hapticSupported 
            ? '✓ Haptic Engine Ready. Press and hold core.' 
            : '📳 Haptic pulse is visual-only (Web Vibration API not supported on this browser).'}
        </p>
      </CardContent>
    </Card>
  );
}
