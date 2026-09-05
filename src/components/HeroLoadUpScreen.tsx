import React, { useState, useEffect } from 'react';
import { NotMe209Logo } from './NotMe209Logo';

interface HeroLoadUpScreenProps {
  onComplete: () => void;
}

export const HeroLoadUpScreen: React.FC<HeroLoadUpScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [stage, setStage] = useState<string>('INITIATING NOTME 209');

  useEffect(() => {
    // 2.8-second cinematic sequence
    const stageTimeline = [
      { at: 20, text: 'PREPARING ARTISANAL CULTIVARS' },
      { at: 55, text: 'HARVESTING 209 TERPENES' },
      { at: 85, text: 'WELCOME TO NOTME 209' },
    ];

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2.5;
        const currentStage = stageTimeline.filter((s) => s.at <= next).pop();
        if (currentStage) setStage(currentStage.text);

        if (next >= 100) {
          clearInterval(interval);
          triggerEnter();
          return 100;
        }
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, []);

  const triggerEnter = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 700);
  };

  return (
    <div
      id="hero-loadup-screen"
      onClick={triggerEnter}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 sm:p-10 bg-[#08030f] text-[#ece4d3] select-none cursor-pointer overflow-hidden transition-all duration-700 ease-out ${
        isFadingOut
          ? 'opacity-0 scale-110 pointer-events-none blur-sm'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background bokeh and violet atmospheric lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-700/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-700/25 blur-[120px]" />
        <div className="absolute top-1/2 right-10 w-48 h-48 rounded-full bg-cyan-500/15 blur-[80px]" />
        <div className="absolute bottom-12 left-12 w-64 h-64 rounded-full bg-fuchsia-600/15 blur-[90px]" />

        {/* Soft grid/texture vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,3,15,0.85)_80%,#08030f_100%)]" />
      </div>

      {/* Top Header Note */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between text-xs tracking-widest uppercase font-mono text-[#c084fc]/70 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#c084fc] animate-ping" />
          <span>CALIFORNIA CULTIVATION</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerEnter();
          }}
          className="text-[11px] px-2.5 py-1 rounded border border-purple-500/30 text-[#e9d5ff]/80 hover:text-white hover:border-purple-400/80 transition-colors"
        >
          ENTER NOW →
        </button>
      </div>

      {/* Center: The Iconic NotMe 209 Purple Leaf Emblem */}
      <div className="relative z-10 flex flex-col items-center my-auto text-center">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 transition-transform duration-700 hover:scale-105">
          <NotMe209Logo size="100%" showGlow={true} animate={true} />
        </div>

        {/* Brand Tagline */}
        <div className="mt-4 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans drop-shadow-md">
            notme <span className="text-[#c084fc]">209</span>
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#d8b4fe]/80 tracking-wider uppercase">
            Artisanal Living-Soil Botanical Flower
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress & Tap Cue */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-3 pb-4">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-purple-950/80 rounded-full overflow-hidden border border-purple-800/40 p-[1px]">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-[#c9a227] rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(192,132,252,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Live Loading Message */}
        <div className="flex items-center justify-between w-full text-[11px] font-mono text-[#e9d5ff]/70">
          <span className="truncate">{stage}</span>
          <span className="font-bold text-white pl-2">{Math.round(progress)}%</span>
        </div>

        {/* Tap to enter hint */}
        <div className="mt-1 text-[11px] text-[#c084fc]/70 font-sans tracking-wide animate-pulse">
          Tap anywhere to enter homepage
        </div>
      </div>
    </div>
  );
};
