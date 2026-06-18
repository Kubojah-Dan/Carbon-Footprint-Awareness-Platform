'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface QuestItem {
  id: string;
  title: string;
  location: string;
  icon: string;
  description: string;
  fact: string;
  isCompleted: boolean;
}

const QUESTS: QuestItem[] = [
  { id: '1', title: 'Find a Repair Café', location: 'Within 2 km', icon: '🔧', description: 'Spot a repair shop, tool library, or community fixing workshop. Photograph its entrance to register.', fact: 'Extending the life of electronics and textiles by just one year cuts their manufacturing carbon footprint by 25%!', isCompleted: false },
  { id: '2', title: 'Spot a Solar Installation', location: 'Neighborhood roof', icon: '☀️', description: 'Identify solar PV panels or solar thermal hot water pipes on a residential or public building.', fact: 'A typical home solar installation prevents up to 1.5 tons of carbon dioxide emissions from coal power plants annually.', isCompleted: false },
  { id: '3', title: 'Identify a Native Tree', location: 'Local park / street', icon: '🌳', description: 'Find a native oak, birch, or maple tree. Snap a photo of its leaves to identify.', fact: 'A single mature broadleaf tree absorbs up to 22 kg of CO2e from the atmosphere each year, releasing oxygen in return.', isCompleted: false },
  { id: '4', title: 'Visit a Community Garden', location: 'Urban greenway', icon: '🥕', description: 'Locate an urban food-growing space, compost plot, or vertical green wall.', fact: 'Eating food grown locally in community plots completely eliminates cold storage and long-haul transportation emissions.', isCompleted: false },
];

export function CarbonQuests() {
  const [quests, setQuests] = useState<QuestItem[]>(QUESTS);
  const [activeQuest, setActiveQuest] = useState<QuestItem | null>(null);
  const [isArMode, setIsArMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [arCompleted, setArCompleted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startAR = async (quest: QuestItem) => {
    setActiveQuest(quest);
    setArCompleted(false);
    setIsArMode(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 480, height: 480 },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('AR camera failed', err);
      // Fallback is simulation (rendered on canvas)
    }
  };

  const stopAR = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsArMode(false);
    setActiveQuest(null);
  };

  // Canvas drawing loop for AR Fox
  useEffect(() => {
    if (!isArMode || !canvasRef.current || !activeQuest) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (videoRef.current && cameraStream) {
        // Draw rear camera feed
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Simulated AR landscape background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw a simulated park bench in the scene
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(40, canvas.height - 100, canvas.width - 80, 20); // Bench seat
        ctx.fillRect(80, canvas.height - 80, 10, 80); // Leg Left
        ctx.fillRect(canvas.width - 90, canvas.height - 80, 10, 80); // Leg Right
        
        ctx.fillStyle = '#475569';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('(Real-World environment simulation)', canvas.width / 2, canvas.height - 40);
      }

      // Draw friendly fox character perched on the bench
      const time = Date.now() * 0.003;
      const bounceY = Math.sin(time) * 4;

      const foxX = canvas.width / 2;
      const foxY = canvas.height - 160 + bounceY;

      // Draw Fox body (Orange circle)
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(foxX, foxY, 20, 0, Math.PI * 2);
      ctx.fill();

      // Draw Fox head
      ctx.beginPath();
      ctx.arc(foxX, foxY - 20, 15, 0, Math.PI * 2);
      ctx.fill();

      // Ears (Triangles)
      ctx.beginPath();
      ctx.moveTo(foxX - 12, foxY - 30);
      ctx.lineTo(foxX - 16, foxY - 45);
      ctx.lineTo(foxX - 4, foxY - 32);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(foxX + 12, foxY - 30);
      ctx.lineTo(foxX + 16, foxY - 45);
      ctx.lineTo(foxX + 4, foxY - 32);
      ctx.fill();

      // White cheeks/snout
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(foxX - 6, foxY - 15, 5, 0, Math.PI * 2);
      ctx.arc(foxX + 6, foxY - 15, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a'; // Nose/Eyes
      ctx.beginPath();
      ctx.arc(foxX, foxY - 14, 2.5, 0, Math.PI * 2); // Nose
      ctx.arc(foxX - 6, foxY - 22, 2, 0, Math.PI * 2); // Eye L
      ctx.arc(foxX + 6, foxY - 22, 2, 0, Math.PI * 2); // Eye R
      ctx.fill();

      // Fox Tail (fluffy orange with white tip)
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(foxX - 25, foxY + 10, 10, 16, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(foxX - 35, foxY + 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Dialog box for fox
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      
      const boxW = 220;
      const boxH = 55;
      const boxX = canvas.width / 2 - boxW / 2;
      const boxY = foxY - 110;

      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Arbor the Fox says:', boxX + 8, boxY + 14);
      
      ctx.font = '8px sans-serif';
      // Wrap text helper
      const words = activeQuest.fact.split(' ');
      let line = '';
      let lineY = boxY + 26;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > boxW - 16 && n > 0) {
          ctx.fillText(line, boxX + 8, lineY);
          line = words[n] + ' ';
          lineY += 10;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, boxX + 8, lineY);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isArMode, cameraStream, activeQuest]);

  const captureQuest = () => {
    if (!activeQuest) return;

    setArCompleted(true);
    setQuests(
      quests.map((q) => (q.id === activeQuest.id ? { ...q, isCompleted: true } : q))
    );
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🦊</span> Carbon Quests (AR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-ink-soft">
            Explore your local environment with AR quests. Spot native trees, repair cafes, solar energy grids, and community gardens. Meet Arbor the Fox in AR to learn details and unlock blooms.
          </p>

          {/* Quests Listing */}
          <div className="space-y-3">
            {quests.map((q) => (
              <div 
                key={q.id} 
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors bg-white/40 ${
                  q.isCompleted ? 'border-emerald-500/30' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{q.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                      {q.title} 
                      {q.isCompleted && <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Completed</span>}
                    </h4>
                    <p className="text-[10px] text-ink-soft">{q.location} · {q.description}</p>
                  </div>
                </div>
                {!q.isCompleted ? (
                  <Button variant="primary" size="sm" onClick={() => startAR(q)}>
                    Launch AR
                  </Button>
                ) : (
                  <span className="text-emerald-500 text-base mr-3">✓</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AR Viewport Overlay */}
      {isArMode && activeQuest && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white bg-black select-none">
          {/* Hidden video stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
            width={360}
            height={360}
          />
          {/* Overlaid drawing canvas */}
          <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            <canvas ref={canvasRef} width={360} height={360} className="w-full h-full block" />
            
            {/* HUD interface */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
              <span className="text-[10px] bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 text-white font-mono uppercase font-bold tracking-wider">
                AR Quest: {activeQuest.title}
              </span>
              <button 
                onClick={stopAR}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white border border-white/10 text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {arCompleted && (
              <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-scale-in">
                <span className="text-5xl">🌸</span>
                <h3 className="font-display text-xl font-bold text-emerald-300">Quest Accomplished!</h3>
                <p className="text-xs text-white/90 max-w-xs leading-relaxed">
                  You spotted the target and unlocked a rare **Mountain Bloom** for your digital ecosystem biome!
                </p>
                <Button variant="primary" size="sm" onClick={stopAR}>Return to Hub</Button>
              </div>
            )}

            {/* Camera Capture button */}
            {!arCompleted && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                <button
                  onClick={captureQuest}
                  className="w-16 h-16 rounded-full border-4 border-white bg-red-600/30 flex items-center justify-center hover:bg-red-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
                  aria-label="Capture photograph"
                >
                  <div className="w-10 h-10 rounded-full bg-red-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
