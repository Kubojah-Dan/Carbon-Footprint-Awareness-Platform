'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export function CarbonShadows() {
  const [energySaving, setEnergySaving] = useState(50);
  const [bikeCommutes, setBikeCommutes] = useState(40);
  const [offsetFunding, setOffsetFunding] = useState(30);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationFrameId: number;

    const render = () => {
      // 1. Draw a simulated building facade at night (dark brick wall)
      ctx.fillStyle = '#0f1c15'; // Dark forest background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw brick pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const brickH = 15;
      const brickW = 40;
      for (let y = 0; y < canvas.height; y += brickH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
        for (let x = offset; x < canvas.width; x += brickW) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + brickH);
          ctx.stroke();
        }
      }

      // Draw architectural window arches to make it look like a building facade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      for (let i = 0; i < 3; i++) {
        const wx = 50 + i * 110;
        ctx.fillRect(wx, 40, 60, 100);
        ctx.beginPath();
        ctx.arc(wx + 30, 40, 30, Math.PI, 0);
        ctx.fill();
      }

      // 2. Draw Projected Ephemeral Light Art Installation
      // Calculate overall community care strength (0.0 to 1.0)
      const careLevel = (energySaving * 0.4 + bikeCommutes * 0.35 + offsetFunding * 0.25) / 100;
      const time = Date.now() * 0.0015;

      // Draw a flowing river of light across the building wall
      // The light is dim with low emissions/high care, and gets dark with high-emissions.
      // Wait, prompt: "a flowing river of light that dims with high-emission periods, brightens with collective care"
      // So brightness is directly proportional to careLevel!
      const brightness = Math.max(0.1, careLevel);

      // Create glowing river path
      const points: Array<{ x: number; y: number }> = [];
      const segmentCount = 20;
      for (let i = 0; i <= segmentCount; i++) {
        const x = (canvas.width / segmentCount) * i;
        const wave = Math.sin(time + i * 0.4) * 25 + Math.cos(time * 0.5 + i * 0.2) * 15;
        const y = canvas.height - 120 + wave;
        points.push({ x, y });
      }

      // Draw flowing river line (thick glowing base)
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = `rgba(52, 211, 153, ${brightness})`;
      ctx.strokeStyle = `rgba(16, 185, 129, ${brightness * 0.8})`;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0]!.x, points[0]!.y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i]!.x, points[i]!.y);
      }
      ctx.stroke();

      // Draw core light thread
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw particles rising from the river (representing individual neighborhood actions)
      const particleCount = Math.floor(careLevel * 30);
      ctx.fillStyle = `rgba(52, 211, 153, ${brightness * 0.9})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#10b981';
      for (let i = 0; i < particleCount; i++) {
        const px = (Math.sin(time * 0.2 + i * 5) * canvas.width + i * 80) % canvas.width;
        // Rising relative to time
        const py = (canvas.height - 100 - (time * 12 + i * 15) % 180);
        
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1.5, (i % 3) + 1), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // HUD text projection labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`AGGREGATED HIVE CARE INDEX: ${(careLevel * 100).toFixed(0)}%`, canvas.width / 2, canvas.height - 20);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [energySaving, bikeCommutes, offsetFunding]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🔆</span> Carbon Shadows in Public Spaces
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-ink-soft">
          Aggregated community care indices are projected as a light installation on building facades. Adjust variables below to see the projection glow or dim in response to community action.
        </p>

        {/* Projection screen */}
        <div className="flex flex-col items-center">
          <div className="relative border border-forest-action/20 rounded-xl overflow-hidden shadow-2xl max-w-full bg-[#050b07]">
            <canvas ref={canvasRef} width={340} height={240} className="w-full max-w-[340px] block" />
            <div className="absolute top-2 left-2 pointer-events-none">
              <span className="text-[8px] bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded text-white/80 font-mono">
                INSTALLATION SIMULATION
              </span>
            </div>
          </div>
        </div>

        {/* Controllers */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-ink">
              <span>⚡ Household Energy Saving Rate</span>
              <span className="font-mono">{energySaving}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={energySaving}
              onChange={(e) => setEnergySaving(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-forest-action"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-ink">
              <span>🚴 Commute Bicycle Swap Index</span>
              <span className="font-mono">{bikeCommutes}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bikeCommutes}
              onChange={(e) => setBikeCommutes(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-forest-action"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-ink">
              <span>🌲 Reforestation Offset Funding</span>
              <span className="font-mono">{offsetFunding}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={offsetFunding}
              onChange={(e) => setOffsetFunding(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-forest-action"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
