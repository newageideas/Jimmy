import React, { useState, useEffect } from 'react';

interface HeroLoadUpScreenProps {
  onComplete: () => void;
}

/**
 * HeroLoadUpScreen
 * Displays purely the uploaded notme 209 image emblem with no words/text,
 * fully responsive for both mobile phone and desktop viewports,
 * and then smoothly transitions into the homepage.
 */
export const HeroLoadUpScreen: React.FC<HeroLoadUpScreenProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Automatically transition to homepage after 2.4 seconds
    const timer = setTimeout(() => {
      triggerEnter();
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  const triggerEnter = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 650);
  };

  return (
    <aside
      id="hero-loadup-screen"
      onClick={triggerEnter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          triggerEnter();
        }
      }}
      aria-label="notme 209 entrance splash"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#07030d] select-none cursor-pointer overflow-hidden transition-all duration-700 ease-out min-h-[100dvh] w-screen ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none blur-sm'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background glow & bokeh orbs behind the image for cinematic depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep violet / purple ambient wash */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl h-[60vh] rounded-full bg-purple-700/20 blur-[120px] animate-pulse" />
        
        {/* Subtle Cyan / Blue bokeh light on top right */}
        <div className="absolute top-[28%] right-[18%] w-36 h-36 rounded-full bg-cyan-400/15 blur-[60px]" />
        
        {/* Deep magenta bokeh on bottom left */}
        <div className="absolute bottom-[28%] left-[18%] w-40 h-40 rounded-full bg-fuchsia-600/15 blur-[70px]" />

        {/* Soft edge vignette framing */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(7,3,13,0.8)_85%,#07030d_100%)]" />
      </div>

      {/* The Uploaded Hero Image Asset — strictly the image, zero extra words */}
      <div className="relative z-10 w-full max-w-[94vw] sm:max-w-[88vw] md:max-w-3xl lg:max-w-5xl px-3 sm:px-6 flex items-center justify-center">
        <div className="relative w-full aspect-[16/9] flex items-center justify-center transition-transform duration-700 ease-out hover:scale-[1.02]">
          <img
            src="/notme209-hero.svg"
            alt="notme 209"
            className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(168,85,247,0.45)] pointer-events-none"
            loading="eager"
            decoding="sync"
          />
        </div>
      </div>
    </aside>
  );
};
