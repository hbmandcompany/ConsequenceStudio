import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  depth: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number];
  driftX: number;
  driftY: number;
  phase: number;
}

function createStars(count: number, width: number, height: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.8 + 0.3,
    brightness: Math.random() * 0.6 + 0.2,
    twinkleSpeed: Math.random() * 0.002 + 0.001,
    twinkleOffset: Math.random() * Math.PI * 2,
    depth: Math.random() * 0.8 + 0.2,
  }));
}

const NEBULAE: Omit<Nebula, "x" | "y">[] = [
  { radius: 320, color: [58, 58, 122], driftX: 0.00008, driftY: 0.00005, phase: 0 },
  { radius: 280, color: [90, 58, 122], driftX: 0.00006, driftY: 0.00009, phase: 1.2 },
  { radius: 240, color: [42, 74, 122], driftX: 0.0001, driftY: 0.00004, phase: 2.4 },
  { radius: 200, color: [74, 58, 90], driftX: 0.00007, driftY: 0.00008, phase: 3.8 },
];

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = createStars(1200, window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener("resize", resize);

    let animationId = 0;
    const startTime = performance.now();

    const draw = (now: number) => {
      const t = (now - startTime) * 0.001;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.45;

      ctx.fillStyle = "#020208";
      ctx.fillRect(0, 0, w, h);

      // Nebula layers
      ctx.globalCompositeOperation = "screen";
      for (const nebula of NEBULAE) {
        const nx = cx + Math.sin(t * nebula.driftX * 1000 + nebula.phase) * w * 0.25;
        const ny = cy + Math.cos(t * nebula.driftY * 1000 + nebula.phase) * h * 0.2;
        const pulse = 0.85 + Math.sin(t * 0.3 + nebula.phase) * 0.15;
        const r = nebula.radius * pulse;

        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, r);
        const [cr, cg, cb] = nebula.color;
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.35)`);
        grad.addColorStop(0.4, `rgba(${cr}, ${cg}, ${cb}, 0.12)`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Galaxy spiral
      ctx.globalCompositeOperation = "lighter";
      const spiralRotation = t * 0.04;
      const armCount = 3;
      const particleCount = 600;

      for (let i = 0; i < particleCount; i++) {
        const arm = i % armCount;
        const progress = i / particleCount;
        const angle = progress * Math.PI * 5 + arm * ((Math.PI * 2) / armCount) + spiralRotation;
        const dist = progress * Math.min(w, h) * 0.38;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist * 0.55;
        const alpha = (1 - progress) * 0.5 + 0.05;
        const size = (1 - progress) * 2.2 + 0.4;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 190, 255, ${alpha})`;
        ctx.fill();
      }

      // Galactic core glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      coreGrad.addColorStop(0.3, "rgba(200, 210, 255, 0.2)");
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      // Star field with parallax drift
      ctx.globalCompositeOperation = "source-over";
      for (const star of starsRef.current) {
        const driftX = Math.sin(t * 0.05 * star.depth + star.twinkleOffset) * 2;
        const driftY = Math.cos(t * 0.04 * star.depth + star.twinkleOffset) * 1.5;
        const twinkle =
          star.brightness * (0.6 + 0.4 * Math.sin(t * star.twinkleSpeed * 1000 + star.twinkleOffset));

        ctx.beginPath();
        ctx.arc(star.x + driftX, star.y + driftY, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.fill();
      }

      frameRef.current++;
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
