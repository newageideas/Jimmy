import React, { useState, useRef, useEffect } from 'react';

interface BlossomHeroVideoProps {
  onOpenMenu?: () => void;
  onOpenContact?: () => void;
}

export const BlossomHeroVideo: React.FC<BlossomHeroVideoProps> = ({
  onOpenMenu,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Guarantee mobile browser autoplay compliance
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const tryAutoPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setHasError(false);
          })
          .catch((err) => {
            // Browser autoplay restrictions blocked unmuted/automatic playback until interaction
            console.warn('Browser requires user interaction to play:', err);
            setIsPlaying(false);
          });
      }
    };

    tryAutoPlay();
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!isPlaying) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleManualPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.muted = true;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleClickVideo = () => {
    if (onOpenMenu) {
      onOpenMenu();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 9:16 Vertical Video Hero Card (Click to view menu & contact) */}
      <div
        id="blossom-hero-card"
        onClick={handleClickVideo}
        className="group relative w-full max-w-[310px] xs:max-w-[340px] sm:max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden bg-[#0a0f0b] border border-[#ece4d3]/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(201,162,39,0.15)] cursor-pointer transition-all duration-300 hover:border-[#c9a227]/60 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_45px_rgba(201,162,39,0.25)] hover:scale-[1.01]"
        title="Tap to view flower menu and contact us"
      >
        {/* Ambient atmospheric backdrop glow */}
        <div className="absolute -inset-4 bg-radial from-[#254222]/35 via-transparent to-transparent opacity-70 blur-xl pointer-events-none" />

        {/* Blossom Time-Lapse Video (Plays automatically on loop) */}
        {!hasError ? (
          <video
            ref={videoRef}
            src="/blossom.mp4"
            poster="/blossom-poster.jpg"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.warn('Video failed to load / play from /blossom.mp4:', e);
              setHasError(true);
            }}
            className="relative z-10 w-full h-full object-cover"
          >
            <source src="/blossom.mp4" type="video/mp4" />
          </video>
        ) : (
          <img
            src="/blossom-poster.jpg"
            alt="Livingston Blossom"
            className="relative z-10 w-full h-full object-cover"
          />
        )}

        {/* Play indicator if paused by browser */}
        {!isPlaying && !hasError && (
          <div
            onClick={handleManualPlay}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity"
            title="Click to play"
          >
            <div className="w-16 h-16 rounded-full bg-[#25d366] text-[#0b140e] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Top Minimal Badge */}
        <div className="absolute top-3.5 left-3.5 right-3.5 z-30 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0f0b]/80 backdrop-blur-md border border-[#ece4d3]/15 text-[10px] font-mono text-[#ece4d3] tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse" />
            <span>CLONE TO BLOSSOM</span>
          </div>

          {/* Discreet Audio Mute/Unmute toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="pointer-events-auto w-7 h-7 rounded-full bg-[#0a0f0b]/80 backdrop-blur-md border border-[#ece4d3]/20 flex items-center justify-center text-[#ece4d3] hover:text-[#c9a227] hover:border-[#c9a227]/40 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0a7 7 0 0 1-.11 1.23" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </div>

        {/* Bottom Click Cue */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pt-10 bg-gradient-to-t from-[#0a0f0b]/95 via-[#0a0f0b]/70 to-transparent flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-medium text-[#ece4d3] group-hover:text-[#c9a227] transition-colors bg-[#0a0f0b]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#ece4d3]/15 group-hover:border-[#c9a227]/50 shadow-md">
            <span>Tap to explore menu & contact</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="animate-bounce"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
