'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';

export function PlanetaryMirror() {
  const { userProfile } = useAuth();
  const activeBiome = userProfile?.activeBiome ?? 'temperate-forest';

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      setIsActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Could not access camera. Simulating mirror view instead.');
      setIsActive(true); // Allow simulation
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Canvas drawing loop for biometric biome overlay
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (videoRef.current && stream) {
        // Draw mirror-flipped camera stream
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        // Draw mock mirror face background
        ctx.fillStyle = '#1A3326';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw a simulated face shadow outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 70, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height / 2 + 100, 100, 70, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('(Camera Stream Simulated)', canvas.width / 2, canvas.height / 2 - 10);
      }

      // DRAW BIOME OVERLAYS
      if (activeBiome === 'temperate-forest') {
        // Draw leaves and branches framing the face
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)'; // Emerald shadow tint
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Frame borders with leaves
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // Left curving vine
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.moveTo(10, 10);
        ctx.bezierCurveTo(40, 100, 30, 200, 80, 350);
        ctx.lineTo(60, 350);
        ctx.bezierCurveTo(20, 200, 30, 100, 10, 10);
        ctx.fill();

        // Right curving vine
        ctx.beginPath();
        ctx.moveTo(canvas.width - 10, 10);
        ctx.bezierCurveTo(canvas.width - 40, 100, canvas.width - 30, 200, canvas.width - 80, 350);
        ctx.lineTo(canvas.width - 60, 350);
        ctx.bezierCurveTo(canvas.width - 20, 200, canvas.width - 30, 100, canvas.width - 10, 10);
        ctx.fill();

        // Drawing leaf circles on vines
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(45, 150, 15, 0, Math.PI * 2);
        ctx.arc(canvas.width - 45, 150, 15, 0, Math.PI * 2);
        ctx.arc(60, 280, 20, 0, Math.PI * 2);
        ctx.arc(canvas.width - 60, 280, 20, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeBiome === 'coral-reef') {
        // Underwater ocean light overlay
        ctx.fillStyle = 'rgba(6, 182, 212, 0.2)'; // Cyan overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Coral border
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // Seaweed swaying at the bottom
        ctx.fillStyle = '#0e7490';
        const time = Date.now() * 0.003;
        for (let i = 0; i < 6; i++) {
          const xPos = 40 + i * 80;
          const sway = Math.sin(time + i) * 15;
          ctx.beginPath();
          ctx.moveTo(xPos, canvas.height);
          ctx.bezierCurveTo(xPos - 10, canvas.height - 100, xPos + sway, canvas.height - 180, xPos + sway, canvas.height - 250);
          ctx.lineTo(xPos + 10 + sway, canvas.height - 250);
          ctx.bezierCurveTo(xPos + 10, canvas.height - 100, xPos + 10, canvas.height, xPos, canvas.height);
          ctx.fill();
        }
      } else {
        // Alpine Meadow: mountain sun and flower crowns
        ctx.fillStyle = 'rgba(99, 102, 241, 0.15)'; // Indigo overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // Snowflakes / petals drifting
        ctx.fillStyle = '#ffffff';
        const time = Date.now() * 0.001;
        for (let i = 0; i < 12; i++) {
          const x = (Math.sin(time + i * 2) * 50 + 80 * i) % canvas.width;
          const y = (time * 25 + i * 40) % canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, stream, activeBiome]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🪞</span> Planetary Mirror
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col items-center">
        <p className="text-sm text-ink-soft text-center max-w-sm">
          Pause to reflect. Gaze into the mirror where your features blend with your living digital ecosystem.
        </p>

        {isActive ? (
          <div className="relative w-80 h-80 rounded-2xl overflow-hidden border-2 border-forest-action/30 shadow-inner bg-black">
            {/* Invisible video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
              width={320}
              height={320}
            />
            {/* Overlay drawing canvas */}
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="w-full h-full"
            />
            {/* Mirror reflection prompt overlay */}
            <div className="absolute bottom-6 left-0 right-0 text-center px-4 z-20 pointer-events-none">
              <p className="text-xs text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] italic px-2 py-1 rounded bg-black/40 inline-block font-medium">
                "What do you want the world to see in you?"
              </p>
            </div>
          </div>
        ) : (
          <div className="w-80 h-80 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center bg-forest-deep/5">
            <span className="text-4xl mb-2">🌸</span>
            <p className="text-xs text-ink-soft text-center px-6">Click below to activate the reflection camera.</p>
          </div>
        )}

        {error && (
          <p className="text-[10px] text-sunlight-amber text-center max-w-sm">{error}</p>
        )}

        <div className="flex gap-2">
          {isActive ? (
            <Button variant="outline" size="sm" onClick={stopCamera}>
              Close Mirror
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={startCamera}>
              Look Into Mirror
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
