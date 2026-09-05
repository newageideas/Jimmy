import React, { useState, useRef } from 'react';
import { Strain } from '../types';
import { playSoftClick, playWaterDrop } from '../utils/audio';

interface VisualCloneMenuProps {
  isOpen: boolean;
  onClose: () => void;
  strains: Strain[];
  selectedStrain: Strain;
  onSelectStrain: (strain: Strain) => void;
  onUpdateStrains: (strains: Strain[]) => void;
}

// Preset botanical photo gallery with green & purple hues
const BOTANICAL_PRESETS = [
  {
    name: 'Green & Light Purple Cola',
    url: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Frosty Emerald & Lavender',
    url: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Electric Amber & Lime',
    url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Purple Sugar Frost Nug',
    url: 'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Living Soil Clone Cutting',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Trichome Crystal Canopy',
    url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
  },
];

export const VisualCloneMenu: React.FC<VisualCloneMenuProps> = ({
  isOpen,
  onClose,
  strains,
  selectedStrain,
  onSelectStrain,
  onUpdateStrains,
}) => {
  // State for image editing modal
  const [editingImageStrainId, setEditingImageStrainId] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State for name editing
  const [editingNameStrainId, setEditingNameStrainId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  if (!isOpen) return null;

  // Handle image upload from computer / camera
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, strainId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playWaterDrop();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const updated = strains.map((s) => (s.id === strainId ? { ...s, img: dataUrl } : s));
        onUpdateStrains(updated);
        setEditingImageStrainId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save image by preset or URL
  const handleSaveImageUrl = (strainId: string, url: string) => {
    if (!url.trim()) return;
    playWaterDrop();
    const updated = strains.map((s) => (s.id === strainId ? { ...s, img: url.trim() } : s));
    onUpdateStrains(updated);
    setEditingImageStrainId(null);
    setCustomImageUrl('');
  };

  // Save name edit
  const handleSaveName = (strainId: string) => {
    if (!tempName.trim()) {
      setEditingNameStrainId(null);
      return;
    }
    playWaterDrop();
    const updated = strains.map((s) => (s.id === strainId ? { ...s, name: tempName.trim() } : s));
    onUpdateStrains(updated);
    setEditingNameStrainId(null);
  };

  // Add a new clone
  const handleAddNewClone = () => {
    playWaterDrop();
    const newClone: Strain = {
      id: `clone-${Date.now()}`,
      name: 'New Living Soil Clone',
      tag: 'Clone Cutting',
      desc: '',
      img: BOTANICAL_PRESETS[0].url,
      cbdPercent: 19.5,
      thcPercent: 0.15,
      terpenes: [],
      aromaNotes: '',
    };
    const updated = [...strains, newClone];
    onUpdateStrains(updated);
    onSelectStrain(newClone);
    setEditingNameStrainId(newClone.id);
    setTempName(newClone.name);
  };

  const strainBeingImageEdited = strains.find((s) => s.id === editingImageStrainId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Visual Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0f120d] border border-[#e5dfd3]/20 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden z-10 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5dfd3]/10 px-6 py-4 bg-[#141a12]/90">
          <div className="flex items-center gap-3">
            <h2 className="font-serif italic text-2xl text-[#e5dfd3] tracking-tight">
              Clones
            </h2>
            <span className="text-[11px] font-mono text-[#c4a484] px-2.5 py-0.5 rounded-full bg-[#1e271a] border border-[#c4a484]/30">
              {strains.length} Clones
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* WhatsApp Contact button */}
            <a
              href="https://wa.me/12095550192?text=Hello,%20I'm%20interested%20in%20your%20rooted%20clones."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-[#25d366]/20 hover:bg-[#25d366] text-[#25d366] hover:text-[#0b140e] border border-[#25d366]/40 transition-all font-medium"
              title="Chat on WhatsApp"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                playSoftClick();
                onClose();
              }}
              className="p-1.5 rounded-full text-[#8b9584] hover:text-[#e5dfd3] hover:bg-[#1a2217] transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Visual Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
            {strains.map((strain) => {
              const isSelected = strain.id === selectedStrain.id;
              const isEditingName = editingNameStrainId === strain.id;

              return (
                <div
                  key={strain.id}
                  className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 bg-[#141b12] flex flex-col ${
                    isSelected
                      ? 'border-[#ba8ec8] ring-1 ring-[#ba8ec8]/50 shadow-[0_0_25px_rgba(186,142,200,0.2)]'
                      : 'border-[#e5dfd3]/15 hover:border-[#6f8f5b]'
                  }`}
                >
                  {/* Visual Image Banner - Clickable to Select */}
                  <div
                    onClick={() => {
                      playWaterDrop();
                      onSelectStrain(strain);
                      onClose();
                    }}
                    className="relative w-full h-56 sm:h-60 overflow-hidden cursor-pointer bg-[#0b0f0a]"
                  >
                    <img
                      src={strain.img || BOTANICAL_PRESETS[0].url}
                      alt={strain.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141b12] via-transparent to-black/30" />

                    {/* Active Indicator Badge */}
                    {isSelected && (
                      <div className="absolute top-3 left-3 bg-[#ba8ec8] text-[#0f120d] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0f120d] animate-ping" />
                        Active Clone
                      </div>
                    )}

                    {/* Click prompt overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 pointer-events-none">
                      <span className="text-xs font-mono tracking-wider text-[#e5dfd3] bg-[#0f120d]/80 px-3 py-1.5 rounded-full border border-[#e5dfd3]/20">
                        CLICK TO SIMULATE GROWTH
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Name & Edit Buttons */}
                  <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                    {/* Name Display or Inline Edit */}
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName(strain.id);
                            if (e.key === 'Escape') setEditingNameStrainId(null);
                          }}
                          autoFocus
                          className="flex-1 bg-[#0f120d] border border-[#ba8ec8] rounded-lg px-3 py-1 text-sm font-serif text-[#e5dfd3] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveName(strain.id)}
                          className="px-3 py-1 rounded-lg bg-[#ba8ec8] text-[#0f120d] text-xs font-mono font-medium hover:bg-[#caa2d9] cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <h3
                          onClick={() => {
                            playWaterDrop();
                            onSelectStrain(strain);
                            onClose();
                          }}
                          className="font-serif italic text-lg sm:text-xl text-[#e5dfd3] hover:text-[#ba8ec8] transition-colors cursor-pointer"
                        >
                          {strain.name}
                        </h3>
                      </div>
                    )}

                    {/* The 2 Requested Edit Buttons: Edit Image & Edit Name */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#e5dfd3]/10">
                      {/* Edit Image Button */}
                      <button
                        type="button"
                        onClick={() => {
                          playSoftClick();
                          setEditingImageStrainId(strain.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1b2518] hover:bg-[#22301f] text-[#c4a484] hover:text-[#e5dfd3] border border-[#e5dfd3]/15 transition-all text-xs font-mono cursor-pointer"
                        title="Change or upload image"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>Edit Image</span>
                      </button>

                      {/* Edit Name Button */}
                      <button
                        type="button"
                        onClick={() => {
                          playSoftClick();
                          setEditingNameStrainId(strain.id);
                          setTempName(strain.name);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1b2518] hover:bg-[#22301f] text-[#ba8ec8] hover:text-[#e5dfd3] border border-[#e5dfd3]/15 transition-all text-xs font-mono cursor-pointer"
                        title="Rename clone"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit Name</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Clone Button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleAddNewClone}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1b2518] hover:bg-[#253521] text-[#e5dfd3] border border-[#e5dfd3]/20 hover:border-[#ba8ec8] text-xs font-mono transition-all cursor-pointer shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add New Clone</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Editor Modal / Picker */}
      {editingImageStrainId && strainBeingImageEdited && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0f120d] border border-[#e5dfd3]/25 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-[#e5dfd3]/10 pb-3">
              <h3 className="font-serif italic text-xl text-[#e5dfd3]">
                Edit Image: {strainBeingImageEdited.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingImageStrainId(null)}
                className="text-[#8b9584] hover:text-[#e5dfd3] cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Option 1: Upload from device */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-[#c4a484] uppercase tracking-wider">
                Upload from Computer / Phone
              </span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, editingImageStrainId)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-[#ba8ec8]/50 hover:border-[#ba8ec8] bg-[#141b12] text-xs font-mono text-[#e5dfd3] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Select Image File</span>
              </button>
            </div>

            {/* Option 2: Curated Botanical Presets */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-[#c4a484] uppercase tracking-wider">
                Or Select High-Res Preset
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BOTANICAL_PRESETS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSaveImageUrl(editingImageStrainId, preset.url)}
                    className="relative rounded-lg overflow-hidden h-20 border border-[#e5dfd3]/15 hover:border-[#ba8ec8] cursor-pointer group transition-all"
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
                    <span className="absolute bottom-1 inset-x-1 text-[9px] font-mono text-[#e5dfd3] truncate bg-black/70 px-1 rounded">
                      {preset.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Option 3: Image URL input */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#e5dfd3]/10">
              <span className="text-xs font-mono text-[#8b9584] uppercase tracking-wider">
                Or Paste Image Web Link
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/flower.jpg"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 bg-[#141b12] border border-[#e5dfd3]/20 rounded-xl px-3 py-2 text-xs font-mono text-[#e5dfd3] focus:outline-none focus:border-[#ba8ec8]"
                />
                <button
                  type="button"
                  onClick={() => handleSaveImageUrl(editingImageStrainId, customImageUrl)}
                  className="px-4 py-2 rounded-xl bg-[#ba8ec8] text-[#0f120d] text-xs font-mono font-medium hover:bg-[#caa2d9] cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
