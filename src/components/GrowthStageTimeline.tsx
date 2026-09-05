import React, { useEffect } from 'react';
import { GROWTH_STAGES } from '../utils/strains';
import { GrowthStageInfo, LightingMode } from '../types';
import { playSoftClick, playWaterDrop, playTrichomeChime } from '../utils/audio';
import confetti from 'canvas-confetti';

interface GrowthStageTimelineProps {
  progress: number;
  onProgressChange: (p: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSpeedChange: (spd: number) => void;
  currentStage: GrowthStageInfo;
  lighting: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
}

export const GrowthStageTimeline: React.FC<GrowthStageTimelineProps> = ({
  progress,
  onProgressChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
  currentStage,
  lighting,
  onLightingChange,
}) => {
  // Fire celebratory harvest particles if user reaches 100% cured nug
  useEffect(() => {
    if (progress >= 0.98) {
      playTrichomeChime();
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#c4a484', '#6f8f5b', '#4a5d23', '#e5dfd3'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [progress >= 0.98]);

  const handleStageClick = (stage: GrowthStageInfo) => {
    playSoftClick();
    onProgressChange(stage.progressRange[0] + 0.04);
  };

  return (
    <div id="growth-stage-timeline" className="w-full bg-[#0f120d]/95 border-t border-[#e5dfd3]/10 backdrop-blur-md px-4 py-4 md:px-8 md:py-5">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Top bar: Stage indicators & Quick Jump buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c4a484] animate-pulse" />
            <span className="text-xs font-mono tracking-[0.2em] text-[#c4a484] uppercase font-medium">
              {currentStage.label}
            </span>
            <span className="text-xs text-[#8b9584] font-mono tracking-wider hidden sm:inline">
              — {currentStage.timeframe}
            </span>
          </div>

          {/* Lighting Mode Selector */}
          <div className="flex items-center gap-1.5 bg-[#151b13] p-1 rounded-full border border-[#e5dfd3]/10">
            <span className="text-[10px] font-mono tracking-widest text-[#8b9584] px-2 hidden md:inline">STUDIO LIGHT:</span>
            {[
              { id: 'golden', label: 'Golden Hour' },
              { id: 'daylight', label: 'Daylight' },
              { id: 'grow_led', label: 'Horti LED' },
              { id: 'macro_dark', label: 'Spotlight' },
            ].map((light) => (
              <button
                key={light.id}
                id={`light-btn-${light.id}`}
                type="button"
                onClick={() => {
                  playSoftClick();
                  onLightingChange(light.id as LightingMode);
                }}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-full transition-all duration-200 ${
                  lighting === light.id
                    ? 'bg-[#c4a484] text-[#0f120d] font-semibold shadow-sm'
                    : 'text-[#8b9584] hover:text-[#e5dfd3]'
                }`}
              >
                {light.label}
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Interactive Scrubber Slider with Stage Markers */}
        <div className="relative w-full pt-2 pb-1">
          {/* Background track */}
          <div className="relative h-2 w-full bg-[#151b13] rounded-full overflow-hidden border border-[#e5dfd3]/10">
            {/* Filled progress gradient */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#4a5d23] via-[#6f8f5b] to-[#c4a484] transition-all duration-75"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* Native range slider for smooth touch/drag */}
          <input
            id="growth-scrubber-input"
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={progress}
            onChange={(e) => {
              onProgressChange(parseFloat(e.target.value));
            }}
            className="absolute top-2 left-0 w-full h-2 opacity-0 cursor-ew-resize"
          />

          {/* Stage ticks along track */}
          <div className="relative w-full flex justify-between mt-2 px-1">
            {GROWTH_STAGES.map((st, i) => {
              const isCurrent = progress >= st.progressRange[0] && progress <= st.progressRange[1];
              return (
                <button
                  key={st.key}
                  id={`stage-tick-${st.key}`}
                  type="button"
                  onClick={() => handleStageClick(st)}
                  className="group flex flex-col items-center text-left cursor-pointer transition-all duration-200"
                >
                  <div
                    className={`w-2 h-2 rounded-full mb-1 transition-all ${
                      isCurrent
                        ? 'bg-[#c4a484] ring-4 ring-[#c4a484]/20 scale-125'
                        : progress > st.progressRange[0]
                        ? 'bg-[#6f8f5b]'
                        : 'bg-[#242c1f]'
                    }`}
                  />
                  <span
                    className={`text-[10px] sm:text-[11px] font-mono tracking-tight transition-colors hidden sm:block ${
                      isCurrent ? 'text-[#e5dfd3] font-semibold' : 'text-[#8b9584] group-hover:text-[#e5dfd3]'
                    }`}
                  >
                    {st.key === 'cured_nug' ? 'Ripened Nug' : st.label.split(':')[1]?.trim() || st.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom playback & speed controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-[#e5dfd3]/10">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              id="timeline-play-toggle-btn"
              type="button"
              onClick={() => {
                playWaterDrop();
                onTogglePlay();
              }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#c4a484] text-[#0f120d] font-mono text-xs font-semibold hover:bg-[#d6bca0] transition-all shadow-sm active:scale-95 tracking-wider"
            >
              {isPlaying ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>TIME-LAPSE PLAY</span>
                </>
              )}
            </button>

            {/* Playback speed multiplier */}
            <div className="flex items-center gap-1 bg-[#151b13] px-2 py-1 rounded-full border border-[#e5dfd3]/10 text-[11px] font-mono text-[#8b9584]">
              <span>SPEED:</span>
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  id={`speed-btn-${spd}x`}
                  type="button"
                  onClick={() => {
                    playSoftClick();
                    onSpeedChange(spd);
                  }}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    playbackSpeed === spd ? 'text-[#c4a484] font-bold bg-[#0f120d]' : 'hover:text-[#e5dfd3]'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Percentage & Botanical Milestone */}
          <div className="flex items-center gap-4 text-xs font-mono text-[#8b9584]">
            <span className="bg-[#151b13] px-2.5 py-1 rounded border border-[#e5dfd3]/10">
              CYCLE PROGRESS: <strong className="text-[#e5dfd3]">{(progress * 100).toFixed(0)}%</strong>
            </span>
            <button
              id="jump-harvest-btn"
              type="button"
              onClick={() => {
                playTrichomeChime();
                onProgressChange(1.0);
              }}
              className="text-[#c4a484] hover:underline cursor-pointer flex items-center gap-1 tracking-wider"
            >
              <span>Jump to Cured Nug</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
