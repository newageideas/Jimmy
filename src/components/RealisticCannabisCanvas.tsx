import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LightingMode, Strain, GrowthOrigin } from '../types';

interface RealisticCannabisCanvasProps {
  progress: number; // 0 to 1
  strain: Strain;
  lighting: LightingMode;
  onInspectNode?: (partName: string) => void;
  isLoupeActive: boolean;
  onToggleLoupe: () => void;
  windVelocity?: number;
  growthMode?: GrowthOrigin;
  onPlantClick?: () => void;
}

interface TrichomeGlowParticle {
  x: number; // normalized relative to flower center (-1.2 to 1.2)
  y: number; // normalized relative to flower center (-1.2 to 1.2)
  vx: number;
  vy: number;
  baseRadius: number;
  life: number;
  maxLife: number;
  pulsePhase: number;
  pulseSpeed: number;
  colorType: 'diamond' | 'champagne' | 'amber' | 'lilac';
  hasDiffraction: boolean;
  angleOffset: number;
}

export const RealisticCannabisCanvas: React.FC<RealisticCannabisCanvasProps> = ({
  progress,
  strain,
  lighting,
  onInspectNode,
  isLoupeActive,
  onToggleLoupe,
  windVelocity = 0.4,
  growthMode = 'seed' as GrowthOrigin,
  onPlantClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.45 });
  const [ripple, setRipple] = useState<{ x: number; y: number; time: number } | null>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const trichomeParticlesRef = useRef<TrichomeGlowParticle[]>([]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Track mouse coordinates for wind & macro loupe
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setMousePos({ x: nx, y: ny });
    if (isLoupeActive) {
      setLoupePos({ x: nx, y: ny });
    }
  }, [isLoupeActive]);

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      timeRef.current += 0.016;
      const t = timeRef.current;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Lighting configuration
      let lightColor = 'rgba(255, 248, 220, 0.15)';
      let ambientColor = '#11160e';
      let leafBaseTint = '#486838';
      let leafHighTint = '#8eb370';
      let trichomeTint = 'rgba(255, 255, 255, 0.85)';
      let pistilTint = '#e57a26';

      if (lighting === 'golden') {
        lightColor = 'rgba(255, 190, 80, 0.22)';
        ambientColor = '#141810';
        leafHighTint = '#a8c679';
        pistilTint = '#f0892c';
        trichomeTint = 'rgba(255, 245, 210, 0.9)';
      } else if (lighting === 'grow_led') {
        lightColor = 'rgba(220, 140, 255, 0.18)';
        ambientColor = '#131118';
        leafBaseTint = '#3a663e';
        leafHighTint = '#80b875';
        pistilTint = '#f26e2e';
        trichomeTint = 'rgba(240, 220, 255, 0.9)';
      } else if (lighting === 'macro_dark') {
        lightColor = 'rgba(255, 255, 255, 0.28)';
        ambientColor = '#0b0f0a';
        leafBaseTint = '#2a4422';
        leafHighTint = '#6d9555';
        pistilTint = '#d46519';
        trichomeTint = 'rgba(255, 255, 255, 0.95)';
      }

      // Strain phenotype overrides
      if (strain.id === 'sunset-sherbert') {
        leafBaseTint = '#384838';
        leafHighTint = '#7d9e68';
        pistilTint = '#e07624';
      } else if (strain.id === 'northern-lights') {
        leafBaseTint = '#2e4a28';
        leafHighTint = '#6e9858';
        pistilTint = '#c76920';
      } else if (strain.id === 'harlequin') {
        leafBaseTint = '#467535';
        leafHighTint = '#9bc574';
        pistilTint = '#ff8c1a';
      } else if (strain.id === 'sour-space-candy') {
        leafBaseTint = '#354332';
        leafHighTint = '#88a86a';
        pistilTint = '#d95a18';
      }

      // Background vignette gradient
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.55, 40, w * 0.5, h * 0.55, Math.max(w, h) * 0.65);
      bgGrad.addColorStop(0, ambientColor === '#0b0f0a' ? '#141c12' : '#192216');
      bgGrad.addColorStop(0.55, ambientColor);
      bgGrad.addColorStop(1, '#0f120d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Studio light aura
      const studioGlow = ctx.createRadialGradient(w * (0.35 + mousePos.x * 0.3), h * 0.25, 10, w * 0.5, h * 0.4, w * 0.6);
      studioGlow.addColorStop(0, lightColor);
      studioGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = studioGlow;
      ctx.fillRect(0, 0, w, h);

      // Soil mound position
      const groundY = h * 0.82;
      const originX = w * 0.5;

      // Calculate organic wind sway with wind velocity factor
      const windMultiplier = 0.6 + windVelocity * 1.5;
      const windTarget = (mousePos.x - 0.5) * 0.14 * windMultiplier;
      const naturalSway = (Math.sin(t * 1.5) * 0.02 + Math.cos(t * 0.8) * 0.015) * windMultiplier;
      const currentSway = naturalSway + windTarget;

      // Draw living soil layer
      drawLivingSoil(ctx, w, h, groundY, progress);

      // BRANCHING RENDERING BASED ON PROGRESS:
      // When progress >= 0.82, render Stage V: Seedless Cured Flower with full Trichome Glow
      if (progress >= 0.82) {
        // Ripened Cured Nug View with Interactive 3D Depth matching user's photo
        const nugTransition = Math.min(1, 0.78 + ((progress - 0.82) / 0.18) * 0.22);
        drawRipenedCuredNug(
          ctx,
          w,
          h,
          nugTransition,
          t,
          currentSway,
          strain,
          leafBaseTint,
          leafHighTint,
          pistilTint,
          trichomeTint,
          mousePos
        );
      } else {
        // Living Growing Plant Clone Cutting -> Veg -> Bloom -> Cola
        drawPlantGrowth(
          ctx,
          w,
          h,
          groundY,
          originX,
          progress,
          t,
          currentSway,
          leafBaseTint,
          leafHighTint,
          pistilTint,
          trichomeTint,
          mousePos
        );
      }

      // Draw Click Feedback Ripple
      if (ripple) {
        const ageMs = Date.now() - ripple.time;
        if (ageMs < 800) {
          const rProg = ageMs / 800;
          const rRadius = 10 + rProg * 75;
          const rAlpha = (1 - rProg) * 0.75;
          ctx.save();
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, rRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(196, 164, 132, ${rAlpha})`;
          ctx.lineWidth = 2 * (1 - rProg);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, rRadius * 0.5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(111, 143, 91, ${rAlpha * 0.9})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Interactive Jeweler's Loupe if active
      if (isLoupeActive) {
        drawJewelersLoupe(ctx, w, h, loupePos, t, progress, strain, pistilTint);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [progress, strain, lighting, mousePos, isLoupeActive, loupePos, windVelocity, growthMode, ripple]);

  // Helper: Draw Living Organic Soil
  const drawLivingSoil = (ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number, p: number) => {
    // If in close-up cured nug mode, soften soil presence
    const soilAlpha = p > 0.88 ? Math.max(0.05, 1 - (p - 0.88) / 0.08) : 1;
    ctx.save();
    ctx.globalAlpha = soilAlpha;

    // Soil mound curve
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h);
    ctx.quadraticCurveTo(w * 0.25, groundY - 8, w * 0.5, groundY - 14);
    ctx.quadraticCurveTo(w * 0.75, groundY - 8, w * 0.9, h);
    ctx.closePath();

    const soilGrad = ctx.createLinearGradient(0, groundY - 20, 0, h);
    soilGrad.addColorStop(0, '#2e2316');
    soilGrad.addColorStop(0.3, '#1c150c');
    soilGrad.addColorStop(1, '#0e0a06');
    ctx.fillStyle = soilGrad;
    ctx.fill();

    // Soil texture crumbs & compost flakes
    ctx.fillStyle = '#3f3221';
    for (let i = 0; i < 40; i++) {
      const sx = w * 0.2 + (i * 37) % (w * 0.6);
      const sy = groundY - 6 + (Math.sin(i * 9) * 12);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5 + (i % 3) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Light soil rim highlight
    ctx.strokeStyle = 'rgba(236, 228, 211, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  // Helper: Draw Nursery Trimmed Clone Leaf (classic 45-degree angle clipped tips)
  const drawTrimmedCloneLeaf = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    side: number,
    length: number,
    baseColor: string,
    highColor: string
  ) => {
    ctx.save();
    ctx.translate(x, y);

    const baseAngle = side === 1 ? -0.42 : -(Math.PI - 0.42);
    const petioleLen = length * 0.4;
    const px = Math.cos(baseAngle) * petioleLen;
    const py = Math.sin(baseAngle) * petioleLen;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(px * 0.5, py * 0.5 + 3, px, py);
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.translate(px, py);

    // 3 or 5 clone leaflets with clipped ends
    for (let b = -2; b <= 2; b++) {
      const bladeScale = 1 - Math.abs(b) * 0.18;
      const bLen = length * bladeScale;
      const spread = b * 0.28;
      const rot = baseAngle - Math.PI / 2 + spread;

      ctx.save();
      ctx.rotate(rot);

      const w = bLen * 0.24;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(w, bLen * 0.4, w * 0.9, bLen * 0.75);
      // Flat clipped cut across tip (grower clone technique to minimize transpiration)
      ctx.lineTo(-w * 0.9, bLen * 0.75);
      ctx.quadraticCurveTo(-w, bLen * 0.4, 0, 0);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, bLen);
      grad.addColorStop(0, baseColor);
      grad.addColorStop(0.75, highColor);
      ctx.fillStyle = grad;
      ctx.fill();

      // Cut edge highlight (clean scissors line)
      ctx.strokeStyle = 'rgba(236, 228, 211, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.9, bLen * 0.75);
      ctx.lineTo(-w * 0.9, bLen * 0.75);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  };

  // Helper: Draw Rooting Clone Cutting
  const drawCloneCutting = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    groundY: number,
    originX: number,
    p: number,
    t: number,
    sway: number,
    leafBase: string,
    leafHigh: string
  ) => {
    const cloneProgress = p / 0.22;
    ctx.save();
    ctx.translate(originX, groundY);

    // Dynamic gentle wind sway on the clone cutting
    ctx.rotate(sway * 0.3);

    // Submerged cutting stem in living soil
    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.lineTo(0, 22);
    ctx.strokeStyle = '#3e5c2e';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 45-degree angle fresh nursery cut at bottom
    ctx.beginPath();
    ctx.moveTo(-3.5, 18);
    ctx.lineTo(3.5, 26);
    ctx.strokeStyle = '#e6dfce'; // fresh pale vascular cambium
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Callus tissue & Adventitious Root System
    if (cloneProgress > 0.15) {
      const rootP = (cloneProgress - 0.15) / 0.85;
      const numRoots = Math.floor(6 + rootP * 12);

      // Rooting callus nodules
      ctx.fillStyle = '#f8f4e6';
      for (let c = 0; c < 5; c++) {
        const cy = 12 + c * 2.5;
        ctx.beginPath();
        ctx.arc(c % 2 === 0 ? 3 : -3, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Root tendrils expanding into living soil
      for (let r = 0; r < numRoots; r++) {
        const ry = 10 + (r % 5) * 3;
        const side = r % 2 === 0 ? 1 : -1;
        const maxLen = 18 + (r * 9) % 36;
        const curLen = maxLen * rootP;

        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.bezierCurveTo(
          side * 10,
          ry + 4,
          side * (curLen * 0.5),
          ry + 12,
          side * curLen,
          ry + 18
        );
        ctx.strokeStyle = '#faf6ed';
        ctx.lineWidth = Math.max(1.2, 2.5 - rootP * 0.8);
        ctx.lineCap = 'round';
        ctx.stroke();

        // Fine microscopic root hairs for mycorrhizal uptake
        if (curLen > 14) {
          ctx.strokeStyle = 'rgba(250, 246, 237, 0.6)';
          ctx.lineWidth = 0.7;
          for (let rh = 1; rh <= 4; rh++) {
            const hx = side * (6 + rh * 5);
            const hy = ry + 6 + rh * 2.5;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(hx + side * 5, hy + (rh % 2 === 0 ? 4 : -2));
            ctx.stroke();
          }
        }
      }
    }

    // Above-ground stem
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -55);
    ctx.strokeStyle = leafBase;
    ctx.lineWidth = 5.8;
    ctx.stroke();

    // Established clone fan leaves (nursery trimmed tips)
    drawTrimmedCloneLeaf(ctx, 0, -32, -1, 38, leafBase, leafHigh);
    drawTrimmedCloneLeaf(ctx, 0, -32, 1, 38, leafBase, leafHigh);

    // Apical center shoot ready to take off as roots strike
    if (cloneProgress > 0.4) {
      const shootGrowth = (cloneProgress - 0.4) / 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -55);
      ctx.lineTo(0, -55 - shootGrowth * 20);
      ctx.strokeStyle = leafHigh;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Helper: Draw Growth Stages (0 to 0.88)
  const drawPlantGrowth = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    groundY: number,
    originX: number,
    p: number,
    t: number,
    sway: number,
    leafBase: string,
    leafHigh: string,
    pistilColor: string,
    trichomeColor: string,
    mouse: { x: number; y: number }
  ) => {
    ctx.save();

    // ==========================================
    // STAGE 1: CLONE CUTTING IN LIVING SOIL
    // ==========================================
    if (p < 0.22) {
      drawCloneCutting(ctx, w, h, groundY, originX, p, t, sway, leafBase, leafHigh);
      ctx.restore();
      return;
    }

    // ==========================================
    // STAGES 2 - 5: VEGETATIVE & FLOWERING STEM
    // ==========================================
    // Normalize height and plant scale
    const growthScale = Math.min(1, Math.max(0.1, (p - 0.12) / 0.76));
    const maxHeight = h * 0.62;
    const stemHeight = maxHeight * Math.pow(growthScale, 0.85);

    // Stem base coordinates
    const stemBaseX = originX;
    const stemBaseY = groundY - 4;

    // Stem Bezier with dynamic sway
    const tipX = stemBaseX + Math.sin(sway) * stemHeight * 0.4;
    const tipY = stemBaseY - stemHeight;
    const ctrl1X = stemBaseX + Math.sin(sway * 0.4) * stemHeight * 0.15;
    const ctrl1Y = stemBaseY - stemHeight * 0.45;
    const ctrl2X = stemBaseX + Math.sin(sway * 0.8) * stemHeight * 0.3;
    const ctrl2Y = stemBaseY - stemHeight * 0.8;

    // Draw main stalk
    ctx.beginPath();
    ctx.moveTo(stemBaseX, stemBaseY);
    ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, tipX, tipY);

    const stalkGrad = ctx.createLinearGradient(stemBaseX, stemBaseY, tipX, tipY);
    stalkGrad.addColorStop(0, '#3a502e');
    stalkGrad.addColorStop(0.5, leafBase);
    stalkGrad.addColorStop(1, leafHigh);

    ctx.strokeStyle = stalkGrad;
    const baseLineWidth = Math.max(3, 10 * growthScale);
    ctx.lineWidth = baseLineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Stem vertical fibrous ridges
    if (growthScale > 0.4) {
      ctx.beginPath();
      ctx.moveTo(stemBaseX + 1.5, stemBaseY);
      ctx.bezierCurveTo(ctrl1X + 1, ctrl1Y, ctrl2X + 1, ctrl2Y, tipX + 0.5, tipY);
      ctx.strokeStyle = 'rgba(236, 228, 211, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ==========================================
    // LEAF NODES & FOLIAGE (CLONE VEGETATIVE ARCHITECTURE)
    // ==========================================
    // Vegetative Fan Leaves along nodes
    const numNodes = Math.min(6, Math.floor(1 + growthScale * 5.2));

    for (let i = 1; i <= numNodes; i++) {
      const nodeFraction = i / (numNodes + 0.8);
      // Position along bezier curve
      const nodePoint = getBezierPoint(
        { x: stemBaseX, y: stemBaseY },
        { x: ctrl1X, y: ctrl1Y },
        { x: ctrl2X, y: ctrl2Y },
        { x: tipX, y: tipY },
        nodeFraction
      );

      // Number of leaflets per fan leaf expands from 3 -> 5 -> 7 -> 9
      let bladeCount = 3;
      if (i >= 2) bladeCount = 5;
      if (i >= 3 && growthScale > 0.4) bladeCount = 7;
      if (i >= 4 && growthScale > 0.6) bladeCount = 9;

      const leafScale = Math.min(1.2, 0.4 + growthScale * 0.7) * (1 - (i / (numNodes + 2)) * 0.25);
      const nodeSway = sway * (nodeFraction * 1.4);

      // Left fan leaf
      drawCannabisFanLeaf(
        ctx,
        nodePoint.x,
        nodePoint.y,
        -1,
        bladeCount,
        leafScale * 38,
        nodeSway,
        leafBase,
        leafHigh,
        t + i * 0.4
      );

      // Right fan leaf
      drawCannabisFanLeaf(
        ctx,
        nodePoint.x,
        nodePoint.y,
        1,
        bladeCount,
        leafScale * 38,
        nodeSway,
        leafBase,
        leafHigh,
        t + i * 0.4 + 1.2
      );

      // Stipules at node base (small pointy green whiskers)
      if (growthScale > 0.3) {
        ctx.strokeStyle = leafHigh;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(nodePoint.x - 2, nodePoint.y);
        ctx.lineTo(nodePoint.x - 7, nodePoint.y - 8);
        ctx.moveTo(nodePoint.x + 2, nodePoint.y);
        ctx.lineTo(nodePoint.x + 7, nodePoint.y - 8);
        ctx.stroke();
      }

      // Early Bloom calyxes & pistils emerging at node axils (p > 0.52)
      if (p > 0.52) {
        const bloomNodeP = (p - 0.52) / 0.36;
        drawAxillaryFlowerCluster(
          ctx,
          nodePoint.x,
          nodePoint.y,
          bloomNodeP,
          pistilColor,
          leafBase,
          leafHigh,
          trichomeColor,
          t
        );
      }
    }

    // ==========================================
    // STAGES 4 & 5: TERMINAL FLOWERING COLA (p > 0.55)
    // ==========================================
    if (p > 0.55) {
      const flowerP = Math.min(1, (p - 0.55) / 0.33);
      drawTerminalCola(
        ctx,
        tipX,
        tipY,
        flowerP,
        sway,
        t,
        leafBase,
        leafHigh,
        pistilColor,
        trichomeColor,
        growthScale
      );
    }

    ctx.restore();
  };

  // Helper: Draw Smooth Cotyledon Embryonic Leaf
  const drawCotyledon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    side: number,
    size: number,
    sway: number,
    color: string
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(side * (0.8 + sway));

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.6, -size * 0.5, size, 0);
    ctx.quadraticCurveTo(size * 0.6, size * 0.5, 0, 0);

    const grad = ctx.createRadialGradient(size * 0.4, 0, 1, size * 0.5, 0, size * 0.8);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#486834');

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(236,228,211,0.2)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();
  };

  // Helper: Draw Botanically Accurate Palmate Cannabis Fan Leaf
  const drawCannabisFanLeaf = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    side: number,
    bladeCount: number,
    length: number,
    sway: number,
    baseColor: string,
    highColor: string,
    timeOffset: number
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Natural arching petiole (pointing outward and upward)
    const baseAngle = side === 1 ? -0.42 : -(Math.PI - 0.42);
    const dynamicSway = sway * 0.4 + Math.sin(timeOffset) * 0.04;
    const petioleAngle = baseAngle + dynamicSway;
    const petioleLen = length * 0.42;

    const px = Math.cos(petioleAngle) * petioleLen;
    const py = Math.sin(petioleAngle) * petioleLen;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Slight organic droop/dip then ascending toward light
    const midX = px * 0.5;
    const midY = py * 0.5 + 3.5;
    ctx.quadraticCurveTo(midX, midY, px, py);
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = Math.max(1.4, length * 0.045);
    ctx.lineCap = 'round';
    ctx.stroke();

    // Leaflet cluster radiates from petiole tip
    ctx.translate(px, py);

    const halfBlades = Math.floor(bladeCount / 2);
    for (let b = -halfBlades; b <= halfBlades; b++) {
      const bladeIndex = Math.abs(b);
      // Central blade is longest, lateral blades scale down gracefully
      const bladeScale = 1 - bladeIndex * 0.16;
      const bladeLen = length * bladeScale;
      const spreadAngle = b * 0.28 + Math.sin(timeOffset + b * 0.5) * 0.015;
      const leafletAngle = petioleAngle - Math.PI / 2 + spreadAngle;

      ctx.save();
      ctx.rotate(leafletAngle);
      drawSerratedLeaflet(ctx, bladeLen, baseColor, highColor);
      ctx.restore();
    }

    ctx.restore();
  };

  // Helper: Draw Single Serrated Cannabis Leaflet with Veins
  const drawSerratedLeaflet = (
    ctx: CanvasRenderingContext2D,
    len: number,
    baseCol: string,
    highCol: string
  ) => {
    const width = len * 0.22;
    const serrations = Math.floor(len / 4.5);

    ctx.beginPath();
    ctx.moveTo(0, 0);

    // Right side serrated margin
    for (let i = 1; i <= serrations; i++) {
      const t = i / serrations;
      const curveW = Math.sin(t * Math.PI) * width;
      const toothY = len * t;
      const toothNotchX = curveW * 0.75;
      const toothTipX = curveW;
      ctx.lineTo(toothNotchX, toothY - 2);
      ctx.lineTo(toothTipX, toothY);
    }

    // Leaf tip
    ctx.lineTo(0, len);

    // Left side serrated margin
    for (let i = serrations; i >= 1; i--) {
      const t = i / serrations;
      const curveW = -Math.sin(t * Math.PI) * width;
      const toothY = len * t;
      const toothNotchX = curveW * 0.75;
      const toothTipX = curveW;
      ctx.lineTo(toothTipX, toothY);
      ctx.lineTo(toothNotchX, toothY - 2);
    }

    ctx.closePath();

    // Chlorophyll gradient
    const leafGrad = ctx.createLinearGradient(0, 0, 0, len);
    leafGrad.addColorStop(0, baseCol);
    leafGrad.addColorStop(0.7, highCol);
    leafGrad.addColorStop(1, '#a1c278');
    ctx.fillStyle = leafGrad;
    ctx.fill();

    // Central primary midrib vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, len);
    ctx.strokeStyle = 'rgba(236, 228, 211, 0.4)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Secondary lateral veins pointing toward serration tips
    if (len > 24) {
      ctx.strokeStyle = 'rgba(236, 228, 211, 0.2)';
      ctx.lineWidth = 0.5;
      for (let v = 3; v < serrations; v += 2) {
        const vy = (v / serrations) * len;
        const vw = Math.sin((v / serrations) * Math.PI) * width;
        ctx.beginPath();
        ctx.moveTo(0, vy);
        ctx.lineTo(vw * 0.9, vy + 2.5);
        ctx.moveTo(0, vy);
        ctx.lineTo(-vw * 0.9, vy + 2.5);
        ctx.stroke();
      }
    }
  };

  // Helper: Axillary Pre-Flower Cluster
  const drawAxillaryFlowerCluster = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bloomP: number,
    pistilColor: string,
    leafBase: string,
    leafHigh: string,
    trichomeCol: string,
    t: number
  ) => {
    ctx.save();
    ctx.translate(x, y);

    const clusterRadius = 8 + bloomP * 12;

    // Small sugar leaves around node
    for (let sl = 0; sl < 4; sl++) {
      const ang = (sl * Math.PI) / 2 + 0.3;
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(clusterRadius * 0.8, -3, clusterRadius * 1.4, 0);
      ctx.quadraticCurveTo(clusterRadius * 0.8, 3, 0, 0);
      ctx.fillStyle = leafHigh;
      ctx.fill();
      ctx.restore();
    }

    // Calyx bracts
    const calyxCount = Math.floor(4 + bloomP * 6);
    for (let c = 0; c < calyxCount; c++) {
      const cx = (Math.cos(c * 1.3) * clusterRadius * 0.6);
      const cy = (Math.sin(c * 1.3) * clusterRadius * 0.6) - 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 3.5, 5.5, c * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = leafBase;
      ctx.fill();

      // Pair of curly stigmas/pistils
      const pistilAge = bloomP; // 0 = white, 1 = fiery amber
      const curPistilCol = pistilAge > 0.6 ? pistilColor : '#f2eedd';

      ctx.beginPath();
      ctx.moveTo(cx, cy - 3);
      ctx.bezierCurveTo(cx + 6, cy - 10, cx + 8, cy - 14, cx + 12 + Math.sin(t + c) * 2, cy - 12);
      ctx.moveTo(cx, cy - 3);
      ctx.bezierCurveTo(cx - 5, cy - 9, cx - 8, cy - 15, cx - 10 + Math.cos(t + c) * 2, cy - 14);
      ctx.strokeStyle = curPistilCol;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Trichome sparkles
      if (bloomP > 0.4) {
        ctx.fillStyle = trichomeCol;
        ctx.beginPath();
        ctx.arc(cx + 1, cy - 1, 0.7, 0, Math.PI * 2);
        ctx.arc(cx - 1.5, cy + 2, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  // Helper: Terminal Cola Head (Stages 4 & 5)
  const drawTerminalCola = (
    ctx: CanvasRenderingContext2D,
    topX: number,
    topY: number,
    flowerP: number,
    sway: number,
    t: number,
    leafBase: string,
    leafHigh: string,
    pistilColor: string,
    trichomeCol: string,
    growthScale: number
  ) => {
    ctx.save();
    ctx.translate(topX, topY);
    ctx.rotate(sway * 0.8);

    const colaHeight = 45 + flowerP * 75;
    const colaWidth = 24 + flowerP * 34;

    // Background cluster shadow
    ctx.beginPath();
    ctx.ellipse(0, -colaHeight * 0.45, colaWidth * 0.5, colaHeight * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(18, 24, 15, 0.6)';
    ctx.fill();

    // Stacked calyx bracts forming the spear
    const layers = 9;
    for (let layer = 0; layer < layers; layer++) {
      const layerP = layer / layers;
      const layerY = -colaHeight * layerP;
      const layerW = colaWidth * Math.sin(Math.pow(layerP, 0.7) * Math.PI) * 0.85 + 8;
      const calyxInLayer = 5;

      for (let cl = 0; cl < calyxInLayer; cl++) {
        const offsetAng = (cl / calyxInLayer) * Math.PI * 2 + layer * 0.6;
        const cx = Math.cos(offsetAng) * layerW * 0.48;
        const cy = layerY + Math.sin(offsetAng) * 4;

        // Sugar leaves peaking out
        if (cl % 2 === 0) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(offsetAng);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(12, -3, 18 * (1 - layerP * 0.4), 0);
          ctx.quadraticCurveTo(12, 3, 0, 0);
          ctx.fillStyle = leafHigh;
          ctx.fill();
          ctx.restore();
        }

        // Swollen Calyx (Seedless female bract with green core & soft light purple accents)
        ctx.beginPath();
        ctx.ellipse(cx, cy, 4.5, 7, offsetAng * 0.5, 0, Math.PI * 2);
        const calyxGrad = ctx.createRadialGradient(cx - 1, cy - 2, 1, cx, cy, 6);
        calyxGrad.addColorStop(0, leafHigh);
        calyxGrad.addColorStop(0.65, leafBase);
        calyxGrad.addColorStop(0.88, '#ba8ec8'); // Soft light purple / lavender bract margin
        calyxGrad.addColorStop(1, '#261a2b');
        ctx.fillStyle = calyxGrad;
        ctx.fill();

        // Twin Pistils (Stigmas) - transition from white to fiery amber
        const isMaturePistil = flowerP > 0.4;
        const pColor = isMaturePistil ? pistilColor : '#f5f0df';

        ctx.beginPath();
        ctx.moveTo(cx, cy - 2);
        ctx.bezierCurveTo(
          cx + Math.cos(offsetAng) * 8,
          cy - 8,
          cx + Math.cos(offsetAng) * 14,
          cy - 14,
          cx + Math.cos(offsetAng) * 18 + Math.sin(t + cl) * 2,
          cy - 12
        );
        ctx.strokeStyle = pColor;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Trichome heads frost blanket
        if (flowerP > 0.25) {
          ctx.fillStyle = trichomeCol;
          for (let tc = 0; tc < 4; tc++) {
            const rx = cx + (Math.sin(cl * 7 + tc) * 3.5);
            const ry = cy + (Math.cos(cl * 5 + tc) * 5);
            ctx.beginPath();
            ctx.arc(rx, ry, 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();
  };

  // Helper: Draw Ultra-Realistic Cured Ripened CBD Nug matching the user's photo (Stage 5)
  const drawRipenedCuredNug = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    transition: number,
    t: number,
    sway: number,
    strain: Strain,
    leafBase: string,
    leafHigh: string,
    pistilColor: string,
    trichomeCol: string,
    mouse: { x: number; y: number }
  ) => {
    ctx.save();

    // Studio photography backdrop matching the photo: Soft gradient from off-white/light gray top to dark studio floor
    const studioBg = ctx.createLinearGradient(0, 0, 0, h);
    studioBg.addColorStop(0, 'rgba(54, 62, 52, ' + (0.85 * transition) + ')');
    studioBg.addColorStop(0.45, 'rgba(32, 38, 30, ' + (0.95 * transition) + ')');
    studioBg.addColorStop(0.78, 'rgba(16, 20, 15, ' + (0.98 * transition) + ')');
    studioBg.addColorStop(1, 'rgba(11, 14, 10, ' + (1.0 * transition) + ')');
    ctx.fillStyle = studioBg;
    ctx.fillRect(0, 0, w, h);

    // Center the macro cured nug display
    const centerX = w * 0.5;
    const centerY = h * 0.48;
    const nugScale = Math.min(w, h) * 0.31 * (0.88 + transition * 0.12);

    // Dynamic 3D tilt tracking user cursor for depth parallax
    const tiltX = (mouse.x - 0.5) * 16;
    const tiltY = (mouse.y - 0.5) * 12;

    ctx.translate(centerX + tiltX, centerY + tiltY);
    // Subtle gentle organic breathing
    const breath = 1 + Math.sin(t * 1.8) * 0.015;
    ctx.scale(breath, breath);
    ctx.rotate(sway * 0.2);

    // Studio Contact Drop Shadow directly under the nug on the surface (anchoring it in space)
    ctx.save();
    const groundShadowY = nugScale * 0.58;
    // Deep contact core
    const coreShadow = ctx.createRadialGradient(0, groundShadowY, 5, 0, groundShadowY, nugScale * 0.75);
    coreShadow.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    coreShadow.addColorStop(0.5, 'rgba(0, 0, 0, 0.65)');
    coreShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreShadow;
    ctx.beginPath();
    ctx.ellipse(0, groundShadowY, nugScale * 0.82, nugScale * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft diffused penumbra shadow
    const softShadow = ctx.createRadialGradient(0, groundShadowY + 6, nugScale * 0.2, 0, groundShadowY + 6, nugScale * 1.35);
    softShadow.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    softShadow.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
    softShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = softShadow;
    ctx.beginPath();
    ctx.ellipse(0, groundShadowY + 6, nugScale * 1.35, nugScale * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 1. Base Deep Occlusion Silhouette (Dark organic depths between calyxes)
    ctx.beginPath();
    ctx.ellipse(0, 0, nugScale * 0.78, nugScale * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#162013';
    ctx.fill();

    // 2. Swollen Calyx Clusters (Chunky conical architecture identical to user's photo)
    const calyxClusters = [
      // Deep back layer (foundation)
      { x: -nugScale * 0.32, y: -nugScale * 0.15, rx: nugScale * 0.36, ry: nugScale * 0.42, ang: -0.35, depth: 0 },
      { x: nugScale * 0.32, y: -nugScale * 0.12, rx: nugScale * 0.35, ry: nugScale * 0.4, ang: 0.38, depth: 0 },
      { x: -nugScale * 0.2, y: nugScale * 0.38, rx: nugScale * 0.38, ry: nugScale * 0.36, ang: -0.25, depth: 0 },
      { x: nugScale * 0.22, y: nugScale * 0.36, rx: nugScale * 0.36, ry: nugScale * 0.35, ang: 0.3, depth: 0 },
      
      // Middle body lobes
      { x: -nugScale * 0.15, y: -nugScale * 0.42, rx: nugScale * 0.28, ry: nugScale * 0.32, ang: -0.18, depth: 1 },
      { x: nugScale * 0.12, y: -nugScale * 0.46, rx: nugScale * 0.26, ry: nugScale * 0.3, ang: 0.15, depth: 1 },
      { x: -nugScale * 0.4, y: nugScale * 0.1, rx: nugScale * 0.28, ry: nugScale * 0.32, ang: -0.55, depth: 1 },
      { x: nugScale * 0.38, y: nugScale * 0.12, rx: nugScale * 0.29, ry: nugScale * 0.33, ang: 0.5, depth: 1 },
      { x: 0, y: nugScale * 0.46, rx: nugScale * 0.32, ry: nugScale * 0.28, ang: 0, depth: 1 },
      
      // Conical crown apex
      { x: -nugScale * 0.04, y: -nugScale * 0.62, rx: nugScale * 0.22, ry: nugScale * 0.25, ang: -0.08, depth: 2 },
      { x: nugScale * 0.05, y: -nugScale * 0.72, rx: nugScale * 0.18, ry: nugScale * 0.22, ang: 0.05, depth: 2 },
      { x: 0, y: -nugScale * 0.82, rx: nugScale * 0.13, ry: nugScale * 0.17, ang: 0, depth: 3 },
      
      // Foreground center calyx mounds (moss/olive with soft purple margins)
      { x: -nugScale * 0.18, y: -nugScale * 0.12, rx: nugScale * 0.3, ry: nugScale * 0.34, ang: -0.2, depth: 3 },
      { x: nugScale * 0.16, y: -nugScale * 0.08, rx: nugScale * 0.31, ry: nugScale * 0.33, ang: 0.22, depth: 3 },
      { x: -nugScale * 0.1, y: nugScale * 0.16, rx: nugScale * 0.28, ry: nugScale * 0.3, ang: -0.1, depth: 3 },
      { x: nugScale * 0.18, y: nugScale * 0.18, rx: nugScale * 0.29, ry: nugScale * 0.31, ang: 0.28, depth: 3 },
    ];

    // Draw individual swollen calyxes
    calyxClusters.forEach((c) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.ang);

      // Organic calyx egg shape
      ctx.beginPath();
      ctx.ellipse(0, 0, c.rx, c.ry, 0, 0, Math.PI * 2);

      // Calyx gradient matching photo: Moss green core, deep olive body, soft lavender/purple anthocyanin rim
      const calyxGrad = ctx.createRadialGradient(-c.rx * 0.3, -c.ry * 0.3, c.rx * 0.08, 0, 0, c.ry);
      calyxGrad.addColorStop(0, '#86a86c'); // Soft moss light highlight
      calyxGrad.addColorStop(0.3, '#547545'); // Botanical moss green
      calyxGrad.addColorStop(0.65, '#39532d'); // Deep forest olive green
      calyxGrad.addColorStop(0.86, '#9f8aa9'); // Soft light purple / lavender bract margin (as in photo)
      calyxGrad.addColorStop(1, '#2c1e30'); // Deep violet shadow edge

      ctx.fillStyle = calyxGrad;
      ctx.fill();

      // Soft light purple anthocyanin blush on the outer ridge
      ctx.beginPath();
      ctx.arc(c.rx * 0.25, -c.ry * 0.15, c.rx * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(190, 162, 205, 0.35)';
      ctx.fill();

      // Trimmed sugar leaf tips hugging the calyx
      ctx.beginPath();
      ctx.moveTo(-c.rx * 0.45, -c.ry * 0.25);
      ctx.lineTo(0, -c.ry * 1.15);
      ctx.lineTo(c.rx * 0.45, -c.ry * 0.25);
      ctx.closePath();
      const sugarGrad = ctx.createLinearGradient(0, -c.ry * 0.25, 0, -c.ry * 1.15);
      sugarGrad.addColorStop(0, '#365028');
      sugarGrad.addColorStop(0.55, '#5e7d4d');
      sugarGrad.addColorStop(1, '#b59dc0'); // light purple frosted tip
      ctx.fillStyle = sugarGrad;
      ctx.fill();

      ctx.restore();
    });

    // 3. THE SIGNATURE TRIANGULAR SUGAR LEAF (Prominently featured in user's photo at center front)
    // Directly replicates the downward-pointing triangular sugar leaf with dusty purple-lavender hue & frosted central vein
    ctx.save();
    const sigX = -nugScale * 0.03;
    const sigY = nugScale * 0.12;
    const sigW = nugScale * 0.25;
    const sigH = nugScale * 0.36;

    ctx.translate(sigX, sigY);
    ctx.rotate(0.24); // Angled downward to the right, exactly matching the photo

    // Drop shadow under this prominent foreground leaf
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(sigW * 0.5, sigH);
    ctx.lineTo(-sigW * 0.5, sigH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 20, 12, 0.7)';
    ctx.fill();

    // Leaf Blade Body: Dusky slate-lavender / light purple with frosty tone
    ctx.beginPath();
    ctx.moveTo(0, sigH * 1.05); // Downward tip
    ctx.quadraticCurveTo(sigW * 0.65, sigH * 0.45, sigW * 0.5, 0); // Right edge
    ctx.lineTo(-sigW * 0.5, 0); // Top base
    ctx.quadraticCurveTo(-sigW * 0.65, sigH * 0.45, 0, sigH * 1.05); // Left edge
    ctx.closePath();

    const leafGrad = ctx.createLinearGradient(0, 0, 0, sigH);
    leafGrad.addColorStop(0, '#534757'); // Dark slate purple base
    leafGrad.addColorStop(0.4, '#7c6d83'); // Muted lavender
    leafGrad.addColorStop(0.75, '#9988a2'); // Dusty light purple
    leafGrad.addColorStop(1, '#c0aec9'); // Frosty lavender tip
    ctx.fillStyle = leafGrad;
    ctx.fill();

    // Prominent frosted central vein down the spine of the leaf (as seen in photo)
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, sigH * 0.98);
    ctx.strokeStyle = 'rgba(240, 236, 245, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Micro frosted serration ridges along the triangular leaf
    ctx.strokeStyle = 'rgba(250, 245, 255, 0.65)';
    ctx.lineWidth = 0.8;
    for (let sv = 1; sv <= 6; sv++) {
      const vy = sv * (sigH * 0.13);
      ctx.beginPath();
      ctx.moveTo(0, vy);
      ctx.lineTo(sigW * 0.35, vy - 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, vy);
      ctx.lineTo(-sigW * 0.35, vy - 4);
      ctx.stroke();
    }
    ctx.restore();

    // 4. ENTANGLED CURLY GOLDEN-AMBER PISTILS (Nestled in valleys between calyx mounds)
    const pistilPaths = [
      { start: [-nugScale * 0.28, -nugScale * 0.35], cp1: [-nugScale * 0.15, -nugScale * 0.48], cp2: [-nugScale * 0.05, -nugScale * 0.38], end: [nugScale * 0.1, -nugScale * 0.42] },
      { start: [-nugScale * 0.38, -nugScale * 0.05], cp1: [-nugScale * 0.25, -nugScale * 0.15], cp2: [-nugScale * 0.15, nugScale * 0.05], end: [-nugScale * 0.08, nugScale * 0.02] },
      { start: [nugScale * 0.18, -nugScale * 0.3], cp1: [nugScale * 0.28, -nugScale * 0.2], cp2: [nugScale * 0.32, -nugScale * 0.05], end: [nugScale * 0.22, nugScale * 0.05] },
      { start: [-nugScale * 0.22, nugScale * 0.2], cp1: [-nugScale * 0.32, nugScale * 0.3], cp2: [-nugScale * 0.15, nugScale * 0.42], end: [-nugScale * 0.02, nugScale * 0.35] },
      { start: [nugScale * 0.25, nugScale * 0.12], cp1: [nugScale * 0.15, nugScale * 0.28], cp2: [nugScale * 0.28, nugScale * 0.4], end: [nugScale * 0.12, nugScale * 0.48] },
      { start: [nugScale * 0.02, -nugScale * 0.65], cp1: [nugScale * 0.14, -nugScale * 0.58], cp2: [-nugScale * 0.02, -nugScale * 0.48], end: [-nugScale * 0.12, -nugScale * 0.4] },
      { start: [-nugScale * 0.15, nugScale * 0.38], cp1: [-nugScale * 0.08, nugScale * 0.45], cp2: [nugScale * 0.05, nugScale * 0.42], end: [nugScale * 0.15, nugScale * 0.46] },
      { start: [nugScale * 0.08, -nugScale * 0.18], cp1: [nugScale * 0.2, -nugScale * 0.1], cp2: [nugScale * 0.15, nugScale * 0.05], end: [nugScale * 0.05, nugScale * 0.08] },
    ];

    pistilPaths.forEach((pp) => {
      ctx.beginPath();
      ctx.moveTo(pp.start[0], pp.start[1]);
      ctx.bezierCurveTo(pp.cp1[0], pp.cp1[1], pp.cp2[0], pp.cp2[1], pp.end[0], pp.end[1]);

      // Deep golden-amber core
      ctx.strokeStyle = '#c57822';
      ctx.lineWidth = Math.max(1.8, nugScale * 0.016);
      ctx.lineCap = 'round';
      ctx.stroke();

      // Bright fiery apricot highlight
      ctx.strokeStyle = '#f5b045';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    });

    // 5. BLANKET OF SPARKLING CRYSTALLINE TRICHOME FROST (Massive density matching photo)
    // First: Microscopic crystalline stippling across the body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let st = 0; st < 380; st++) {
      const phiS = st * 2.399963;
      const radS = Math.sqrt(st / 380) * nugScale * 0.86;
      const stX = Math.cos(phiS) * radS;
      const stY = Math.sin(phiS) * radS * 1.15;
      ctx.beginPath();
      ctx.arc(stX, stY, 0.6 + (st % 3) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Second: 320+ Capitate-Stalked Glandular Trichomes radiating from contours
    const trichomeCount = 320;
    for (let i = 0; i < trichomeCount; i++) {
      const phi = i * 1.61803398875; // Golden ratio
      const rad = Math.sqrt(i / trichomeCount) * nugScale * 0.88;
      const tx = Math.cos(phi) * rad;
      const ty = Math.sin(phi) * rad * 1.18;

      const stalkLen = 2.8 + (i % 5) * 1.1;
      const stalkAngle = Math.atan2(ty, tx);

      const headX = tx + Math.cos(stalkAngle) * stalkLen;
      const headY = ty + Math.sin(stalkAngle) * stalkLen;

      // Translucent glandular stalk
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(headX, headY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Glandular resin head
      const isAmber = i % 7 === 0;
      const headRadius = 1.2 + (i % 3) * 0.65;

      ctx.beginPath();
      ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);

      if (isAmber) {
        ctx.fillStyle = '#e8a838'; // Peak ripened amber CBD head
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; // Crystalline milky head
      }
      ctx.fill();

      // Specular glint on resin sphere
      const glint = Math.sin(t * 3.5 + i) * 0.4 + 0.6;
      ctx.beginPath();
      ctx.arc(headX - headRadius * 0.35, headY - headRadius * 0.35, headRadius * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * glint})`;
      ctx.fill();

      // Final stage trichome head micro-luminescence
      if (transition > 0.15 && i % 5 === 0) {
        const resinPulse = (Math.sin(t * 2.8 + i * 0.9) * 0.5 + 0.5) * transition;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = isAmber
          ? `rgba(255, 185, 80, ${0.22 * resinPulse})`
          : `rgba(255, 250, 230, ${0.28 * resinPulse})`;
        ctx.fill();
      }
    }

    // SUBTLE 'TRICHOME GLOW' PARTICLE SYSTEM (Final Stage of Growth Cycle)
    // Enhances high-end macro feel with organic floating crystalline dust, champagne-diamond halos, and micro-diffraction flares
    drawTrichomeGlowSystem(ctx, nugScale, t, transition, mouse, strain);

    ctx.restore();
  };

  // Helper: Draw Subtle 'Trichome Glow' Particle Effect for the final stage of the growth cycle
  const drawTrichomeGlowSystem = (
    ctx: CanvasRenderingContext2D,
    scale: number,
    t: number,
    intensity: number,
    mouse: { x: number; y: number },
    strain: Strain
  ) => {
    if (intensity <= 0.01) return;

    // Initialize persistent particle pool if empty
    if (trichomeParticlesRef.current.length === 0) {
      const parts: TrichomeGlowParticle[] = [];
      const particleCount = 65;
      const colorPool: Array<'diamond' | 'champagne' | 'amber' | 'lilac'> = [
        'diamond', 'champagne', 'diamond', 'amber', 'champagne', 'lilac',
      ];
      for (let i = 0; i < particleCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 0.12 + Math.random() * 0.72;
        parts.push({
          x: Math.cos(ang) * rad * 0.75,
          y: (Math.sin(ang) * rad - 0.1) * 0.88,
          vx: (Math.random() - 0.5) * 0.0012,
          vy: -0.001 - Math.random() * 0.0022, // Upward buoyant lift
          baseRadius: 0.8 + Math.random() * 1.5,
          life: Math.random() * 120,
          maxLife: 100 + Math.random() * 140,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 1.6 + Math.random() * 2.2,
          colorType: colorPool[i % colorPool.length],
          hasDiffraction: i % 3 === 0,
          angleOffset: Math.random() * Math.PI * 2,
        });
      }
      trichomeParticlesRef.current = parts;
    }

    ctx.save();

    // 1. Soft Volumetric Atmospheric Trichome Haze / Macro Aureole
    const auraPulse = 0.06 + Math.sin(t * 1.6) * 0.018;
    const auraRadius = scale * 1.32;
    const auraGrad = ctx.createRadialGradient(0, -scale * 0.12, scale * 0.15, 0, -scale * 0.08, auraRadius);
    auraGrad.addColorStop(0, `rgba(255, 248, 225, ${auraPulse * intensity * 1.3})`);
    auraGrad.addColorStop(0.35, `rgba(238, 225, 185, ${auraPulse * intensity * 0.75})`);
    auraGrad.addColorStop(0.7, `rgba(185, 175, 205, ${auraPulse * intensity * 0.28})`);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -scale * 0.08, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Interactive Physics Update & Rendering for 65+ Crystalline Trichome Particles
    const particles = trichomeParticlesRef.current;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Update life
      p.life += 1;
      if (p.life >= p.maxLife) {
        // Respawn near the calyx surface
        const ang = Math.random() * Math.PI * 2;
        const rad = 0.16 + Math.random() * 0.58;
        p.x = Math.cos(ang) * rad * 0.72;
        p.y = (Math.sin(ang) * rad + 0.06) * 0.82;
        p.vx = (Math.random() - 0.5) * 0.0012;
        p.vy = -0.001 - Math.random() * 0.0022;
        p.life = 0;
        p.maxLife = 90 + Math.random() * 130;
      }

      // Gentle organic Brownian oscillation and mouse parallax reaction
      p.vx += Math.sin(t * 2 + p.angleOffset) * 0.00006;
      const mouseParallax = (mouse.x - 0.5) * 0.0003;
      p.x += p.vx + mouseParallax;
      p.y += p.vy;

      // Calculate smooth breathing alpha envelope
      const progressRatio = p.life / p.maxLife;
      const envelope = progressRatio < 0.2 ? progressRatio / 0.2 : progressRatio > 0.78 ? (1 - progressRatio) / 0.22 : 1.0;
      const shimmer = 0.55 + 0.45 * Math.sin(t * p.pulseSpeed + p.pulsePhase);
      const alpha = Math.max(0, Math.min(1, envelope * shimmer * intensity));

      if (alpha <= 0.01) continue;

      const px = p.x * scale;
      const py = p.y * scale;
      const haloRadius = p.baseRadius * 5.2;

      // Soft diffuse glow aureole
      const aureole = ctx.createRadialGradient(px, py, 0, px, py, haloRadius);
      if (p.colorType === 'champagne') {
        aureole.addColorStop(0, `rgba(255, 242, 205, ${0.48 * alpha})`);
        aureole.addColorStop(0.45, `rgba(235, 215, 155, ${0.2 * alpha})`);
      } else if (p.colorType === 'amber') {
        aureole.addColorStop(0, `rgba(255, 190, 85, ${0.44 * alpha})`);
        aureole.addColorStop(0.45, `rgba(225, 145, 55, ${0.16 * alpha})`);
      } else if (p.colorType === 'lilac') {
        aureole.addColorStop(0, `rgba(225, 200, 248, ${0.42 * alpha})`);
        aureole.addColorStop(0.45, `rgba(185, 150, 220, ${0.15 * alpha})`);
      } else {
        // diamond crystal
        aureole.addColorStop(0, `rgba(255, 255, 255, ${0.52 * alpha})`);
        aureole.addColorStop(0.45, `rgba(220, 240, 255, ${0.22 * alpha})`);
      }
      aureole.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = aureole;
      ctx.beginPath();
      ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
      ctx.fill();

      // Crystalline bead core
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, p.baseRadius * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // 4-point diamond cross diffraction spike for high-end luxury macro glint
      if (p.hasDiffraction && alpha > 0.28) {
        const flareLen = p.baseRadius * (3.0 + Math.sin(t * 3.2 + p.pulsePhase) * 1.2);
        ctx.strokeStyle = `rgba(255, 252, 238, ${0.6 * alpha})`;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(px - flareLen, py);
        ctx.lineTo(px + flareLen, py);
        ctx.moveTo(px, py - flareLen);
        ctx.lineTo(px, py + flareLen);
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // Helper: Draw 60x Magnification Jeweler's Loupe Mode
  const drawJewelersLoupe = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    loupePos: { x: number; y: number },
    t: number,
    p: number,
    strain: Strain,
    pistilColor: string
  ) => {
    ctx.save();
    const lx = loupePos.x * w;
    const ly = loupePos.y * h;
    const loupeRadius = Math.min(w, h) * 0.17;

    // Loupe Brass / Brushed Metal Bezel
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, loupeRadius + 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 24;
    ctx.fill();

    // Outer brass rim
    const brassGrad = ctx.createLinearGradient(lx - loupeRadius, ly - loupeRadius, lx + loupeRadius, ly + loupeRadius);
    brassGrad.addColorStop(0, '#d4af37');
    brassGrad.addColorStop(0.4, '#8a6e1a');
    brassGrad.addColorStop(0.7, '#f3e5ab');
    brassGrad.addColorStop(1, '#57420f');
    ctx.strokeStyle = brassGrad;
    ctx.lineWidth = 10;
    ctx.stroke();

    // Inner optical bezel
    ctx.beginPath();
    ctx.arc(lx, ly, loupeRadius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#1a1f14';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Clip to circular loupe aperture
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, loupeRadius, 0, Math.PI * 2);
    ctx.clip();

    // High-magnification 60x cellular background
    ctx.fillStyle = '#1c2817';
    ctx.fillRect(lx - loupeRadius, ly - loupeRadius, loupeRadius * 2, loupeRadius * 2);

    // Deep cellular epidermal texture
    ctx.strokeStyle = 'rgba(111, 143, 91, 0.25)';
    ctx.lineWidth = 1;
    for (let cx = -loupeRadius; cx <= loupeRadius; cx += 16) {
      ctx.beginPath();
      ctx.moveTo(lx + cx, ly - loupeRadius);
      ctx.lineTo(lx + cx + Math.sin(cx) * 6, ly + loupeRadius);
      ctx.stroke();
    }

    // High-magnification pistil filament weaving across lens
    ctx.beginPath();
    ctx.moveTo(lx - loupeRadius * 0.7, ly + loupeRadius * 0.5);
    ctx.bezierCurveTo(lx - loupeRadius * 0.2, ly - loupeRadius * 0.3, lx + loupeRadius * 0.2, ly + loupeRadius * 0.2, lx + loupeRadius * 0.8, ly - loupeRadius * 0.4);
    ctx.strokeStyle = pistilColor;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Pistil stigmatic papillae texture
    ctx.strokeStyle = '#f8ab4f';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 60x Magnified Capitate-Stalked Trichomes (Mushroom-shaped resin glands)
    const macroTrichomes = [
      { x: -50, y: -40, height: 42, headR: 11, amber: false },
      { x: -20, y: -65, height: 48, headR: 12.5, amber: true },
      { x: 25, y: -45, height: 45, headR: 11.5, amber: false },
      { x: 55, y: -20, height: 38, headR: 10, amber: false },
      { x: -45, y: 15, height: 44, headR: 12, amber: true },
      { x: -10, y: -10, height: 52, headR: 13, amber: false },
      { x: 30, y: 18, height: 46, headR: 12, amber: false },
      { x: 60, y: 45, height: 40, headR: 10.5, amber: true },
      { x: -25, y: 55, height: 43, headR: 11.5, amber: false },
      { x: 10, y: 65, height: 47, headR: 12.5, amber: false },
    ];

    macroTrichomes.forEach((mt, idx) => {
      const tx = lx + mt.x;
      const ty = ly + mt.y;

      // Stalk (multi-cellular column with translucent core)
      ctx.beginPath();
      ctx.moveTo(tx, ty + mt.height);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = 'rgba(236, 228, 211, 0.75)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner stalk canal
      ctx.strokeStyle = 'rgba(160, 200, 130, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Capitate Resin Head (Spherical gland filled with CBD & terpene oils)
      ctx.beginPath();
      ctx.arc(tx, ty, mt.headR, 0, Math.PI * 2);

      const headGrad = ctx.createRadialGradient(tx - mt.headR * 0.35, ty - mt.headR * 0.35, 1, tx, ty, mt.headR);
      if (mt.amber) {
        headGrad.addColorStop(0, '#ffe599');
        headGrad.addColorStop(0.5, '#d89b28');
        headGrad.addColorStop(1, '#825007');
      } else {
        headGrad.addColorStop(0, '#ffffff');
        headGrad.addColorStop(0.65, '#e4ecd8');
        headGrad.addColorStop(1, '#8da87c');
      }
      ctx.fillStyle = headGrad;
      ctx.fill();

      // Glassy specular glare on spherical lens head
      ctx.beginPath();
      ctx.arc(tx - mt.headR * 0.4, ty - mt.headR * 0.4, mt.headR * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    });

    // Optical lens reflection & HUD reticle
    const lensGlow = ctx.createRadialGradient(lx - loupeRadius * 0.4, ly - loupeRadius * 0.4, 10, lx, ly, loupeRadius);
    lensGlow.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    lensGlow.addColorStop(0.7, 'rgba(255, 255, 255, 0.03)');
    lensGlow.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = lensGlow;
    ctx.fillRect(lx - loupeRadius, ly - loupeRadius, loupeRadius * 2, loupeRadius * 2);

    // Micro-scale reticle lines
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx - 20, ly);
    ctx.lineTo(lx + 20, ly);
    ctx.moveTo(lx, ly - 20);
    ctx.lineTo(lx, ly + 20);
    ctx.stroke();

    // 60x Magnification Badge inside lens
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#c9a227';
    ctx.textAlign = 'center';
    ctx.fillText('60× MACRO LOUPE', lx, ly + loupeRadius - 16);
    ctx.font = '500 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ece4d3';
    ctx.fillText('TRICHOME RESIN HEADS', lx, ly + loupeRadius - 5);

    ctx.restore();
    ctx.restore();
  };

  // Mathematical Bezier Point interpolation
  function getBezierPoint(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
  ): { x: number; y: number } {
    const cx = 3 * (p1.x - p0.x);
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = p3.x - p0.x - cx - bx;

    const cy = 3 * (p1.y - p0.y);
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = p3.y - p0.y - cy - by;

    const xt = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
    const yt = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

    return { x: xt, y: yt };
  }

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('#toggle-loupe-btn')) {
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      setRipple({ x: clickX, y: clickY, time: Date.now() });
    }
    onPlantClick?.();
  };

  return (
    <div
      ref={containerRef}
      id="growth-canvas-container"
      className="relative w-full h-full cursor-pointer overflow-hidden select-none"
      onClick={handleContainerClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
