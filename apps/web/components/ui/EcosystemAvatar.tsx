'use client';

import React, { useEffect, useRef } from 'react';

interface EcosystemAvatarProps {
  biome: 'temperate-forest' | 'coral-reef' | 'alpine-meadow';
  terraScore: number;
  className?: string;
}

function parseHex(c: string): [number, number, number] {
  let hex = c.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((x) => x + x).join('');
  }
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lerpColor(c1: string, c2: string, t: number) {
  try {
    const [r1, g1, b1] = parseHex(c1);
    const [r2, g2, b2] = parseHex(c2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch (e) {
    return c1;
  }
}

export function EcosystemAvatar({ biome, terraScore, className = '' }: EcosystemAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    // Resizing logic
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight || 280;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Particles system
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      life: number;
      maxLife: number;
    }
    const particles: Particle[] = [];

    const spawnParticle = (x: number, y: number, color: string) => {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -Math.random() * 1.5 - 0.5,
        size: Math.random() * 3 + 1.5,
        alpha: Math.random() * 0.6 + 0.4,
        color,
        life: 0,
        maxLife: Math.random() * 40 + 30,
      });
    };

    // Render loop
    const render = () => {
      t += 0.008;
      const W = canvas.width;
      const H = canvas.height;
      const health = Math.min(Math.max(terraScore / 100, 0), 1);

      ctx.clearRect(0, 0, W, H);

      // Spawn ambient biophilic particles
      if (health > 0.3 && Math.random() < 0.08) {
        const px = Math.random() * W;
        const py = H * 0.6 + Math.random() * (H * 0.4);
        const pColor =
          biome === 'coral-reef'
            ? '#4ecdc4'
            : biome === 'alpine-meadow'
            ? '#ffd700'
            : '#5a9e6f';
        spawnParticle(px, py, pColor);
      }

      // Update and draw particles
      ctx.save();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const lifeRatio = 1 - p.life / p.maxLife;
        if (lifeRatio <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * lifeRatio;
        ctx.fill();
      }
      ctx.restore();

      // Render Biomes
      if (biome === 'temperate-forest') {
        // Sky
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
        const skyTop = lerpColor('#0d2318', '#1a4a2a', health);
        const skyBot = lerpColor('#1a2e22', '#2d6040', health);
        sky.addColorStop(0, skyTop);
        sky.addColorStop(1, skyBot);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // Sun / Moon / Rays
        if (health > 0.6) {
          ctx.fillStyle = `rgba(255, 220, 120, ${(health - 0.6) * 2.5 * 0.3})`;
          ctx.beginPath();
          ctx.arc(W * 0.8, H * 0.2, 25 * health, 0, Math.PI * 2);
          ctx.fill();
        }

        // Ground
        const ground = ctx.createLinearGradient(0, H * 0.6, 0, H);
        ground.addColorStop(0, lerpColor('#1a3020', '#2d5a3d', health));
        ground.addColorStop(1, lerpColor('#0d1a0d', '#1a3020', health));
        ctx.fillStyle = ground;
        ctx.fillRect(0, H * 0.6, W, H * 0.4);

        // River
        const riverAlpha = 0.2 + health * 0.5;
        ctx.fillStyle = `rgba(42, 168, 168, ${riverAlpha})`;
        ctx.beginPath();
        ctx.moveTo(W * 0.3, H);
        ctx.bezierCurveTo(W * 0.35, H * 0.75, W * 0.42 + Math.sin(t) * 8, H * 0.65, W * 0.5, H * 0.62);
        ctx.bezierCurveTo(W * 0.58, H * 0.6, W * 0.65, H * 0.65, W * 0.7, H);
        ctx.fill();

        // Trees
        const trees = [
          { x: 0.15, h: 0.52, s: 0.8 },
          { x: 0.25, h: 0.42, s: 0.95 },
          { x: 0.38, h: 0.48, s: 0.85 },
          { x: 0.65, h: 0.44, s: 1.0 },
          { x: 0.76, h: 0.5, s: 0.9 },
          { x: 0.88, h: 0.38, s: 1.05 },
        ];

        trees.forEach(({ x, h, s }) => {
          const baseX = W * x;
          const baseY = H * 0.65;
          const treeH = H * h * s;
          const sway = Math.sin(t * 0.7 + x * 10) * 3;

          // Trunk
          ctx.fillStyle = lerpColor('#2a1a0a', '#4a3020', health);
          ctx.fillRect(baseX - 4, baseY - treeH * 0.3, 8, treeH * 0.3);

          // Foliage
          const greenBase = lerpColor('#0d2010', '#2d6040', health);
          const greenMid = lerpColor('#0f2812', '#3d7a52', health);
          const greenTop = lerpColor('#112a14', '#5a9e6f', health);

          for (let layer = 3; layer >= 1; layer--) {
            const ly = baseY - treeH * (0.25 + layer * 0.2);
            const lw = ((treeH * 0.5) / layer) * s;
            ctx.fillStyle = layer === 1 ? greenTop : layer === 2 ? greenMid : greenBase;
            ctx.beginPath();
            ctx.moveTo(baseX + sway, ly);
            ctx.lineTo(baseX + lw + sway, ly + treeH * 0.25);
            ctx.lineTo(baseX - lw + sway, ly + treeH * 0.25);
            ctx.closePath();
            ctx.fill();
          }
        });
      } else if (biome === 'coral-reef') {
        // Ocean gradient
        const ocean = ctx.createLinearGradient(0, 0, 0, H);
        ocean.addColorStop(0, lerpColor('#060d18', '#0a1a2e', health));
        ocean.addColorStop(0.5, lerpColor('#0a1520', '#0f2a3a', health));
        ocean.addColorStop(1, lerpColor('#050f10', '#0d2020', health));
        ctx.fillStyle = ocean;
        ctx.fillRect(0, 0, W, H);

        // Light rays
        if (health > 0.4) {
          for (let i = 0; i < 4; i++) {
            const rx = W * (0.15 + i * 0.25);
            const alpha = (health - 0.4) * 0.1 * (0.5 + 0.5 * Math.sin(t + i));
            ctx.fillStyle = `rgba(78, 205, 196, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(rx - 15, 0);
            ctx.lineTo(rx + 15, 0);
            ctx.lineTo(rx + 45 + Math.sin(t * 0.5 + i) * 15, H);
            ctx.lineTo(rx - 45 + Math.sin(t * 0.5 + i) * 15, H);
            ctx.fill();
          }
        }

        // Coral structures
        const corals = [
          { x: 0.1, y: 0.72, type: 'branch', h: 0.22 },
          { x: 0.25, y: 0.78, type: 'fan', h: 0.18 },
          { x: 0.4, y: 0.68, type: 'brain', h: 0.14 },
          { x: 0.55, y: 0.74, type: 'branch', h: 0.25 },
          { x: 0.7, y: 0.76, type: 'fan', h: 0.2 },
          { x: 0.85, y: 0.7, type: 'brain', h: 0.16 },
        ];

        corals.forEach(({ x, y, type, h }) => {
          const cx = W * x;
          const cy = H * y;
          const coralH = H * h;
          const sway = Math.sin(t + x * 8) * 4;

          if (type === 'branch') {
            const col =
              health > 0.5
                ? lerpColor('#3a0a0a', '#ff6b6b', health)
                : lerpColor('#3a3a3a', '#888888', health);
            ctx.strokeStyle = col;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + sway, cy - coralH);
            ctx.stroke();

            // Branches
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
              const by = cy - coralH * (0.25 + i * 0.18);
              const bx = cx + sway * (1 - (cy - by) / coralH);
              const bl = coralH * 0.15;
              ctx.beginPath();
              ctx.moveTo(bx, by);
              ctx.lineTo(bx - bl, by - bl * 0.7);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(bx, by);
              ctx.lineTo(bx + bl, by - bl * 0.7);
              ctx.stroke();
            }
          } else if (type === 'fan') {
            const col =
              health > 0.5
                ? lerpColor('#0a2a1a', '#ffd700', health)
                : lerpColor('#2a2a2a', '#666666', health);
            ctx.fillStyle = col;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.bezierCurveTo(cx - coralH * 0.5 + sway, cy - coralH * 0.7, cx + coralH * 0.5 + sway, cy - coralH * 0.7, cx, cy);
            ctx.fill();
            ctx.globalAlpha = 1;
          } else {
            const col =
              health > 0.5
                ? lerpColor('#1a0a2a', '#9b59b6', health)
                : lerpColor('#2a2a2a', '#666666', health);
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(cx, cy, coralH * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Brain details
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            for (let i = 1; i <= 3; i++) {
              ctx.beginPath();
              ctx.arc(cx, cy, coralH * 0.5 * (i / 4), -Math.PI * 0.3, Math.PI * 1.3);
              ctx.stroke();
            }
          }
        });
      } else {
        // Alpine Meadow
        // Sky
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
        sky.addColorStop(0, lerpColor('#0f1520', '#87ceeb', health));
        sky.addColorStop(1, lerpColor('#1a1f2a', '#b8e4f7', health));
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H * 0.55);

        // Mountains
        ctx.fillStyle = lerpColor('#1a1a2a', '#8fa8c8', health);
        ctx.beginPath();
        ctx.moveTo(0, H * 0.55);
        ctx.lineTo(W * 0.18, H * 0.25);
        ctx.lineTo(W * 0.35, H * 0.45);
        ctx.lineTo(W * 0.55, H * 0.18);
        ctx.lineTo(W * 0.75, H * 0.4);
        ctx.lineTo(W * 0.88, H * 0.25);
        ctx.lineTo(W, H * 0.42);
        ctx.lineTo(W, H * 0.55);
        ctx.fill();

        // Ground
        const ground = ctx.createLinearGradient(0, H * 0.54, 0, H);
        ground.addColorStop(0, lerpColor('#1a2a10', '#4a8a30', health));
        ground.addColorStop(0.6, lerpColor('#0f1a08', '#3a6a22', health));
        ground.addColorStop(1, lerpColor('#0a100a', '#2a4a18', health));
        ctx.fillStyle = ground;
        ctx.fillRect(0, H * 0.54, W, H * 0.46);

        // Flowers
        if (health > 0.3) {
          const flowerCount = Math.floor(health * 25);
          const colors = ['#ff6b9d', '#ffd700', '#ff8c69', '#a0d8ef', '#9b59b6'];

          for (let i = 0; i < flowerCount; i++) {
            const fx = W * (0.05 + ((i * 0.041) % 0.9));
            const fy = H * (0.62 + ((i * 0.057) % 0.3));
            const r = 4 + (i % 3);

            const col = colors[i % colors.length] || '#ff6b9d';
            ctx.fillStyle = col;

            // Draw petals
            for (let j = 0; j < 5; j++) {
              const angle = (j / 5) * Math.PI * 2;
              ctx.beginPath();
              ctx.ellipse(fx + Math.cos(angle) * r, fy + Math.sin(angle) * r, r * 0.6, r * 0.4, angle, 0, Math.PI * 2);
              ctx.fill();
            }

            // Center
            ctx.fillStyle = '#fff176';
            ctx.beginPath();
            ctx.arc(fx, fy, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [biome, terraScore]);

  return (
    <div className={`w-full h-full relative overflow-hidden rounded-2xl ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
