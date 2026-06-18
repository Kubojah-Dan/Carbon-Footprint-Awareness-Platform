'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface MosaicTile {
  x: number;
  y: number;
  color: string;
  pattern: 'solid' | 'striped' | 'dotted';
  action: string;
  author: string;
  distance: string;
}

const ACTION_COLORS = {
  travel: '#3B82F6', // Blue
  food: '#10B981', // Emerald
  energy: '#F59E0B', // Amber
  shopping: '#8B5CF6', // Violet
};

export function GlobalMosaic() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTile, setSelectedTile] = useState<MosaicTile | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredTileInfo, setHoveredTileInfo] = useState<string | null>(null);

  // Generate tiles mapping in a Grid
  const gridSize = 40; // 40x40 = 1600 visible squares
  const tilesRef = useRef<MosaicTile[]>([]);

  useEffect(() => {
    // Generate static deterministic tiles
    const generated: MosaicTile[] = [];
    const categories = ['travel', 'food', 'energy', 'shopping'] as const;
    const authors = ['Liam', 'Kenji', 'Marta', 'Achieng', 'Sophia', 'Chloe', 'Noah', 'Lucas', 'Mia'];
    const actions = [
      'swapped beef for legumes',
      'cycled 10km commute',
      'turned down heat by 1°C',
      'bought second-hand coat',
      'composted organic food scraps',
      'installed home solar battery',
      'joined community orchard plant-out',
    ];

    // Simple mathematical formula to shape a whale silhouette in the grid
    // Equation of an oval/whale body: (x-20)^2 / 12^2 + (y-20)^2 / 6^2 <= 1
    // Plus a tail: y-20 <= (x-8)/4 and x < 10
    const isInsideWhale = (gx: number, gy: number) => {
      // Body
      const bodyDx = gx - 22;
      const bodyDy = gy - 18;
      const insideBody = (bodyDx * bodyDx) / 144 + (bodyDy * bodyDy) / 36 <= 1;

      // Tail
      const tailX = gx - 8;
      const tailY = gy - 18;
      const insideTail = gx < 10 && gx > 3 && Math.abs(tailY) < Math.abs(tailX - 2) * 0.8;

      // Flippers
      const flipperDx = gx - 20;
      const flipperDy = gy - 26;
      const insideFlipper = (flipperDx * flipperDx) / 9 + (flipperDy * flipperDy) / 25 <= 1;

      return insideBody || insideTail || insideFlipper;
    };

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const inside = isInsideWhale(x, y);
        // If inside the whale, color it with vibrant action colors. Otherwise, use soft ocean blue/green tints.
        let color = 'rgba(45, 122, 79, 0.08)'; // Water background
        let category: keyof typeof ACTION_COLORS | 'none' = 'none';

        if (inside) {
          // Semi-random category based on coordinate hashes to keep it deterministic
          const hash = (x * 17 + y * 31) % 4;
          category = categories[hash]!;
          color = ACTION_COLORS[category];
        }

        const patternHash = (x * 7 + y * 13) % 3;
        const patterns = ['solid', 'striped', 'dotted'] as const;

        generated.push({
          x,
          y,
          color,
          pattern: patterns[patternHash]!,
          action: category !== 'none' ? actions[(x * y) % actions.length]! : '',
          author: category !== 'none' ? authors[(x + y) % authors.length]! : '',
          distance: `${((x + y) % 9 * 0.3 + 0.1).toFixed(1)} km`,
        });
      }
    }
    tilesRef.current = generated;
  }, []);

  // Draw Canvas
  useEffect(() => {
    if (!canvasRef.current || tilesRef.current.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cellSize = canvas.width / gridSize;

    tilesRef.current.forEach((tile) => {
      const px = tile.x * cellSize;
      const py = tile.y * cellSize;

      ctx.fillStyle = tile.color;
      ctx.fillRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);

      // Draw custom patterns for visual art complexity
      if (tile.color !== 'rgba(45, 122, 79, 0.08)') {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;

        if (tile.pattern === 'striped') {
          // Draw diagonal line
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + cellSize, py + cellSize);
          ctx.stroke();
        } else if (tile.pattern === 'dotted') {
          // Draw center dot
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          ctx.arc(px + cellSize / 2, py + cellSize / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }, [zoomLevel]);

  // Click handler to select tile
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const cellSize = canvas.width / gridSize;
    const tx = Math.floor(clickX / cellSize);
    const ty = Math.floor(clickY / cellSize);

    const tile = tilesRef.current.find(t => t.x === tx && t.y === ty);
    if (tile && tile.action) {
      setSelectedTile(tile);
    } else {
      setSelectedTile(null);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🧩</span> Global Action Mosaic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-ink-soft">
          Every eco-action logs a beautiful tile on our collective mosaic. As 10,000 tiles connect, a collective animal figure emerges (this week: a Blue Whale). Click on colored tiles to read stories from nearby neighbors.
        </p>

        {/* Mosaic Canvas Box */}
        <div className="flex flex-col items-center">
          <div className="relative border border-forest-action/20 rounded-xl overflow-hidden shadow-lg bg-emerald-950/20 max-w-full">
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              onClick={handleCanvasClick}
              className="w-full max-w-[400px] sm:max-w-[480px] aspect-square block cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-ink-soft mt-2">
            🎨 Current Target: 10,000 tiles (6,428 contributed so far)
          </span>
        </div>

        {/* Selected Tile Card */}
        {selectedTile ? (
          <div className="p-4 rounded-xl border border-forest-action/20 bg-forest-action/5 animate-scale-in space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-ink">Action Tile ({selectedTile.x}, {selectedTile.y})</h4>
                <p className="text-[9px] text-ink-soft font-mono font-bold">📍 Contributor: {selectedTile.author} ({selectedTile.distance} away)</p>
              </div>
              <button 
                onClick={() => setSelectedTile(null)}
                className="text-xs text-ink-soft hover:text-ink cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-ink leading-relaxed italic bg-white/70 p-3 rounded-lg border border-border">
              "I just {selectedTile.action} and added my piece to the whale's flipper!"
            </p>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-border rounded-xl">
            <p className="text-xs text-ink-soft">Click on any colored tile in the whale's silhouette to see who contributed it.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
