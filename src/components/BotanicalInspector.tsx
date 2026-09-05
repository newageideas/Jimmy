import React from 'react';
import { GrowthStageInfo, Strain } from '../types';
import { playSoftClick } from '../utils/audio';

interface BotanicalInspectorProps {
  stage: GrowthStageInfo;
  currentStrain: Strain;
  strains: Strain[];
  onSelectStrain: (s: Strain) => void;
  onOpenBreederModal: () => void;
}

export const BotanicalInspector: React.FC<BotanicalInspectorProps> = ({
  stage,
  currentStrain,
  strains,
  onSelectStrain,
  onOpenBreederModal,
}) => {
  return (
    <div id="botanical-inspector-panel" className="bg-[#0f120d]/90 border border-[#e5dfd3]/10 rounded-xl p-5 backdrop-blur-md flex flex-col gap-4 text-left shadow-2xl">
      {/* Phenotype / Strain Selector Header */}
      <div className="flex items-center justify-between border-b border-[#e5dfd3]/10 pb-3">
        <div>
          <span className="text-[9px] font-mono uppercase text-[#c4a484] tracking-[0.3em] block">
            SELECTED CULTIVAR
          </span>
          <h3 className="font-serif italic text-lg text-[#e5dfd3] font-medium leading-tight mt-0.5">
            {currentStrain.name}
          </h3>
        </div>

        {/* AI Breed Cultivar Trigger */}
        <button
          id="ai-breeder-btn"
          type="button"
          onClick={() => {
            playSoftClick();
            onOpenBreederModal();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#c4a484]/40 text-[#c4a484] hover:bg-[#c4a484] hover:text-[#0f120d] transition-all text-xs font-mono tracking-wider"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span>Gemini Breed</span>
        </button>
      </div>

      {/* Strain Switcher Pills */}
      <div className="flex flex-wrap gap-1.5">
        {strains.map((s) => (
          <button
            key={s.id}
            id={`select-strain-${s.id}`}
            type="button"
            onClick={() => {
              playSoftClick();
              onSelectStrain(s);
            }}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              currentStrain.id === s.id
                ? 'bg-[#c4a484] text-[#0f120d] font-semibold border-[#c4a484]'
                : 'bg-[#151b13]/80 text-[#8b9584] border-[#e5dfd3]/10 hover:border-[#c4a484]/40 hover:text-[#e5dfd3]'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Stage Botanical Details */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-mono tracking-[0.2em] text-[#8b9584] uppercase">Current Growth Stage</span>
          <span className="text-xs font-mono text-[#c4a484]">{stage.timeframe}</span>
        </div>
        <h4 className="font-serif italic text-xl text-[#e5dfd3] leading-snug">{stage.title}</h4>
        <p className="text-xs text-[#8b9584] leading-relaxed font-light">{stage.description}</p>
      </div>

      {/* Real-time Cannabinoid & Terpene Synthesis Gauge (Natural Tones Laboratory Specs style) */}
      <div className="bg-[#151b13] p-4 rounded-lg border border-[#e5dfd3]/10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-[#8b9584] tracking-[0.3em] uppercase block">
            LABORATORY SPECS
          </span>
          <span className="text-[9px] font-mono text-[#6f8f5b] uppercase tracking-wider">
            Real-Time Analysis
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="flex flex-col">
            <div className="text-xl font-serif text-[#e5dfd3]">{stage.cannabinoids.cbd}</div>
            <div className="text-[9px] uppercase tracking-wider text-[#c4a484]">CBDA</div>
          </div>
          <div className="flex flex-col">
            <div className="text-xl font-serif text-[#e5dfd3]">{stage.cannabinoids.thc}</div>
            <div className="text-[9px] uppercase tracking-wider text-[#8b9584]">Δ9-THC</div>
          </div>
          <div className="flex flex-col">
            <div className="text-xl font-serif text-[#e5dfd3]">{stage.cannabinoids.terpenes.split(' ')[0]}</div>
            <div className="text-[9px] uppercase tracking-wider text-[#c4a484]">Terpenes</div>
          </div>
        </div>
      </div>

      {/* Botanical Anatomical Highlights */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-mono text-[#8b9584] tracking-[0.3em] uppercase">
          ANATOMICAL MILESTONES
        </span>
        <ul className="flex flex-col gap-1.5">
          {stage.keyFeatures.map((feat, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-[#e5dfd3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6f8f5b] flex-shrink-0" />
              <span className="font-light">{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Terpene Profile Note for Current Cultivar */}
      <div className="pt-2 border-t border-[#e5dfd3]/10 text-[11px] text-[#8b9584] italic font-serif">
        " {currentStrain.aromaNotes} "
      </div>
    </div>
  );
};
