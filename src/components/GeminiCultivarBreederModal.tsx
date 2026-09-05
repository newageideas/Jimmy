import React, { useState } from 'react';
import { Strain } from '../types';
import { playWaterDrop, playTrichomeChime, playSoftClick } from '../utils/audio';

interface GeminiCultivarBreederModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCultivarBred: (newStrain: Strain, simulateImmediately: boolean) => void;
}

export const GeminiCultivarBreederModal: React.FC<GeminiCultivarBreederModalProps> = ({
  isOpen,
  onClose,
  onCultivarBred,
}) => {
  const [desiredEffect, setDesiredEffect] = useState('Deep evening somatic calm without cognitive fog');
  const [aromaNotes, setAromaNotes] = useState('Sweet pine needles, damp loam, and candied Meyer lemon peel');
  const [energyLevel, setEnergyLevel] = useState('Twilight / Nighttime');
  const [customNotes, setCustomNotes] = useState('Living organic soil in 209 Central Valley, CA with high myrcene');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedStrain, setGeneratedStrain] = useState<Strain | null>(null);

  if (!isOpen) return null;

  const handleBreed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedStrain(null);
    playWaterDrop();

    try {
      const res = await fetch('/api/gemini/breed-strain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desiredEffect,
          aromaNotes,
          energyLevel,
          customNotes,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const newStrain: Strain = {
          id: `gemini-breed-${Date.now()}`,
          name: d.name || 'notme 209 Solstice Reserve',
          tag: d.tag || 'Artisanal Hybrid · High CBD · <0.2% THC',
          desc: d.desc || 'Organically cultivated in 209 living soil with full terpene profile.',
          cbdPercent: d.cbdPercent || 18.8,
          thcPercent: d.thcPercent || 0.16,
          terpenes: d.terpenes || [
            { name: 'Myrcene', percentage: 1.1, note: 'Earthy calm' },
            { name: 'Caryophyllene', percentage: 0.6, note: 'Spicy ease' },
          ],
          aromaNotes: d.aromaNotes || aromaNotes,
          phenotypeAppearance: d.phenotypeAppearance || 'Dense frosty calyxes with amber trichome blanket.',
          floweringWeeks: d.growthCharacteristics?.floweringWeeks || 8.5,
          isCustom: true,
        };

        setGeneratedStrain(newStrain);
        playTrichomeChime();
      }
    } catch (err) {
      console.error('Breeder error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        id="gemini-breeder-modal"
        className="bg-[#0f120d] border border-[#e5dfd3]/15 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 text-left shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          id="close-breeder-modal-btn"
          type="button"
          onClick={() => {
            playSoftClick();
            onClose();
          }}
          className="absolute top-5 right-5 text-[#8b9584] hover:text-[#e5dfd3] p-1.5 rounded-full border border-transparent hover:border-[#e5dfd3]/20 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#c4a484] tracking-[0.3em] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#c4a484] animate-pulse" />
            <span>GEMINI 3.8 FLASH · ARTISANAL CULTIVAR BREEDER</span>
          </div>
          <h2 className="font-serif italic text-2xl md:text-3xl text-[#e5dfd3]">
            Breed a Custom CBD Cultivar
          </h2>
          <p className="text-xs md:text-sm text-[#8b9584] mt-1.5 leading-relaxed font-light">
            Specify your desired bodily feeling, aromatics, and terroir. Gemini models realistic cannabis genetics, terpene chemistry, and growth cycles to formulate an authentic strain for your garden.
          </p>
        </div>

        {!generatedStrain ? (
          <form onSubmit={handleBreed} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[#e5dfd3] uppercase mb-1.5">
                DESIRED BODILY FEELING & EFFECT
              </label>
              <input
                id="breed-effect-input"
                type="text"
                value={desiredEffect}
                onChange={(e) => setDesiredEffect(e.target.value)}
                required
                className="w-full bg-[#151b13] border border-[#e5dfd3]/15 rounded-lg px-3.5 py-2.5 text-sm text-[#e5dfd3] focus:outline-none focus:border-[#c4a484]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#e5dfd3] uppercase mb-1.5">
                  AROMATICS & TERPENE PREFERENCES
                </label>
                <input
                  id="breed-aroma-input"
                  type="text"
                  value={aromaNotes}
                  onChange={(e) => setAromaNotes(e.target.value)}
                  className="w-full bg-[#151b13] border border-[#e5dfd3]/15 rounded-lg px-3.5 py-2.5 text-sm text-[#e5dfd3] focus:outline-none focus:border-[#c4a484]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#e5dfd3] uppercase mb-1.5">
                  TIME OF DAY / RITUAL
                </label>
                <select
                  id="breed-time-select"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(e.target.value)}
                  className="w-full bg-[#151b13] border border-[#e5dfd3]/15 rounded-lg px-3.5 py-2.5 text-sm text-[#e5dfd3] focus:outline-none focus:border-[#c4a484]"
                >
                  <option value="Morning Alertness (High Pinene/Limonene)">Morning Alertness (High Pinene/Limonene)</option>
                  <option value="Afternoon Flow & Focus (Balanced)">Afternoon Flow & Focus (Balanced)</option>
                  <option value="Twilight / Nighttime (Sedative Myrcene)">Twilight / Nighttime (Sedative Myrcene)</option>
                  <option value="Physical Post-Workout Recovery">Physical Post-Workout Recovery</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[#e5dfd3] uppercase mb-1.5">
                ORGANIC TERROIR & LIVING SOIL NOTES
              </label>
              <textarea
                id="breed-notes-textarea"
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full bg-[#151b13] border border-[#e5dfd3]/15 rounded-lg px-3.5 py-2 text-sm text-[#e5dfd3] focus:outline-none focus:border-[#c4a484]"
              />
            </div>

            <button
              id="submit-breed-btn"
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-3 rounded-lg bg-[#c4a484] text-[#0f120d] font-mono font-semibold text-xs tracking-widest uppercase hover:bg-[#d6bca0] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-[#0f120d]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Synthesizing Genetics & Terpene Pathways…</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span>Generate Artisanal Cultivar</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Generated Cultivar Result Card */}
            <div className="bg-[#151b13] p-5 rounded-xl border border-[#c4a484]/30 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#6f8f5b] tracking-[0.2em] block">
                    NEW ARTISANAL PHENOTYPE
                  </span>
                  <h3 className="font-serif italic text-2xl text-[#e5dfd3] mt-0.5">{generatedStrain.name}</h3>
                </div>
                <div className="bg-[#0f120d] px-3 py-1 rounded text-xs font-mono text-[#c4a484] border border-[#e5dfd3]/10">
                  {generatedStrain.cbdPercent}% CBD · &lt;{generatedStrain.thcPercent}% THC
                </div>
              </div>

              <div className="text-xs text-[#6f8f5b] font-mono">{generatedStrain.tag}</div>
              <p className="text-xs text-[#e5dfd3] leading-relaxed font-light">{generatedStrain.desc}</p>

              {/* Terpenes breakdown */}
              <div className="pt-3 border-t border-[#e5dfd3]/10 flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b9584]">
                  PREDICTED TERPENE FRACTIONS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {generatedStrain.terpenes.map((tp, idx) => (
                    <div key={idx} className="bg-[#0f120d] p-2.5 rounded-lg border border-[#e5dfd3]/10">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#e5dfd3]">{tp.name}</span>
                        <span className="text-[#c4a484]">{tp.percentage}%</span>
                      </div>
                      <span className="text-[10px] text-[#8b9584] leading-tight block mt-1">
                        {tp.note}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botanical Appearance */}
              {generatedStrain.phenotypeAppearance && (
                <div className="text-xs text-[#8b9584] pt-2 border-t border-[#e5dfd3]/10">
                  <strong className="text-[#e5dfd3]">Phenotype:</strong> {generatedStrain.phenotypeAppearance}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                id="simulate-bred-strain-btn"
                type="button"
                onClick={() => {
                  onCultivarBred(generatedStrain, true);
                  onClose();
                }}
                className="py-2.5 px-4 rounded-full bg-[#c4a484] text-[#0f120d] font-mono font-semibold text-xs hover:bg-[#d6bca0] transition-all flex items-center justify-center gap-1.5 shadow tracking-wider"
              >
                <span>Simulate Growth in Canvas</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <button
                id="add-bred-strain-menu-btn"
                type="button"
                onClick={() => {
                  onCultivarBred(generatedStrain, false);
                  onClose();
                }}
                className="py-2.5 px-4 rounded-full bg-[#151b13] border border-[#8b9584]/30 text-[#e5dfd3] font-mono text-xs hover:border-[#c4a484] transition-all flex items-center justify-center gap-1.5 tracking-wider"
              >
                <span>Add to Seasonal Menu</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
