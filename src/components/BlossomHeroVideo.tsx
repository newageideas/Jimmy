import React, { useRef, useEffect } from 'react';

interface BlossomHeroVideoProps {
    onOpenMenu?: () => void;
    onOpenContact?: () => void;
}

export const BlossomHeroVideo: React.FC<BlossomHeroVideoProps> = ({
    onOpenMenu,
}) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
          const video = videoRef.current;
          if (!video) return;
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          video.setAttribute('muted', '');
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          const tryPlay = () => {
                  video.muted = true;
                  const p = video.play();
                  if (p && typeof p.then === 'function') p.catch(() => {});
          };
          if (video.readyState >= 2) tryPlay();
          else {
                  video.addEventListener('loadeddata', tryPlay, { once: true });
                  video.addEventListener('canplay', tryPlay, { once: true });
          }
          const onGesture = () => {
                  tryPlay();
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

    return (
          <div className="w-full flex flex-col items-center">
                <div
                          id="blossom-hero-card"
                          onClick={() => onOpenMenu?.()}
                          className="group relative w-full max-w-[310px] xs:max-w-[340px] sm:max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden bg-[#0a0f0b] border border-[#ece4d3]/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(201,162,39,0.15)] cursor-pointer transition-all duration-300 hover:border-[#c9a227]/60 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_45px_rgba(201,162,39,0.25)] hover:scale-[1.01]"
                          title="Tap to view flower menu and contact us"
                        >
                        <div className="absolute -inset-4 bg-radial from-[#254222]/35 via-transparent to-transparent opacity-70 blur-xl pointer-events-none" />
                        <video
                                    ref={videoRef}
                                    src="/blossom.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    preload="auto"
                                    className="relative z-10 w-full h-full object-cover pointer-events-none"
                                  />
                        <div className="absolute top-3.5 left-3.5 right-3.5 z-30 flex items-center justify-between pointer-events-none">
                                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0f0b]/80 backdrop-blur-md border border-[#ece4d3]/15 text-[10px] font-mono text-[#ece4d3] tracking-wide">
                                              <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse" />
                                              <span>CLONE TO BLOSSOM</span>span>
                                  </div>div>
                        </div>div>
                        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pt-10 bg-gradient-to-t from-[#0a0f0b]/95 via-[#0a0f0b]/70 to-transparent flex items-center justify-center pointer-events-none">
                                  <div className="flex items-center gap-2 text-xs font-medium text-[#ece4d3] bg-[#0a0f0b]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#ece4d3]/15">
                                              <span>Tap to explore menu & contact</span>span>
                                  </div>div>
                        </div>div>
                </div>div>
          </div>div>
        );
};
</div>
