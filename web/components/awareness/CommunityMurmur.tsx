'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SoundChannel {
  id: string;
  name: string;
  emoji: string;
  location: string;
  volume: number;
  audioUrl: string; // Simulated audio oscillators or description
}

const CHANNELS: SoundChannel[] = [
  { id: 'rainforest', name: 'Rainforest at Dawn', emoji: '🐒', location: 'Amazon Basin', volume: 40, audioUrl: '' },
  { id: 'glacier', name: 'Glacier Melt Crackle', emoji: '🏔️', location: 'Svalbard, Norway', volume: 10, audioUrl: '' },
  { id: 'forest', name: 'Reforestation Whispers', emoji: '🌲', location: 'Aberdare, Kenya', volume: 50, audioUrl: '' },
];

export function CommunityMurmur() {
  const [channels, setChannels] = useState<SoundChannel[]>(CHANNELS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [communityUnlocked, setCommunityUnlocked] = useState(true);
  const [includeFrogs, setIncludeFrogs] = useState(false);

  // Web Audio Context for synthesizer simulation of natural sounds (wind, water, crackles)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<any[]>([]);

  const togglePlayback = () => {
    if (isPlaying) {
      stopSynthesizer();
    } else {
      startSynthesizer();
    }
    setIsPlaying(!isPlaying);
  };

  const startSynthesizer = () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // 1. Simulating Forest Wind (Brown Noise)
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const nextVal = ((lastOut + 0.02 * white) / 1.02) * 3.5;
      output[i] = nextVal;
      lastOut = nextVal;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make brown noise feel like wind rustling leaves
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    const windGain = ctx.createGain();
    const forestChan = channels.find(c => c.id === 'forest')!;
    windGain.gain.setValueAtTime((forestChan.volume / 100) * 0.2, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(windGain);
    windGain.connect(ctx.destination);
    whiteNoise.start();

    oscillatorsRef.current.push({ source: whiteNoise, gainNode: windGain, channelId: 'forest' });

    // 2. Simulating Glacier Water Crackle (High Pitch Osculation)
    const crackleInterval = setInterval(() => {
      if (ctx.state === 'suspended') return;
      const glacierChan = channels.find(c => c.id === 'glacier')!;
      if (glacierChan.volume === 0) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(Math.random() * 2000 + 1000, ctx.currentTime);
      gain.gain.setValueAtTime((glacierChan.volume / 100) * 0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }, 150);

    // 3. Simulating Amazon Bird/Insect calls (frequency sweeps)
    const birdInterval = setInterval(() => {
      if (ctx.state === 'suspended') return;
      const rfChan = channels.find(c => c.id === 'rainforest')!;
      if (rfChan.volume === 0) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.random() * 1200 + 800, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime((rfChan.volume / 100) * 0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    }, 1200);

    // 4. Simulating Unlocked Wetland Frogs
    const frogInterval = setInterval(() => {
      if (ctx.state === 'suspended' || !includeFrogs) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.setValueAtTime(85, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      // Low pass to sound croaky
      const frogFilter = ctx.createBiquadFilter();
      frogFilter.type = 'lowpass';
      frogFilter.frequency.setValueAtTime(150, ctx.currentTime);

      osc.connect(frogFilter);
      frogFilter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    }, 800);

    oscillatorsRef.current.push({ intervalId: crackleInterval });
    oscillatorsRef.current.push({ intervalId: birdInterval });
    oscillatorsRef.current.push({ intervalId: frogInterval });
  };

  const stopSynthesizer = () => {
    oscillatorsRef.current.forEach((obj) => {
      if (obj.source) {
        try { obj.source.stop(); } catch {}
      }
      if (obj.intervalId) {
        clearInterval(obj.intervalId);
      }
    });
    oscillatorsRef.current = [];

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopSynthesizer();
    };
  }, []);

  const handleVolumeChange = (id: string, newVol: number) => {
    const updated = channels.map((c) => {
      if (c.id === id) {
        return { ...c, volume: newVol };
      }
      return c;
    });
    setChannels(updated);

    // Adjust synthesizer node gain actively if running
    if (isPlaying && audioCtxRef.current) {
      const activeObj = oscillatorsRef.current.find(o => o.channelId === id);
      if (activeObj && activeObj.gainNode) {
        activeObj.gainNode.gain.setValueAtTime((newVol / 100) * 0.2, audioCtxRef.current.currentTime);
      }
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎧</span> Community Murmur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-ink-soft">
          Blend natural sounds from biodiverse zones. As your community locks in green actions, ecosystem sounds return. Currently: <strong>Wetland Frogs croaking</strong> is woven in because your Hive hit a 5-day streak!
        </p>

        {/* Audio control button */}
        <div className="flex justify-center py-2">
          <Button
            variant={isPlaying ? 'outline' : 'primary'}
            size="md"
            className="w-44 flex items-center justify-center gap-2"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <>
                <span>⏹</span> Pause Murmur
              </>
            ) : (
              <>
                <span>▶</span> Listen to Earth
              </>
            )}
          </Button>
        </div>

        {/* Mixer Sliders */}
        <div className="space-y-4">
          {channels.map((chan) => (
            <div key={chan.id} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-ink">
                <span>{chan.emoji} {chan.name} ({chan.location})</span>
                <span className="font-mono">{chan.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={chan.volume}
                onChange={(e) => handleVolumeChange(chan.id, parseInt(e.target.value, 10))}
                className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-forest-action"
              />
            </div>
          ))}
        </div>

        {/* Community Unlocked sound slot */}
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
          includeFrogs 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-forest-deep' 
            : 'bg-white/40 border-border text-ink-soft'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐸</span>
            <div>
              <h4 className="text-xs font-bold text-ink">Wetland Recovery (Frogs)</h4>
              <p className="text-[10px] text-ink-soft">Unlocked by local community's 5-day green streak.</p>
            </div>
          </div>
          <button
            onClick={() => setIncludeFrogs(!includeFrogs)}
            disabled={!communityUnlocked}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
              includeFrogs 
                ? 'bg-emerald-500 text-white border-transparent' 
                : 'bg-white border-border text-ink hover:border-forest-action/45'
            }`}
          >
            {includeFrogs ? 'Mute' : 'Weave In'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
