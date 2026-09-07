import React, { useState, useRef, useEffect } from 'react';
import { Strain } from '../types';
import { playSoftClick, playWaterDrop } from '../utils/audio';

interface Nug3DViewerProps {
  strain: Strain;
  onClose: () => void;
  onAskWhatsApp: (strainName: string) => void;
}

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
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotStartRef = useRef({ y: 0, x: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

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

  const nextPhoto = () => {
    playSoftClick();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
    setRotY(0);
    setRotX(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const prevPhoto = () => {
    playSoftClick();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setRotY(0);
    setRotX(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    if (zoom > 1.4) {
      // In deep zoom, dragging pans the view across trichomes
      panStartRef.current = { x: pan.x, y: pan.y };
    } else {
      // In normal view, dragging turns the nug in 3D
      rotStartRef.current = { y: rotY, x: rotX };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (zoom > 1.4) {
      // Pan
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
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

  // Wheel to zoom smoothly
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom((prev) => Math.max(1, Math.min(3.5, prev + delta)));
  };

  // Reset 3D position
  const resetViewer = () => {
    playSoftClick();
    setRotY(0);
    setRotX(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Keyboard navigation (ESC to close, arrow keys to turn)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setRotY((r) => r - 12);
      if (e.key === 'ArrowRight') setRotY((r) => r + 12);
      if (e.key === 'ArrowUp') setRotX((r) => Math.min(35, r + 8));
      if (e.key === 'ArrowDown') setRotX((r) => Math.max(-35, r - 8));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Dynamic light reflection that moves as the nug turns
  const lightReflectionX = ((rotY % 360) / 180) * 45;
  const lightReflectionY = (rotX / 35) * 25;

  // Floor contact drop shadow calculation
  const shadowX = -Math.sin((rotY * Math.PI) / 180) * 25;
  const shadowScaleX = 1 + Math.abs(Math.sin((rotY * Math.PI) / 180)) * 0.2;

  return (
    <div
      id="nug-3d-modal"
      className="fixed inset-0 z-50 bg-[#080a06]/92 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden select-none"
      onClick={onClose}
    >
      {/* Top Header */}
      <div
        id="nug-3d-header"
        className="w-full max-w-4xl flex items-center justify-between z-20 pb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="nug-3d-close-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1c2418] hover:bg-[#2a3322] border border-[#ece4d3]/20 hover:border-[#c9a227] text-[#ece4d3] transition-colors cursor-pointer flex items-center justify-center text-sm"
            aria-label="Close viewer"
          >
            ✕
          </button>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#ece4d3] leading-tight">
              {strain.name}
            </h2>
            <span className="text-xs font-mono text-[#8b9584]">
              Drag to turn · Scroll to zoom
            </span>
          </div>
        </div>

        {/* Minimal Zoom Controls */}
        <div
          id="nug-3d-zoom-controls"
          className="flex items-center gap-1.5 bg-[#141911]/90 px-3 py-1.5 rounded-full border border-[#ece4d3]/15 text-xs font-mono text-[#ece4d3]"
        >
          <button
            type="button"
            id="nug-zoom-out-btn"
            onClick={() => setZoom((z) => Math.max(1, z - 0.3))}
            className="w-6 h-6 flex items-center justify-center text-[#8b9584] hover:text-[#c9a227] cursor-pointer"
            title="Zoom out"
          >
            -
          </button>
          <span className="w-10 text-center text-[11px] text-[#c9a227] font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            id="nug-zoom-in-btn"
            onClick={() => setZoom((z) => Math.min(3.5, z + 0.3))}
            className="w-6 h-6 flex items-center justify-center text-[#8b9584] hover:text-[#c9a227] cursor-pointer"
            title="Zoom in"
          >
            +
          </button>
          {(zoom > 1.05 || rotY !== 0 || rotX !== 0) && (
            <button
              type="button"
              id="nug-reset-btn"
              onClick={resetViewer}
              className="ml-1 text-[10px] text-[#c9a227] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Clean Stage — Pure, seamless studio presentation without clutter */}
      <div
        id="nug-3d-stage"
        className="relative w-full max-w-4xl h-[65vh] sm:h-[70vh] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing bg-[radial-gradient(ellipse_at_50%_45%,#ffffff_0%,#f4f2ec_45%,#ddd9cf_80%,#c2beaf_100%)]"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Soft floor shadow */}
        <div
          className="absolute bottom-8 w-64 h-12 rounded-full pointer-events-none blur-md transition-all duration-100"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(20,25,18,0.4) 0%, rgba(20,25,18,0.15) 50%, transparent 80%)',
            transform: `translateX(${shadowX}px) scale(${shadowScaleX}, 0.6) translateY(${rotX * 0.3}px)`,
          }}
        />

        {/* 3D Perspective Container */}
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
            {/* The High-Resolution Nug Image — blend-multiply ensures zero white box artifact */}
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

      {/* Bottom Bar: Action Button */}
      <div
        id="nug-3d-footer"
        className="w-full max-w-4xl flex items-center justify-end pt-3 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          id="ask-whatsapp-strain-btn"
          onClick={() => {
            playWaterDrop();
            onAskWhatsApp(strain.name);
          }}
          className="px-6 py-2.5 rounded-full text-xs font-mono font-medium bg-[#c9a227] text-[#12160f] hover:bg-[#e0c056] transition-all cursor-pointer shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
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
