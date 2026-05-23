import { useEffect, useRef } from 'react';

// ── Config ────────────────────────────────────────────────────────────────────
const GAP         = 36;
const RADIUS_VMIN = 30;
const SPEED_IN    = 0.45;
const SPEED_OUT   = 0.6;
const REST_SCALE  = 0.16;
const MIN_HOVER   = 0.48;
const MAX_HOVER   = 0.92;
const WAVE_SPEED  = 1100;
const WAVE_WIDTH  = 170;

type SolidColor    = { type: 'solid';    value: string };
type GradientColor = { type: 'gradient'; stops: [string, string] };
type ColorDef      = SolidColor | GradientColor;
type ShapeType     = 'circle' | 'bag' | 'star';

function buildThemePalette(): ColorDef[] {
  const s       = getComputedStyle(document.documentElement);
  const primary = s.getPropertyValue('--clr-primary').trim() || '#779c8d';
  const accent  = s.getPropertyValue('--clr-accent').trim()  || '#4e7e6c';
  return [
    { type: 'solid',    value: primary },
    { type: 'solid',    value: primary },
    { type: 'solid',    value: primary },
    { type: 'solid',    value: accent  },
    { type: 'gradient', stops: [primary, accent]  as [string, string] },
    { type: 'gradient', stops: [accent,  primary] as [string, string] },
  ];
}

const SHAPE_TYPES: ShapeType[] = ['circle', 'bag', 'star', 'star'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function rndInt(min: number, max: number) { return Math.floor(rnd(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function smoothstep(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function durationToFactor(seconds: number) {
  if (seconds <= 0) return 1;
  return 1 - Math.pow(0.05, 1 / (60 * seconds));
}

// ── Component ─────────────────────────────────────────────────────────────────
interface HeroCanvasProps { themeKey?: string; }

export function HeroCanvas({ themeKey }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const PALETTE = buildThemePalette();
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas = canvasEl; // narrowed — no null in closure functions
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx; // narrowed — no null in closure functions

    // ── Types ─────────────────────────────────────────────────────────────
    interface Shape {
      x: number; y: number;
      type: ShapeType;
      color: ColorDef;
      angle: number;
      size: number;
      scale: number;
      maxScale: number;
      hovered: boolean;
      points: number;
      innerRatio: number;
    }

    interface Wave { x: number; y: number; startTime: number; }
    interface Grid { shapes: Shape[]; width: number; height: number; }

    // Touch/Mobile: Canvas-Loop zu teuer (250+ Shapes @ 60fps) — skip
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let grid: Grid | null = null;
    let rafId: number;
    let pointer: { x: number; y: number } | null = null;
    let activity = 0;
    let waves: Wave[] = [];
    let maskRects: DOMRect[] = [];
    let maskOverride = false;
    let frameCount = 0;

    // ── Draw helpers ──────────────────────────────────────────────────────
    function drawCircle(size: number) {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawShoppingBag(size: number) {
      const bw  = size * 0.76;
      const bh  = size * 0.52;
      const top = -size * 0.06;
      const hr  = size * 0.155; // handle radius

      // Body
      ctx.beginPath();
      ctx.roundRect(-bw / 2, top, bw, bh, size * 0.09);
      ctx.fill();

      // Left handle — upward D (arc from right→top→left, then closePath seals base)
      ctx.beginPath();
      ctx.arc(-bw * 0.21, top, hr, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();

      // Right handle
      ctx.beginPath();
      ctx.arc(bw * 0.21, top, hr, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
    }

    function drawStar(size: number, points: number, innerRatio: number) {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? size : size * innerRatio;
        i === 0
          ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
          : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
    }

    function drawShape(s: Shape) {
      switch (s.type) {
        case 'circle': drawCircle(s.size / 1.5);                 break;
        case 'bag':    drawShoppingBag(s.size);                   break;
        case 'star':   drawStar(s.size, s.points, s.innerRatio);  break;
      }
    }

    function resolveFill(colorDef: ColorDef, size: number): string | CanvasGradient {
      if (colorDef.type === 'solid') return colorDef.value;
      const grad = ctx.createRadialGradient(0, -size * 0.3, 0, 0, size * 0.3, size * 1.5);
      grad.addColorStop(0, colorDef.stops[0]);
      grad.addColorStop(1, colorDef.stops[1]);
      return grad;
    }

    // ── Grid ──────────────────────────────────────────────────────────────
    function buildGrid(): Grid {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const cols = Math.floor(W / GAP);
      const rows = Math.floor(H / GAP);
      const offsetX = (W - (cols - 1) * GAP) / 2;
      const offsetY = (H - (rows - 1) * GAP) / 2;
      const shapes: Shape[] = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          shapes.push({
            x:          offsetX + col * GAP,
            y:          offsetY + row * GAP,
            type:       pick(SHAPE_TYPES),
            color:      pick(PALETTE),
            angle:      rnd(0, Math.PI * 2),
            size:       GAP * 0.38,
            scale:      REST_SCALE,
            maxScale:   rnd(MIN_HOVER, MAX_HOVER),
            hovered:    false,
            points:     rndInt(4, 10),
            innerRatio: rnd(0.1, 0.5),
          });
        }
      }

      return { shapes, width: W, height: H };
    }

    function init() {
      const W   = window.innerWidth;
      const H   = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      grid = buildGrid();
    }

    // ── Loop ──────────────────────────────────────────────────────────────
    function tick() {
      if (!grid) { rafId = requestAnimationFrame(tick); return; }

      const { shapes, width, height } = grid;
      const radius = Math.min(width, height) * (RADIUS_VMIN / 100);
      const now    = performance.now();

      ctx.clearRect(0, 0, width, height);
      activity *= 0.93;

      frameCount++;
      if (frameCount % 60 === 0) { // Alle 60 Frames (~1s) statt 10 — weniger Layout-Recalcs
        maskRects = Array.from(document.querySelectorAll('[data-shape-mask]'))
          .map(el => el.getBoundingClientRect());
      }

      const maxDist = Math.sqrt(width * width + height * height);
      waves = waves.filter(w => (now - w.startTime) / 1000 * WAVE_SPEED < maxDist + WAVE_WIDTH);

      for (const shape of shapes) {
        const pad    = GAP / 2;
        const masked = !maskOverride && maskRects.some(r =>
          shape.x >= r.left - pad && shape.x <= r.right  + pad &&
          shape.y >= r.top  - pad && shape.y <= r.bottom + pad
        );

        if (masked) {
          shape.scale += (0 - shape.scale) * durationToFactor(SPEED_OUT);
          if (shape.scale < 0.005) shape.scale = 0;
          continue;
        }

        // Pointer influence
        let pointerInfluence = 0;
        if (pointer && activity > 0.001) {
          const dx   = shape.x - pointer.x;
          const dy   = shape.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          pointerInfluence = smoothstep(1 - dist / radius) * activity;

          if (pointerInfluence > 0.05 && !shape.hovered) {
            shape.hovered    = true;
            shape.maxScale   = rnd(MIN_HOVER, MAX_HOVER);
            shape.angle      = rnd(0, Math.PI * 2);
            if (shape.type === 'star') {
              shape.points     = rndInt(4, 10);
              shape.innerRatio = rnd(0.1, 0.5);
            }
          } else if (pointerInfluence <= 0.05) {
            shape.hovered = false;
          }
        } else {
          shape.hovered = false;
        }

        // Wave influence
        let waveInfluence = 0;
        for (const wave of waves) {
          const waveRadius = (now - wave.startTime) / 1000 * WAVE_SPEED;
          const wdx   = shape.x - wave.x;
          const wdy   = shape.y - wave.y;
          const wdist = Math.sqrt(wdx * wdx + wdy * wdy);
          const t     = 1 - Math.abs(wdist - waveRadius) / WAVE_WIDTH;
          if (t > 0) waveInfluence = Math.max(waveInfluence, Math.sin(Math.PI * t));
        }

        const target  = Math.max(
          REST_SCALE + pointerInfluence * (shape.maxScale - REST_SCALE),
          REST_SCALE + waveInfluence    * (shape.maxScale - REST_SCALE),
        );
        const factor  = target > shape.scale ? durationToFactor(SPEED_IN) : durationToFactor(SPEED_OUT);
        shape.scale  += (target - shape.scale) * factor;

        if (shape.scale < REST_SCALE * 0.15) continue;

        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.angle);
        ctx.scale(shape.scale, shape.scale);
        ctx.fillStyle = resolveFill(shape.color, shape.size);
        drawShape(shape);
        ctx.restore();
      }

      rafId = requestAnimationFrame(tick);
    }

    // ── Events ────────────────────────────────────────────────────────────
    function triggerWave(x?: number, y?: number) {
      const wx = x ?? window.innerWidth  / 2;
      const wy = y ?? window.innerHeight / 2;
      waves.push({ x: wx, y: wy, startTime: performance.now() });
      maskOverride = true;
      const delay = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / WAVE_SPEED;
      setTimeout(() => { maskOverride = false; }, delay * 1000);
    }

    function onMove(e: PointerEvent) {
      pointer  = { x: e.clientX, y: e.clientY };
      activity = 1;
    }

    function onClick(e: MouseEvent) {
      triggerWave(e.clientX, e.clientY);
    }

    init();
    rafId = requestAnimationFrame(tick);
    triggerWave(); // entrance wave on load

    window.addEventListener('resize',       init);
    window.addEventListener('pointermove',  onMove);
    window.addEventListener('click',        onClick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize',      init);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('click',       onClick);
    };
  }, [themeKey]);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
