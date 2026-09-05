import React, { useState, useRef, useEffect } from 'react';

interface BlossomHeroVideoProps {
  onOpenMenu?: () => void;
  onOpenContact?: () => void;
}

export const BlossomHeroVideo: React.FC<BlossomHeroVideoProps> = ({
  onOpenMenu,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
          window.removeEventListener('touchstart', onGesture);
          window.removeEventListener('click', onGesture);
  };
      window.addEventListener('touchstart', onGesture, { once: true });
      window.addEventListener('click', onGesture, { once: true });
      return () => {
              window.removeEventListener('touchstart', onGesture);
              window.removeEventListener('click', onGesture);
      };
}, []);

  const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        const next = !videoRef.current.muted;
        videoRef.current.muted = next;
        setIsMuted(next);
        if (!isPlaying) videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const handleManualPlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
        } else {
                videoRef.current.muted = true;
                setIsMuted(true);
                videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
  };

  return (
        <div className="w-full flex flex-col items-center">
              <div
                        id="blossom-hero-card"
                        onClick={() => onOpenMenu?.()}
                        className="group relative w-full max-w-[</div>
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    const tryPlay = () => {
      video.muted = true;
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };
    if (video.readyState >= 2) tryPlay();
    else {
      video.addEventListener('loadeddata', tryPlay, { once: true });
      video.addEventListener('canplay', tryPlay, { once: true });
    }
    const onGesture = () => {
