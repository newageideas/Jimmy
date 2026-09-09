import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Strain } from '../types';
import { playSoftClick, playWaterDrop } from '../utils/audio';

interface Nug3DViewerProps {
  strain: Strain;
  onClose: () => void;
  onAskWhatsApp: (strainName: string) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 6; // High macro zoom up to 600% for trichome inspection

export const Nug3DViewer: React.FC<Nug3DViewerProps> = ({
  strain,
  onClose,
  onAskWhatsApp,
}) => {
  // 3D rotation angles (horizontal turn & vertical tilt)
  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(0);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Drag interaction state
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Drag references
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotStartRef = useRef({ y: 0, x: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Sync refs for event listeners
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;
  const rotYRef = useRef(rotY);
  rotYRef.current = rotY;
  const rotXRef = useRef(rotX);
  rotXRef.current = rotX;

  // Pinch-to-zoom tracking refs
  const pinchRef = useRef<{
    active: boolean;
    initialDistance: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    midpoint: { x: number; y: number };
  }>({
    active: false,
    initialDistance: 0,
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
    midpoint: { x: 0, y: 0 },
  });

  // Double-tap tracking
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  // Multi-photo support
  const photos = strain.imgs && strain.imgs.length > 0 ? strain.imgs : [strain.img || ''];
  const initialIndex = Math.max(0, photos.indexOf(strain.img || ''));
  const [photoIndex, setPhotoIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const currentImg = photos[photoIndex] || strain.img || '';

  useEffect(() => {
    const idx = photos.indexOf(strain.img || '');
    if (idx >= 0) {
      setPhotoIndex(idx);
    }
  }, [strain.id, strain.img, photos]);

  const resetViewer = useCallback(() => {
    playSoftClick();
    setRotY(0);
    setRotX(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const nextPhoto = () => {
    playSoftClick();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
    resetViewer();
  };

  const prevPhoto = () => {
    playSoftClick();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    resetViewer();
  };

  // Helper to clamp pan bounds depending on current zoom
  const clampPan = (x: number, y: number, currentZoom: number) => {
    if (currentZoom <= 1.05) return { x: 0, y: 0 };
    const maxOffset = 360 * (currentZoom - 1);
    return {
      x: Math.max(-maxOffset, Math.min(maxOffset, x)),
      y: Math.max(-maxOffset, Math.min(maxOffset, y)),
    };
  };

  // Double-tap or double-click to toggle macro inspection zoom
  const handleDoubleTap = useCallback((clientX: number, clientY: number) => {
    if (zoomRef.current > 1.3) {
      // Return to overview
      playSoftClick();
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotX(0);
      setRotY(0);
    } else {
      // Zoom into 2.8x trichome inspection mode centered near tapped area
      playWaterDrop();
      const targetZoom = 2.8;
      setZoom(targetZoom);
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const offsetX = (centerX - clientX) * 0.8;
        const offsetY = (centerY - clientY) * 0.8;
        setPan(clampPan(offsetX, offsetY, targetZoom));
      }
    }
  }, []);

  // Native non-passive Touch Listeners for robust mobile Pinch-to-Zoom
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const calcDistance = (t1: Touch, t2: Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const calcMidpoint = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Start two-finger pinch gesture
        e.preventDefault();
        const dist = calcDistance(e.touches[0], e.touches[1]);
        const mid = calcMidpoint(e.touches[0], e.touches[1]);
        pinchRef.current = {
          active: true,
          initialDistance: dist,
          initialZoom: zoomRef.current,
          initialPan: { ...panRef.current },
          midpoint: mid,
        };
      } else if (e.touches.length === 1) {
        // Detect double-tap
        const touch = e.touches[0];
        const now = Date.now();
        const prev = lastTapRef.current;
        const timeDiff = now - prev.time;
        const distDiff = Math.hypot(touch.clientX - prev.x, touch.clientY - prev.y);

        if (timeDiff < 320 && distDiff < 40) {
          e.preventDefault();
          handleDoubleTap(touch.clientX, touch.clientY);
          lastTapRef.current = { time: 0, x: 0, y: 0 };
        } else {
          lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current.active) {
        e.preventDefault();
        const dist = calcDistance(e.touches[0], e.touches[1]);
        if (pinchRef.current.initialDistance > 0) {
          const scale = dist / pinchRef.current.initialDistance;
          const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchRef.current.initialZoom * scale));
          setZoom(nextZoom);

          // Pan smoothly with finger translation
          const mid = calcMidpoint(e.touches[0], e.touches[1]);
          const dx = mid.x - pinchRef.current.midpoint.x;
          const dy = mid.y - pinchRef.current.midpoint.y;
          setPan(clampPan(pinchRef.current.initialPan.x + dx, pinchRef.current.initialPan.y + dy, nextZoom));
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && pinchRef.current.active) {
        pinchRef.current.active = false;
        // If 1 finger remains, seamlessly re-anchor drag to prevent jump
        if (e.touches.length === 1) {
          const t = e.touches[0];
          dragStartRef.current = { x: t.clientX, y: t.clientY };
          panStartRef.current = { ...panRef.current };
        }
      }
    };

    stageEl.addEventListener('touchstart', onTouchStart, { passive: false });
    stageEl.addEventListener('touchmove', onTouchMove, { passive: false });
    stageEl.addEventListener('touchend', onTouchEnd);
    stageEl.addEventListener('touchcancel', onTouchEnd);

    return () => {
      stageEl.removeEventListener('touchstart', onTouchStart);
      stageEl.removeEventListener('touchmove', onTouchMove);
      stageEl.removeEventListener('touchend', onTouchEnd);
      stageEl.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleDoubleTap]);

  // Pointer drag handlers for single-touch / mouse manipulation
  const handlePointerDown = (e: React.PointerEvent) => {
    // If pinch is currently active via touches, skip pointer down logic
    if (pinchRef.current.active) return;

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    if (zoom > 1.15) {
      // In zoomed trichome inspection mode, single-pointer pans across the flower
      panStartRef.current = { x: pan.x, y: pan.y };
    } else {
      // In 1x mode, drag turns the nug in 3D
      rotStartRef.current = { y: rotY, x: rotX };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || pinchRef.current.active) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (zoom > 1.15) {
      // Smooth Pan across trichomes
      const newX = panStartRef.current.x + dx;
      const newY = panStartRef.current.y + dy;
      setPan(clampPan(newX, newY, zoom));
    } else {
      // Smooth 3D Turn
      const nextY = rotStartRef.current.y + dx * 0.7;
      const nextX = Math.max(-35, Math.min(35, rotStartRef.current.x - dy * 0.4));
      setRotY(nextY);
      setRotX(nextX);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom with cursor centering
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.35 : -0.35;
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    setZoom(nextZoom);
    setPan((p) => clampPan(p.x, p.y, nextZoom));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setRotY((r) => r - 12);
      if (e.key === 'ArrowRight') setRotY((r) => r + 12);
      if (e.key === 'ArrowUp') setRotX((r) => Math.min(35, r + 8));
      if (e.key === 'ArrowDown') setRotX((r) => Math.max(-35, r - 8));
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(MAX_ZOOM, z + 0.4));
      if (e.key === '-' || e.key === '_') setZoom((z) => Math.max(MIN_ZOOM, z - 0.4));
      if (e.key === '0') resetViewer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, resetViewer]);

  // Dynamic light reflection that moves as the nug turns
  const lightReflectionX = ((rotY % 360) / 180) * 45;
  const lightReflectionY = (rotX / 35) * 25;

  // Floor contact drop shadow calculation
  const shadowX = -Math.sin((rotY * Math.PI) / 180) * 25;
  const shadowScaleX = 1 + Math.abs(Math.sin((rotY * Math.PI) / 180)) * 0.2;

  const isMacroView = zoom >= 1.8;

  return (
    <div
      id="nug-3d-modal"
      className="fixed inset-0 z-50 bg-[#080a06]/94 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden select-none"
      onClick={onClose}
    >
      {/* Top Header */}
      <div
        id="nug-3d-header"
        className="w-full max-w-4xl flex items-center justify-between z-20 pb-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="nug-3d-close-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1c2418] hover:bg-[#2a3322] border border-[#ece4d3]/20 hover:border-[#c9a227] text-[#ece4d3] transition-colors cursor-pointer flex items-center justify-center text-sm shadow-md"
            aria-label="Close viewer"
          >
            ✕
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-2xl text-[#ece4d3] leading-tight font-medium">
                {strain.name}
              </h2>
              {isMacroView && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#c9a227]/20 border border-[#c9a227]/60 text-[#e0c056]">
                  🔬 Trichome Macro View
                </span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs font-mono text-[#8b9584]">
              Pinch or double-tap to inspect trichomes · Drag to pan
            </span>
          </div>
        </div>

        {/* Zoom Controls HUD */}
        <div
          id="nug-3d-zoom-controls"
          className="flex items-center gap-1 sm:gap-1.5 bg-[#141911]/95 px-2.5 py-1.5 rounded-full border border-[#ece4d3]/20 text-xs font-mono text-[#ece4d3] shadow-lg"
        >
          {/* Zoom Out */}
          <button
            type="button"
            id="nug-zoom-out-btn"
            onClick={() => {
              playSoftClick();
              setZoom((z) => {
                const next = Math.max(MIN_ZOOM, z - 0.5);
                setPan((p) => clampPan(p.x, p.y, next));
                return next;
              });
            }}
            disabled={zoom <= MIN_ZOOM}
            className="w-7 h-7 flex items-center justify-center text-[#8b9584] hover:text-[#c9a227] disabled:opacity-40 disabled:hover:text-[#8b9584] cursor-pointer text-sm font-bold"
            title="Zoom out"
          >
            -
          </button>

          {/* Zoom % Indicator */}
          <button
            type="button"
            onClick={() => {
              if (zoom > 1.2) resetViewer();
              else {
                playWaterDrop();
                setZoom(3);
              }
            }}
            className="min-w-[48px] text-center text-[11px] text-[#c9a227] font-semibold hover:underline cursor-pointer"
            title="Click to toggle macro zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            id="nug-zoom-in-btn"
            onClick={() => {
              playSoftClick();
              setZoom((z) => Math.min(MAX_ZOOM, z + 0.5));
            }}
            disabled={zoom >= MAX_ZOOM}
            className="w-7 h-7 flex items-center justify-center text-[#8b9584] hover:text-[#c9a227] disabled:opacity-40 disabled:hover:text-[#8b9584] cursor-pointer text-sm font-bold"
            title="Zoom in"
          >
            +
          </button>

          {/* Quick Macro Presets */}
          <div className="hidden sm:flex items-center gap-1 border-l border-[#ece4d3]/15 pl-1.5 ml-0.5">
            <button
              type="button"
              onClick={() => { playSoftClick(); setZoom(1); setPan({ x: 0, y: 0 }); }}
              className={`px-1.5 py-0.5 rounded text-[10px] ${zoom === 1 ? 'bg-[#c9a227] text-[#12160f] font-bold' : 'text-[#8b9584] hover:text-[#ece4d3]'}`}
            >
              1x
            </button>
            <button
              type="button"
              onClick={() => { playWaterDrop(); setZoom(2.8); }}
              className={`px-1.5 py-0.5 rounded text-[10px] ${zoom >= 2.5 && zoom <= 3.2 ? 'bg-[#c9a227] text-[#12160f] font-bold' : 'text-[#8b9584] hover:text-[#ece4d3]'}`}
              title="Trichome Macro (2.8x)"
            >
              3x
            </button>
            <button
              type="button"
              onClick={() => { playWaterDrop(); setZoom(5.5); }}
              className={`px-1.5 py-0.5 rounded text-[10px] ${zoom >= 5 ? 'bg-[#c9a227] text-[#12160f] font-bold' : 'text-[#8b9584] hover:text-[#ece4d3]'}`}
              title="Ultra Macro (5.5x)"
            >
              5x
            </button>
          </div>

          {(zoom > 1.05 || rotY !== 0 || rotX !== 0) && (
            <button
              type="button"
              id="nug-reset-btn"
              onClick={resetViewer}
              className="ml-1 text-[10px] text-[#c9a227] hover:underline cursor-pointer px-1 py-0.5 border border-[#c9a227]/30 rounded bg-[#c9a227]/10"
              title="Reset zoom & rotation"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Stage with Pinch-to-Zoom & Pan Engine */}
      <div
        ref={stageRef}
        id="nug-3d-stage"
        className={`relative w-full max-w-4xl h-[65vh] sm:h-[70vh] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-[radial-gradient(ellipse_at_50%_45%,#ffffff_0%,#f4f2ec_45%,#ddd9cf_80%,#c2beaf_100%)] ${
          zoom > 1.15 ? 'cursor-grab active:cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{ touchAction: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => handleDoubleTap(e.clientX, e.clientY)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Soft contact floor shadow — subtly fades when zoomed in close */}
        <div
          className="absolute bottom-8 w-64 h-12 rounded-full pointer-events-none blur-md transition-opacity duration-200"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(20,25,18,0.4) 0%, rgba(20,25,18,0.15) 50%, transparent 80%)',
            transform: `translateX(${shadowX}px) scale(${shadowScaleX}, 0.6) translateY(${rotX * 0.3}px)`,
            opacity: Math.max(0, 1 - (zoom - 1) * 0.6),
          }}
        />

        {/* 3D / Macro Transform Container */}
        <div
          className="relative w-full h-full flex items-center justify-center pointer-events-none"
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className="relative flex items-center justify-center transition-transform duration-75 ease-out will-change-transform"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* The High-Resolution Nug Image */}
            <img
              key={`${strain.id}-${photoIndex}`}
              src={currentImg}
              alt={`${strain.name} - Photo ${photoIndex + 1}`}
              loading="eager"
              draggable={false}
              className="max-w-[85vw] sm:max-w-[480px] max-h-[52vh] sm:max-h-[58vh] object-contain select-none drop-shadow-[0_25px_40px_rgba(0,0,0,0.45)] filter contrast-[1.05] saturate-[1.05]"
            />

            {/* Subtle trichome crystalline glint that follows 3D angle */}
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl opacity-25 mix-blend-overlay"
              style={{
                background: `radial-gradient(circle at ${50 + lightReflectionX}% ${40 + lightReflectionY}%, rgba(255,255,255,0.8) 0%, rgba(201,162,39,0.2) 40%, transparent 70%)`,
              }}
            />
          </div>
        </div>

        {/* Trichome Macro Floating Cue when zoomed in */}
        {isMacroView && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141911]/90 backdrop-blur-md border border-[#c9a227]/40 text-[#ece4d3] shadow-lg pointer-events-none animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#25d366] animate-ping" />
            <span className="text-[11px] font-mono text-[#c9a227] font-semibold">
              {Math.round(zoom * 100)}% Macro Inspection
            </span>
          </div>
        )}

        {/* Stage Photo Navigation Arrows (when multiple photos exist) */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#141911]/85 border border-[#ece4d3]/30 text-[#ece4d3] hover:bg-[#c9a227] hover:text-[#12160f] hover:border-[#c9a227] transition-all cursor-pointer flex items-center justify-center text-3xl leading-none shadow-xl active:scale-90"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#141911]/85 border border-[#ece4d3]/30 text-[#ece4d3] hover:bg-[#c9a227] hover:text-[#12160f] hover:border-[#c9a227] transition-all cursor-pointer flex items-center justify-center text-3xl leading-none shadow-xl active:scale-90"
            >
              ›
            </button>

            {/* Photo Indicator Dots & Label */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141911]/90 backdrop-blur-md border border-[#ece4d3]/20 shadow-lg">
              <span className="text-[11px] font-mono text-[#c9a227] font-semibold">
                Photo {photoIndex + 1} of {photos.length}
              </span>
              <div className="flex items-center gap-1.5 ml-1">
                {photos.map((_, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIndex(pIdx);
                      resetViewer();
                    }}
                    className={`transition-all rounded-full cursor-pointer ${
                      pIdx === photoIndex
                        ? 'w-4 h-1.5 bg-[#c9a227]'
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/75'
                    }`}
                    aria-label={`View photo ${pIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Bar: Action & Inspection Hint */}
      <div
        id="nug-3d-footer"
        className="w-full max-w-4xl flex items-center justify-between pt-2.5 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[11px] font-mono text-[#8b9584] hidden sm:block">
          Double-tap or pinch anywhere to zoom · Up to 600% resin inspection
        </div>
        <button
          type="button"
          id="ask-whatsapp-strain-btn"
          onClick={() => {
            playWaterDrop();
            onAskWhatsApp(strain.name);
          }}
          className="ml-auto px-6 py-2.5 rounded-full text-xs font-mono font-medium bg-[#c9a227] text-[#12160f] hover:bg-[#e0c056] transition-all cursor-pointer shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
          </svg>
          <span>Inquire on WhatsApp about {strain.name}</span>
        </button>
      </div>
    </div>
  );
};
