'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SeedPlanting {
  id: string;
  contributor: string;
  flowerType: string;
  coords: { x: number; y: number };
  date: string;
}

const PLANTINGS: SeedPlanting[] = [
  { id: '1', contributor: 'Marta', flowerType: 'Wild Marigolds', coords: { x: 120, y: 140 }, date: 'June 10' },
  { id: '2', contributor: 'Chloe', flowerType: 'Native Lavender', coords: { x: 180, y: 190 }, date: 'June 12' },
  { id: '3', contributor: 'Kenji', flowerType: 'Red Poppies', coords: { x: 260, y: 110 }, date: 'June 14' },
  { id: '4', contributor: 'You', flowerType: 'Cornflowers', coords: { x: 200, y: 220 }, date: 'Just now' },
];

export function SeedPacketExchange() {
  const [claimed, setClaimed] = useState(false);
  const [plantings, setPlantings] = useState<SeedPlanting[]>(PLANTINGS.slice(0, 3));
  const [selectedPlanting, setSelectedPlanting] = useState<SeedPlanting | null>(null);

  const claimSeeds = () => {
    setClaimed(true);
    // Add the user's planting to the map
    setPlantings([...plantings, PLANTINGS.find(p => p.contributor === 'You')!]);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🌸</span> Seed Packet Exchange
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-ink-soft">
          Achieve milestones (like a month of plant-based logs) to receive wildflower seed packets in the mail. Plant them and pin your coordinates to form virtual pollinator corridors with the community.
        </p>

        {/* Claim Box */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-ink">Milestone: 30-Day Plant-Based Eating</h4>
            <p className="text-[10px] text-ink-soft">Reward: 1 Packet of Native Cornflower Seeds.</p>
          </div>
          {!claimed ? (
            <Button variant="primary" size="sm" onClick={claimSeeds}>
              Claim & Plant
            </Button>
          ) : (
            <span className="text-xs text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              ✓ Packet Claimed & Geolocated
            </span>
          )}
        </div>

        {/* Vector Map Container */}
        <div className="flex flex-col items-center">
          <h4 className="text-xs font-bold text-forest-deep uppercase tracking-wider font-mono mb-2">Neighborhood Pollinator Corridors</h4>
          
          <div className="relative w-full max-w-[400px] aspect-square rounded-2xl overflow-hidden border border-forest-action/20 bg-emerald-950/15 shadow-inner">
            {/* SVG Vector Map */}
            <svg viewBox="0 0 360 360" className="w-full h-full block">
              <defs>
                {/* Corridor line glow filter */}
                <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid / Topography lines */}
              <path d="M 0,90 L 360,90 M 0,180 L 360,180 M 0,270 L 360,270 M 90,0 L 90,360 M 180,0 L 180,360 M 270,0 L 270,360" stroke="rgba(45, 122, 79, 0.05)" strokeWidth="1" />
              
              {/* Rivers / pathways representing natural geographic lines */}
              <path d="M -10,100 C 120,130 140,240 370,260" fill="none" stroke="rgba(34, 211, 238, 0.15)" strokeWidth="8" />

              {/* Pollinator corridor green glowing link line */}
              <path 
                d="M 120,140 L 180,190 L 200,220 L 260,110" 
                fill="none" 
                stroke="#10B981" 
                strokeWidth="4" 
                strokeDasharray="6,4" 
                filter="url(#corridorGlow)" 
                className="animate-dash" 
                style={{ opacity: claimed ? 1 : 0.6 }}
              />

              {/* Planted coordinate markers */}
              {plantings.map((p) => {
                const isSelected = selectedPlanting?.id === p.id;
                return (
                  <g key={p.id} className="cursor-pointer" onClick={() => setSelectedPlanting(p)}>
                    {/* Ring glow */}
                    <circle cx={p.coords.x} cy={p.coords.y} r={isSelected ? 16 : 8} fill="rgba(16, 185, 129, 0.3)" className="animate-ping-slow" />
                    {/* Core dot */}
                    <circle cx={p.coords.x} cy={p.coords.y} r="6" fill="#10B981" stroke="#ffffff" strokeWidth="1.5" />
                    {/* Small Flower icon above marker */}
                    <text x={p.coords.x - 6} y={p.coords.y - 10} className="text-[10px] pointer-events-none select-none">🌸</text>
                  </g>
                );
              })}
            </svg>

            {/* Float prompt instruction */}
            <div className="absolute bottom-2 left-4 right-4 text-center pointer-events-none">
              <span className="text-[9px] bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded text-white/90">
                Tap on seed pins to see who planted wildflowers.
              </span>
            </div>
          </div>
        </div>

        {/* Selected Pin Details */}
        {selectedPlanting ? (
          <div className="p-3.5 rounded-xl border border-forest-action/20 bg-forest-action/5 animate-scale-in space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-ink">Planted Corridor Node</h4>
                <p className="text-[10px] text-ink-soft">Contributor: {selectedPlanting.contributor} · {selectedPlanting.date}</p>
              </div>
              <button 
                onClick={() => setSelectedPlanting(null)}
                className="text-xs text-ink-soft hover:text-ink cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-ink-soft">
              Planted **{selectedPlanting.flowerType}** to feed wild honeybees and butterflies, expanding the local pollinator highway.
            </p>
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed border-border rounded-xl">
            <p className="text-xs text-ink-soft">No node selected.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
