import React, { useState } from 'react';
import { Strain } from '../types';
import { playWaterDrop, playTrichomeChime, playSoftClick } from '../utils/audio';

interface GeminiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  strains: Strain[];
  onSelectRecommendedStrain: (strain: Strain) => void;
  onOpenWhatsApp: (msg: string) => void;
}

export const GeminiAdvisorModal: React.FC<GeminiAdvisorModalProps> = ({
  isOpen,
  onClose,
  strains,
  onSelectRecommendedStrain,
  onOpenWhatsApp,
}) => {
  const [need, setNeed] = useState('Somatic tension in neck and shoulders after deep focus, need evening relaxation without grogginess');
  const [timeOfDay, setTimeOfDay] = useState('Evening');
  const [ritual, setRitual] = useState('Dry herb convection vaporization or glass pipe');
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGetAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAdvice(null);
    playWaterDrop();

    try {
      const res = await fetch('/api/gemini/strain-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          need,
          timeOfDay,
          ritual,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAdvice(json.data);
        playTrichomeChime();
      }
    } catch (err) {
      console.error('Advisor error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const matchedStrain = strains.find(
    (s) => advice && advice.strainMatch && s.name.toLowerCase().includes(advice.strainMatch.toLowerCase().split(' ')[0])
  ) || strains[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        id="gemini-advisor-modal"
        className="bg-[#0f120d] border border-[#e5dfd3]/15 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 text-left shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          id="close-advisor-modal-btn"
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

        <div className="mb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#c4a484] tracking-[0.3em] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#c4a484] animate-pulse" />
            <span>GEMINI 3.8 FLASH · BOTANICAL STRAIN SOMMELIER</span>
          </div>
          <h2 className="font-serif italic text-2xl md:text-3xl text-[#e5dfd3]">
            Personalized Flower Pairing
          </h2>
          <p className="text-xs md:text-sm text-[#8b9584] mt-1.5 leading-relaxed font-light">
            Tell us how you are feeling or the ritual you are planning. We analyze terpene boiling points, cannabinoid ratios, and living soil genetics to pair you with the right artisanal flower.
          </p>
        </div>

        {!advice ? (
          <form onSubmit={handleGetAdvice} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[#e5dfd3] uppercase mb-1.5">
                WHAT ARE YOU HOPING TO EXPERIENCE OR SOOTHE?
              </label>
              <textarea
                id="advisor-need-textarea"
                rows={3}
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                required
                className="w-full bg-[#151b13] border border-[#e5dfd3]/15 rounded-lg px-3.5 py-2.5 text-sm text-[#e5dfd3] focus:outline-none focus:border-[#c4a484]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#e5dfd3] uppercase mb-1.5">
                  TIME OF DAY
                </label>
                <select
                  id="advisor-time-select"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full bg-[#151b13] border border-[#e5dfd3]/15 rounded-lg px-3.5 py-2 text-sm text-[#e5dfd3] focus:outline-none focus:border-[#c4a484]"
                >
                  <option value="Morning / Dawn">Morning / Dawn (Clear focus)</option>
                  <option value="Midday / Afternoon">Midday / Afternoon (Flow state)</option>
                  <option value="Twilight / Sunset">Twilight / Sunset (Winding down)</option>
                  <option value="Nighttime / Pre-bed">Nighttime / Pre-bed (Deep physical rest)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#e5dfd3] uppercase mb-1.5">
                  PREFERRED RITUAL
                </label>
                <input
                  id="advisor-ritual-input"
                  type="text"
                  value={ritual}
                  onChange={(e) => setRitual(e.target.value)}
                  className="w-full bg-[#151b13] border border-[#e5dfd3]/15 rounded-lg px-3.5 py-2 text-sm text-[#e5dfd3] focus:outline-none focus:border-[#c4a484]"
                />
              </div>
            </div>

            <button
              id="submit-advisor-btn"
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
                  <span>Analyzing Terpenes & Terroir…</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>Consult Botanical Sommelier</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-[#151b13] p-5 rounded-xl border border-[#c4a484]/30 flex flex-col gap-3">
              <span className="text-[10px] font-mono uppercase text-[#6f8f5b] tracking-[0.2em] block">
                RECOMMENDED TERPENE HARMONY
              </span>
              <h3 className="font-serif italic text-2xl text-[#e5dfd3]">{advice.recommendedProfile}</h3>
              <p className="text-xs text-[#e5dfd3] leading-relaxed font-light">{advice.reasoning}</p>

              {/* Matched strain highlight */}
              <div className="bg-[#0f120d] p-3 rounded-lg border border-[#e5dfd3]/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8b9584] font-mono tracking-wider block">SUGGESTED CULTIVAR</span>
                  <strong className="text-sm font-serif italic text-[#c4a484]">{advice.strainMatch}</strong>
                </div>
                <button
                  id="advisor-select-strain-btn"
                  type="button"
                  onClick={() => {
                    onSelectRecommendedStrain(matchedStrain);
                    onClose();
                  }}
                  className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-[#c4a484] text-[#0f120d] font-semibold hover:bg-[#d6bca0] tracking-wider"
                >
                  Load in Growth Canvas
                </button>
              </div>

              {/* Vaporizer & Ritual tips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-[#0f120d] p-3 rounded-lg border border-[#e5dfd3]/10">
                  <span className="text-[10px] text-[#8b9584] font-mono tracking-wider block">VAPORIZER TEMP</span>
                  <span className="text-[#e5dfd3] font-mono font-medium">{advice.vaporizerTemp}</span>
                </div>
                <div className="bg-[#0f120d] p-3 rounded-lg border border-[#e5dfd3]/10">
                  <span className="text-[10px] text-[#8b9584] font-mono tracking-wider block">TERPENES TO TARGET</span>
                  <span className="text-[#c4a484] font-mono">
                    {advice.terpenesToLookFor ? advice.terpenesToLookFor.join(', ') : 'Myrcene, Caryophyllene'}
                  </span>
                </div>
              </div>

              {advice.pairingRitual && (
                <div className="text-xs text-[#8b9584] italic font-serif pt-1 border-t border-[#e5dfd3]/10">
                  " {advice.pairingRitual} "
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                id="advisor-wa-inquire-btn"
                type="button"
                onClick={() => {
                  onOpenWhatsApp(`Hi notme 209! I used your botanical advisor and it suggested ${advice.strainMatch} for ${need}. Do you have fresh jars in stock?`);
                  onClose();
                }}
                className="w-full py-2.5 rounded-full bg-[#25d366] text-[#0b140e] font-mono font-semibold text-xs hover:bg-[#20ba59] transition-all flex items-center justify-center gap-2 tracking-wider"
              >
                <span>Ask Grower About This on WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
