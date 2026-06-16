'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ScanItem {
  id: string;
  name: string;
  icon: string;
  mirageTitle: string;
  mirageIcon: string;
  mirageColor: string;
  shadowStory: string;
}

const ITEMS: ScanItem[] = [
  { id: '1', name: 'Beef Burger', icon: '🍔', mirageTitle: 'Forest Shadow', mirageIcon: '🪓', mirageColor: 'rgba(239, 68, 68, 0.45)', shadowStory: 'Glowing red roots representing cleared grasslands in the Amazon. A heavy steam of water (400 gallons) trails from the bun, indicating irrigation drains.' },
  { id: '2', name: 'Disposable Plastic Bottle', icon: '🧴', mirageTitle: 'Fossil Oil Shadow', mirageIcon: '🛢️', mirageColor: 'rgba(245, 158, 11, 0.45)', shadowStory: 'A black oily puddle outline surrounding the bottle, showing the raw petroleum drilled to mould the polymers. Smoke spirals upwards from the bottle cap.' },
  { id: '3', name: 'New Denim Jeans', icon: '👖', mirageTitle: 'River Drain Shadow', mirageIcon: '💧', mirageColor: 'rgba(59, 130, 246, 0.45)', shadowStory: 'A glowing blue river fading to grey dry bed (2,000 gallons of water used to wash the indigo cotton). Chemical dye blooms swirling around the legs.' },
];

export function WeightOfThings() {
  const [selectedItem, setSelectedItem] = useState<ScanItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startScan = async (item: ScanItem) => {
    setSelectedItem(item);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 360, height: 360 },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('AR scanner camera failed', err);
    }
  };

  const stopScan = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsScanning(false);
    setSelectedItem(null);
  };

  // Canvas drawing loop for Resource Shadow mirage
  useEffect(() => {
    if (!isScanning || !canvasRef.current || !selectedItem) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (videoRef.current && cameraStream) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Simulated AR background
        ctx.fillStyle = '#0a0f0d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw simulated outline of the scanned item in the center
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(canvas.width / 2 - 40, canvas.height / 2 - 40, 80, 80);
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#475569';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`(Place ${selectedItem.name} in scanner)`, canvas.width / 2, canvas.height / 2 + 60);
      }

      // DRAW THE RESOURCE SHADOW MIRAGE GHOST OVERLAY
      const time = Date.now() * 0.002;
      const pulse = Math.sin(time) * 10 + 20;

      // Draw resource shadow ghost glow ring in center
      ctx.save();
      ctx.shadowBlur = pulse;
      ctx.shadowColor = selectedItem.mirageColor;
      ctx.strokeStyle = selectedItem.mirageColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
      ctx.stroke();

      // Draw smoke / particles rising from item
      ctx.fillStyle = selectedItem.mirageColor;
      ctx.shadowBlur = 4;
      for (let i = 0; i < 8; i++) {
        const xOffset = Math.sin(time + i * 2) * 15;
        const x = canvas.width / 2 + xOffset;
        const y = canvas.height / 2 - 30 - ((time * 25 + i * 25) % 80);
        ctx.beginPath();
        ctx.arc(x, y, 4 - (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Text Overlay Card
      ctx.fillStyle = 'rgba(15, 28, 21, 0.9)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      
      const cardW = 220;
      const cardH = 90;
      const cardX = canvas.width / 2 - cardW / 2;
      const cardY = canvas.height - cardH - 20;

      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeRect(cardX, cardY, cardW, cardH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${selectedItem.mirageIcon} ${selectedItem.mirageTitle}`, cardX + 10, cardY + 18);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '8.5px sans-serif';
      // Wrap description text
      const words = selectedItem.shadowStory.split(' ');
      let line = '';
      let lineY = cardY + 32;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > cardW - 20 && n > 0) {
          ctx.fillText(line, cardX + 10, lineY);
          line = words[n] + ' ';
          lineY += 11;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, cardX + 10, lineY);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, cameraStream, selectedItem]);

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚖️</span> The Weight of Things (AR Shadow)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-ink-soft">
            Point your camera at common products to visualize their environmental "shadow"—cleared forests, heavy water drains, or crude oil puddles—revealing the real weight of objects.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => startScan(item)}
                className="rounded-xl border border-border bg-white/40 p-3 flex flex-col items-center justify-center text-center hover:border-forest-action/45 cursor-pointer transition-colors"
              >
                <span className="text-3xl mb-1.5">{item.icon}</span>
                <span className="text-[10px] font-bold text-ink leading-tight">{item.name}</span>
                <span className="text-[9px] text-forest-action font-semibold mt-2">Scan AR</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AR Scanner Overlay */}
      {isScanning && selectedItem && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white bg-black select-none">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
            width={320}
            height={320}
          />
          <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            <canvas ref={canvasRef} width={320} height={320} className="w-full h-full block" />
            
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
              <span className="text-[10px] bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 text-white font-mono uppercase font-bold tracking-wider">
                AR Shadow: {selectedItem.name}
              </span>
              <button 
                onClick={stopScan}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white border border-white/10 text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
