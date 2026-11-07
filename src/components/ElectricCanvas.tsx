import React, { useEffect, useRef } from 'react';
import { playZapSound } from '../utils/audio';

interface ElectricCanvasProps {
  hudRef?: React.RefObject<HTMLDivElement | null>;
}

export const ElectricCanvas: React.FC<ElectricCanvasProps> = ({ hudRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sparks: BurstSpark[] = [];
    let shockwaves: ShockWave[] = [];
    let lightningArcs: ElectricBranch[] = [];
    const PALETTE = ['#c77dff', '#9d4edd', '#ffffff', '#e0aaff', '#7b2cbf'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class BurstSpark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 8 + 3;
        this.vx = Math.cos(a) * s;
        this.vy = Math.sin(a) * s;
        this.size = Math.random() * 3.5 + 1.5;
        this.alpha = 1;
        this.decay = Math.random() * 0.035 + 0.015;
        this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.alpha -= this.decay;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#c77dff';
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class ShockWave {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      speed: number;

      constructor(x: number, y: number, m = 1) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.maxRadius = (60 + Math.random() * 35) * m;
        this.alpha = 1;
        this.speed = 4 * m;
      }

      update() {
        this.radius += this.speed;
        this.alpha = 1 - this.radius / this.maxRadius;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.shadowBlur = 24;
        ctx.shadowColor = '#c77dff';
        ctx.strokeStyle = Math.random() > 0.5 ? '#c77dff' : '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    class ElectricBranch {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      life: number;
      color: string;

      constructor(x: number, y: number, tx: number, ty: number) {
        this.x = x;
        this.y = y;
        this.targetX = tx;
        this.targetY = ty;
        this.life = 1;
        this.color = Math.random() > 0.4 ? '#c77dff' : '#ffffff';
      }

      update() {
        this.life -= 0.12;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.shadowBlur = 26;
        ctx.shadowColor = '#c77dff';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.random() * 2.8 + 1.4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const steps = 9;
        for (let i = 1; i <= steps; i++) {
          const p = i / steps;
          const nx = this.x + (this.targetX - this.x) * p + (Math.random() - 0.5) * 36;
          const ny = this.y + (this.targetY - this.y) * p + (Math.random() - 0.5) * 36;
          ctx.lineTo(nx, ny);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    class AmbientSpark {
      x = 0;
      y = 0;
      size = 0;
      speedX = 0;
      speedY = 0;
      alpha = 0;
      fade = 0;

      constructor() {
        this.reset();
      }

      reset() {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.8 + 1.2;
        this.speedX = (Math.random() - 0.5) * 1.4;
        this.speedY = (Math.random() - 0.5) * 1.4 - 0.4;
        this.alpha = Math.random() * 0.8 + 0.2;
        this.fade = Math.random() * 0.025 + 0.008;
      }

      update() {
        if (!canvas) return;
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha += this.fade;
        if (this.alpha > 0.95 || this.alpha < 0.1) this.fade = -this.fade;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#c77dff';
        ctx.fillStyle = `rgba(199, 125, 255, ${Math.max(0, this.alpha)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const triggerBurst = (x: number, y: number, count = 35) => {
      for (let i = 0; i < count; i++) {
        sparks.push(new BurstSpark(x, y));
      }
      shockwaves.push(new ShockWave(x, y, 1));
      shockwaves.push(new ShockWave(x, y, 1.4));
      for (let j = 0; j < 4; j++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 75 + 45;
        lightningArcs.push(new ElectricBranch(x, y, x + Math.cos(a) * d, y + Math.sin(a) * d));
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // If clicking inside interactive buttons, still trigger lightning but softer
      triggerBurst(e.clientX, e.clientY, 30);
      playZapSound();
    };

    window.addEventListener('pointerdown', handlePointerDown);

    const ambSparks: AmbientSpark[] = [];
    for (let i = 0; i < 65; i++) {
      ambSparks.push(new AmbientSpark());
    }

    let lightningTimer = 0;
    let animFrameId: number;

    const autoBlast = () => {
      lightningTimer++;
      if (lightningTimer % 35 !== 0) return;

      let ox = window.innerWidth / 2;
      let oy = window.innerHeight / 2;

      if (hudRef?.current) {
        const r = hudRef.current.getBoundingClientRect();
        ox = r.left + r.width / 2;
        oy = r.top + r.height / 2;
      }

      for (let k = 0; k < 2; k++) {
        const a = Math.random() * Math.PI * 2;
        const len = Math.random() * 85 + 40;
        const tx = ox + Math.cos(a) * len;
        const ty = oy + Math.sin(a) * len;
        lightningArcs.push(new ElectricBranch(ox, oy, tx, ty));
        triggerBurst(tx, ty, 8);
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ambSparks.forEach((p) => {
        p.update();
        p.draw();
      });

      sparks = sparks.filter((p) => p.alpha > 0.02);
      sparks.forEach((p) => {
        p.update();
        p.draw();
      });

      shockwaves = shockwaves.filter((w) => w.alpha > 0.02);
      shockwaves.forEach((w) => {
        w.update();
        w.draw();
      });

      lightningArcs = lightningArcs.filter((a) => a.life > 0.05);
      lightningArcs.forEach((a) => {
        a.update();
        a.draw();
      });

      autoBlast();
      animFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animFrameId);
    };
  }, [hudRef]);

  return <canvas ref={canvasRef} id="electricCanvas" aria-hidden="true" />;
};
