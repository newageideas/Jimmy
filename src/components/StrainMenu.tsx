import React, { useState } from 'react';
import { Strain } from '../types';
import { playSoftClick, playWaterDrop } from '../utils/audio';

interface StrainMenuProps {
  strains: Strain[];
  onUpdateStrains: (strains: Strain[]) => void;
  onSelectForSimulation: (strain: Strain) => void;
  onOpenWhatsAppWithStrain: (strainName: string) => void;
  onOpenAdvisor: () => void;
  onOpenBreeder: () => void;
}

export const StrainMenu: React.FC<StrainMenuProps> = ({
  strains,
  onUpdateStrains,
  onSelectForSimulation,
  onOpenWhatsAppWithStrain,
  onOpenAdvisor,
  onOpenBreeder,
}) => {
  const [editing, setEditing] = useState(false);
  const [rewritingId, setRewritingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'indica' | 'sativa' | 'hybrid'>('all');

  const handleEditToggle = () => {
    playSoftClick();
    setEditing(!editing);
  };

  const handleFieldChange = (idx: number, field: keyof Strain, value: any) => {
    const updated = [...strains];
    updated[idx] = { ...updated[idx], [field]: value };
    onUpdateStrains(updated);
  };

  const handlePhotoUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleFieldChange(idx, 'img', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddStrain = () => {
    playWaterDrop();
    const newStrain: Strain = {
      id: `strain-${Date.now()}`,
      name: 'Central Valley Sunrise',
      tag: 'Hybrid · 18.5% CBD · <0.2% THC',
      desc: 'Living soil organic flower with notes of sweet wild grass, Meyer lemon, and crushed pine. Clean and clear finish.',
      cbdPercent: 18.5,
      thcPercent: 0.15,
      terpenes: [
        { name: 'Myrcene', percentage: 0.95, note: 'Deep body ease' },
        { name: 'Limonene', percentage: 0.65, note: 'Citrus clarity' },
      ],
      aromaNotes: 'Meyer lemon, wild grass, pine',
      isCustom: true,
    };
    onUpdateStrains([...strains, newStrain]);
  };

  const handleRemoveStrain = (idx: number) => {
    playSoftClick();
    const updated = strains.filter((_, i) => i !== idx);
    onUpdateStrains(updated);
  };

  // Gemini AI Honest Description Rewriter
  const handleGeminiRewrite = async (idx: number) => {
    const target = strains[idx];
    setRewritingId(target.id);
    playWaterDrop();

    try {
      const res = await fetch('/api/gemini/rewrite-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: target.name,
          currentDesc: target.desc,
          tag: target.tag,
          style: 'Honest, tactile, artisanal Central Valley living soil perspective',
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.rewrittenDesc) {
        const updated = [...strains];
        updated[idx] = {
          ...updated[idx],
          desc: data.data.rewrittenDesc,
          tag: data.data.suggestedTag || updated[idx].tag,
        };
        onUpdateStrains(updated);
      }
    } catch (err) {
      console.error('Rewrite failed:', err);
    } finally {
      setRewritingId(null);
    }
  };

  const filteredStrains = strains.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'indica') return s.tag.toLowerCase().includes('indica');
    if (filter === 'sativa') return s.tag.toLowerCase().includes('sativa');
    if (filter === 'hybrid') return s.tag.toLowerCase().includes('hybrid');
    return true;
  });

  return (
    <section id="menu" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-[#e5dfd3]/10 pb-8">
        <div className="max-w-2xl text-left">
          <div className="text-[10px] font-mono text-[#c4a484] tracking-[0.3em] uppercase mb-2">
            THE CURRENT HARVEST
          </div>
          <h2 className="font-serif italic text-3xl sm:text-4xl text-[#e5dfd3] leading-tight">
            Artisanal Strains on Hand
          </h2>
          <p className="text-[#8b9584] mt-3 leading-relaxed text-sm sm:text-base font-light">
            Small-batch organic CBD flower grown in Central Valley (209), California. Slow-cured for 30 days in temperature-regulated glass. Tap any strain to load its genetics into the live growth simulator above.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* AI Sommelier Advisor button */}
          <button
            id="open-advisor-btn"
            type="button"
            onClick={() => {
              playSoftClick();
              onOpenAdvisor();
            }}
            className="px-4 py-2 rounded-full bg-[#151b13] text-[#e5dfd3] border border-[#8b9584]/30 hover:border-[#c4a484] text-[10px] tracking-widest uppercase font-mono transition-all flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Strain Advisor</span>
          </button>

          {/* Gemini Breed Cultivar button */}
          <button
            id="open-breeder-btn"
            type="button"
            onClick={() => {
              playSoftClick();
              onOpenBreeder();
            }}
            className="px-4 py-2 rounded-full bg-[#151b13] text-[#c4a484] border border-[#c4a484]/40 hover:bg-[#c4a484] hover:text-[#0f120d] text-[10px] tracking-widest uppercase font-mono transition-all flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Breed AI Cultivar</span>
          </button>

          {/* Owner Edit Menu Toggle */}
          <button
            id="editToggle"
            type="button"
            onClick={handleEditToggle}
            className={`px-4 py-2 rounded-full text-[10px] tracking-widest uppercase font-mono transition-all ${
              editing
                ? 'bg-[#c4a484] text-[#0f120d] font-semibold border border-[#c4a484]'
                : 'bg-transparent border border-[#8b9584]/30 text-[#e5dfd3] hover:border-[#c4a484]'
            }`}
          >
            {editing ? 'Done editing' : 'Edit menu'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        <span className="text-[10px] font-mono tracking-widest text-[#8b9584] mr-2">FILTER:</span>
        {[
          { id: 'all', label: 'All Strains' },
          { id: 'indica', label: 'Indica-leaning' },
          { id: 'sativa', label: 'Sativa-leaning' },
          { id: 'hybrid', label: 'Balanced Hybrids' },
        ].map((f) => (
          <button
            key={f.id}
            id={`filter-tab-${f.id}`}
            type="button"
            onClick={() => {
              playSoftClick();
              setFilter(f.id as any);
            }}
            className={`text-xs font-mono px-3.5 py-1.5 rounded-full border transition-all ${
              filter === f.id
                ? 'bg-[#c4a484]/20 border-[#c4a484] text-[#e5dfd3]'
                : 'bg-[#151b13]/60 border-[#e5dfd3]/10 text-[#8b9584] hover:text-[#e5dfd3]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Strain Cards Grid */}
      <div id="strainGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStrains.map((strain, idx) => {
          const originalIndex = strains.findIndex((s) => s.id === strain.id);
          return (
            <div
              key={strain.id}
              id={`strain-card-${strain.id}`}
              className="group bg-[#151b13] border border-[#e5dfd3]/10 hover:border-[#c4a484]/40 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
            >
              {/* Photo Area */}
              <div
                className="relative aspect-[16/10] bg-[#0f120d] flex items-center justify-center overflow-hidden"
                style={
                  strain.img
                    ? { backgroundImage: `url('${strain.img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : {}
                }
              >
                {!strain.img && (
                  <div className="flex flex-col items-center gap-2 text-[#8b9584] p-4 text-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-xs font-mono">Central Valley Organics</span>
                    <span className="text-[9px] text-[#6f8f5b] uppercase font-mono tracking-[0.2em]">
                      {strain.cbdPercent ? `${strain.cbdPercent}% CBD` : 'High CBD'} · Slow Cured
                    </span>
                  </div>
                )}

                {/* File Upload Overlay in Edit Mode */}
                {editing && (
                  <label className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center cursor-pointer text-xs font-mono text-[#e5dfd3] hover:bg-black/80 transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span>Click to Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(originalIndex, e)}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Potency Badge Overlay */}
                <div className="absolute top-3 left-3 bg-[#0f120d]/85 border border-[#e5dfd3]/10 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-[#6f8f5b] font-semibold">
                  {strain.cbdPercent}% CBD
                </div>

                {/* Simulate in Canvas Button */}
                <button
                  id={`simulate-btn-${strain.id}`}
                  type="button"
                  onClick={() => {
                    playSoftClick();
                    onSelectForSimulation(strain);
                    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#c4a484] text-[#0f120d] text-xs font-mono px-3.5 py-1.5 rounded-full font-semibold flex items-center gap-1 shadow-md hover:bg-[#d6bca0] tracking-wider"
                >
                  <span>Simulate Grow</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Strain Body */}
              <div className="p-6 flex flex-col gap-3 flex-1 text-left">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    contentEditable={editing}
                    suppressContentEditableWarning
                    onBlur={(e) => handleFieldChange(originalIndex, 'name', e.currentTarget.textContent || '')}
                    className={`font-serif italic text-xl text-[#e5dfd3] leading-snug ${
                      editing ? 'outline-dashed outline-1 outline-[#c4a484] p-1 rounded' : ''
                    }`}
                  >
                    {strain.name}
                  </h3>
                </div>

                <div
                  contentEditable={editing}
                  suppressContentEditableWarning
                  onBlur={(e) => handleFieldChange(originalIndex, 'tag', e.currentTarget.textContent || '')}
                  className={`text-[11px] text-[#6f8f5b] font-mono tracking-wide ${
                    editing ? 'outline-dashed outline-1 outline-[#c4a484] p-1 rounded' : ''
                  }`}
                >
                  {strain.tag}
                </div>

                <p
                  contentEditable={editing}
                  suppressContentEditableWarning
                  onBlur={(e) => handleFieldChange(originalIndex, 'desc', e.currentTarget.textContent || '')}
                  className={`text-xs text-[#8b9584] leading-relaxed flex-1 font-light ${
                    editing ? 'outline-dashed outline-1 outline-[#c4a484] p-1 rounded' : ''
                  }`}
                >
                  {strain.desc}
                </p>

                {/* Terpenes Pills */}
                {strain.terpenes && strain.terpenes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#e5dfd3]/10">
                    {strain.terpenes.slice(0, 3).map((terp, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-mono bg-[#0f120d] text-[#e5dfd3]/80 px-2 py-0.5 rounded border border-[#e5dfd3]/10"
                      >
                        {terp.name} {terp.percentage}%
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Action Row */}
                <div className="flex items-center justify-between pt-3 border-t border-[#e5dfd3]/10 gap-2">
                  <button
                    id={`inquire-wa-btn-${strain.id}`}
                    type="button"
                    onClick={() => {
                      playSoftClick();
                      onOpenWhatsAppWithStrain(strain.name);
                    }}
                    className="text-xs font-mono text-[#c4a484] hover:text-[#d6bca0] flex items-center gap-1.5 transition-colors tracking-wider"
                  >
                    <span>Inquire via WhatsApp</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Gemini Rewrite button */}
                  <button
                    id={`gemini-rewrite-btn-${strain.id}`}
                    type="button"
                    onClick={() => handleGeminiRewrite(originalIndex)}
                    disabled={rewritingId === strain.id}
                    title="Rewrite description using Gemini AI"
                    className="text-[11px] font-mono text-[#8b9584] hover:text-[#e5dfd3] p-1 rounded border border-[#e5dfd3]/10 flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <span>{rewritingId === strain.id ? 'Writing…' : 'AI Polish'}</span>
                  </button>
                </div>

                {/* Delete button in Edit Mode */}
                {editing && (
                  <button
                    id={`remove-strain-btn-${strain.id}`}
                    type="button"
                    onClick={() => handleRemoveStrain(originalIndex)}
                    className="text-xs text-[#b5533c] hover:underline self-start mt-2"
                  >
                    Remove strain
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Strain Card in Edit Mode */}
        {editing && (
          <button
            id="add-strain-card-btn"
            type="button"
            onClick={handleAddStrain}
            className="min-h-[280px] border border-dashed border-[#8b9584]/30 rounded-xl flex flex-col items-center justify-center gap-3 text-[#8b9584] hover:border-[#c4a484] hover:text-[#e5dfd3] transition-all bg-[#151b13]/40"
          >
            <div className="w-10 h-10 rounded-full border border-current flex items-center justify-center text-lg">
              +
            </div>
            <span className="font-mono text-xs tracking-wider">Add New Cultivar to Menu</span>
          </button>
        )}
      </div>
    </section>
  );
};
