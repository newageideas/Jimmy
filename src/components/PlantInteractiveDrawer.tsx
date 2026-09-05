import React, { useState, useEffect } from 'react';
import { Strain, GrowthOrigin, LightingMode } from '../types';
import { playSoftClick, playWaterDrop } from '../utils/audio';

interface PlantInteractiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'menu' | 'edit' | 'whatsapp';
  strains: Strain[];
  selectedStrain: Strain;
  onSelectStrain: (strain: Strain) => void;
  growthMode: GrowthOrigin;
  onChangeGrowthMode: (mode: GrowthOrigin) => void;
  onUpdateStrains: (strains: Strain[]) => void;
  onOpenBreeder: () => void;
  onOpenAdvisor: () => void;
  onResetDefaults: () => void;
  // Simulation quick controls
  progress: number;
  onProgressChange: (p: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
  lighting: LightingMode;
  onLightingChange: (light: LightingMode) => void;
  playbackSpeed: number;
  onSpeedChange: (s: number) => void;
}

export const PlantInteractiveDrawer: React.FC<PlantInteractiveDrawerProps> = ({
  isOpen,
  onClose,
  initialTab = 'menu',
  strains,
  selectedStrain,
  onSelectStrain,
  growthMode,
  onChangeGrowthMode,
  onUpdateStrains,
  onOpenBreeder,
  onOpenAdvisor,
  onResetDefaults,
  progress,
  onProgressChange,
  isPlaying,
  onTogglePlay,
  onReplay,
  lighting,
  onLightingChange,
  playbackSpeed,
  onSpeedChange,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'edit' | 'whatsapp'>(initialTab);

  // Synchronize when initialTab changes on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Edit Tab State
  const [editingStrainIndex, setEditingStrainIndex] = useState<number>(0);
  const [editName, setEditName] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCbd, setEditCbd] = useState<number>(18);
  const [editThc, setEditThc] = useState<number>(0.15);
  const [editAroma, setEditAroma] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // WhatsApp Tab State
  const [phone, setPhone] = useState(() => localStorage.getItem('verdant_wa_number') || '12095550192');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [waInput, setWaInput] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'grower'; text: string; time: string }>>([
    {
      sender: 'grower',
      text: "Welcome to notme 209 Botanicals! Are you looking for cured living-soil flower reserve jars or healthy rooted clone cuttings?",
      time: 'Just now',
    },
  ]);
  const [isGrowerTyping, setIsGrowerTyping] = useState(false);

  // Sync edit fields when selected strain or index changes
  useEffect(() => {
    const current = strains[editingStrainIndex] || selectedStrain;
    if (current) {
      setEditName(current.name);
      setEditTag(current.tag);
      setEditDesc(current.desc);
      setEditCbd(current.cbdPercent);
      setEditThc(current.thcPercent);
      setEditAroma(current.aromaNotes);
    }
  }, [editingStrainIndex, strains, selectedStrain]);

  // Listen for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    playWaterDrop();
    const updated = [...strains];
    if (updated[editingStrainIndex]) {
      updated[editingStrainIndex] = {
        ...updated[editingStrainIndex],
        name: editName,
        tag: editTag,
        desc: editDesc,
        cbdPercent: editCbd,
        thcPercent: editThc,
        aromaNotes: editAroma,
      };
      onUpdateStrains(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleAddNewStrain = () => {
    playWaterDrop();
    const newStrain: Strain = {
      id: `clone-${Date.now()}`,
      name: '209 Emerald Reserve Clone',
      tag: 'Clone Cutting · 20.2% CBD · <0.2% THC',
      desc: 'Selected from vigorous mother stock. Fast rooter with notes of sweet Valencia orange, pine resin, and freshly tilled living alluvium.',
      cbdPercent: 20.2,
      thcPercent: 0.18,
      terpenes: [
        { name: 'Myrcene', percentage: 1.1, note: 'Relaxation' },
        { name: 'Caryophyllene', percentage: 0.7, note: 'Spicy woody relief' },
      ],
      aromaNotes: 'Valencia orange, pine resin, damp soil',
      isCustom: true,
    };
    const updated = [newStrain, ...strains];
    onUpdateStrains(updated);
    setEditingStrainIndex(0);
    onSelectStrain(newStrain);
  };

  const handleSendWaMessage = (messageToSend?: string) => {
    const msg = messageToSend || waInput;
    if (!msg.trim()) return;

    playWaterDrop();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [...prev, { sender: 'user', text: msg, time: now }]);
    if (!messageToSend) setWaInput('');

    setIsGrowerTyping(true);
    setTimeout(() => {
      setIsGrowerTyping(false);
      let reply = "Thanks for your message! Our current cold-cured batches are held at 60°F / 62% RH. Would you like a 1oz reserve jar or rooted nursery cuttings?";
      const lower = msg.toLowerCase();
      if (lower.includes('clone') || lower.includes('cutting')) {
        reply = "Our rooted clones are cut at 45° from mother stock and hardened in living soil mycorrhizal plugs. Pickup in 209 California or express farm carrier dispatch available.";
      } else if (lower.includes('coa') || lower.includes('lab') || lower.includes('thc')) {
        reply = "Every harvest is third-party tested via HPLC. All genetics are guaranteed strictly compliant under 0.3% Delta-9 THC with full cannabinoid certificates.";
      } else if (lower.includes('sherbert') || lower.includes('northern') || lower.includes('harlequin')) {
        reply = `Excellent choice! That phenotype is one of our cleanest living soil performers. Monoterpene preservation is exceptional this season.`;
      }

      setChatLog((prev) => [...prev, { sender: 'grower', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 900);
  };

  const cleanPhone = phone.replace(/\D/g, '');
  const waExternalUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello, I'm reaching out from notme 209 regarding the ${selectedStrain.name} flower & clone cuttings.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0f120d] border border-[#e5dfd3]/20 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden z-10 text-left">
        {/* Modal Top Header with 3 Core Requested Sections & Close button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#e5dfd3]/10 px-5 sm:px-8 py-4 bg-[#141a12]/90 gap-4">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#170c24] border border-purple-500/50 flex items-center justify-center text-[#c084fc] font-mono text-xs font-bold shadow-inner">
              209
            </div>
            <div>
              <div className="font-serif italic text-lg text-[#e5dfd3] leading-none">notme 209 Interactive Console</div>
              <div className="text-[10px] font-mono text-[#8b9584] mt-0.5 tracking-wider">
                CURRENT PHENOTYPE: <span className="text-[#c4a484] font-semibold">{selectedStrain.name}</span>
              </div>
            </div>
          </div>

          {/* Center Tabs: Menu Options | Edit Buttons | WhatsApp Contact */}
          <div className="flex items-center bg-[#0b0e09] p-1 rounded-full border border-[#e5dfd3]/15 self-start sm:self-center">
            {/* Tab 1: Menu Options */}
            <button
              id="drawer-tab-menu"
              type="button"
              onClick={() => {
                playSoftClick();
                setActiveTab('menu');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-[#c4a484] text-[#0f120d] font-semibold shadow-md'
                  : 'text-[#8b9584] hover:text-[#e5dfd3]'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Menu Options</span>
            </button>

            {/* Tab 2: Edit Buttons */}
            <button
              id="drawer-tab-edit"
              type="button"
              onClick={() => {
                playSoftClick();
                setActiveTab('edit');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-[#c4a484] text-[#0f120d] font-semibold shadow-md'
                  : 'text-[#8b9584] hover:text-[#e5dfd3]'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit Buttons</span>
            </button>

            {/* Tab 3: WhatsApp Contact */}
            <button
              id="drawer-tab-whatsapp"
              type="button"
              onClick={() => {
                playSoftClick();
                setActiveTab('whatsapp');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-[#25d366] text-[#0b140e] font-semibold shadow-md'
                  : 'text-[#8b9584] hover:text-[#e5dfd3]'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
              </svg>
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Close button */}
          <button
            id="close-drawer-btn"
            type="button"
            onClick={() => {
              playSoftClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#1c2419] hover:bg-[#253121] border border-[#e5dfd3]/15 text-[#8b9584] hover:text-[#e5dfd3] flex items-center justify-center transition-colors cursor-pointer text-sm font-mono self-end sm:self-center"
            title="Return to clean visual canvas"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {/* ========================================================================= */}
          {/* 1. MENU OPTIONS TAB                                                       */}
          {/* ========================================================================= */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              {/* Seed vs Clone Botanical Origin Mode Selector */}
              <div className="bg-[#151b13] p-4 sm:p-5 rounded-2xl border border-[#e5dfd3]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-[#c4a484] tracking-[0.25em] uppercase block mb-1">
                    GROWTH ORIGIN MODE
                  </span>
                  <div className="font-serif italic text-lg text-[#e5dfd3]">
                    {growthMode === 'clone' ? 'Rooted Clone Cutting' : 'Seed Germination & Radicle'}
                  </div>
                  <p className="text-xs text-[#8b9584] font-light max-w-md mt-0.5">
                    {growthMode === 'clone'
                      ? 'Simulates a 45° angle nursery cutting in living soil with adventitious white root network and bushy node architecture.'
                      : 'Simulates taproot emerging through cracked pericarp, cotyledon unfolding, and progressive palmate fan leaves.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#0f120d] p-1.5 rounded-full border border-[#e5dfd3]/15">
                  <button
                    type="button"
                    onClick={() => {
                      playSoftClick();
                      onChangeGrowthMode('seed');
                      onReplay();
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      growthMode === 'seed'
                        ? 'bg-[#c4a484] text-[#0f120d] font-semibold shadow-sm'
                        : 'text-[#8b9584] hover:text-[#e5dfd3]'
                    }`}
                  >
                    🌱 Seed to Plant
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSoftClick();
                      onChangeGrowthMode('clone');
                      onReplay();
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      growthMode === 'clone'
                        ? 'bg-[#6f8f5b] text-[#0f120d] font-semibold shadow-sm'
                        : 'text-[#8b9584] hover:text-[#e5dfd3]'
                    }`}
                  >
                    🌿 Clone to Plant
                  </button>
                </div>
              </div>

              {/* Strains & Cultivars Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-[#c4a484] tracking-widest uppercase">
                    SELECT ARTISANAL GENETICS TO GROW
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playSoftClick();
                      onOpenAdvisor();
                    }}
                    className="text-xs font-mono text-[#c4a484] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>✨ AI Sommelier Advice</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {strains.map((strain) => {
                    const isSelected = strain.id === selectedStrain.id;
                    return (
                      <div
                        key={strain.id}
                        onClick={() => {
                          playWaterDrop();
                          onSelectStrain(strain);
                        }}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#1a2317] border-[#c4a484] shadow-lg ring-1 ring-[#c4a484]/40'
                            : 'bg-[#151b13] border-[#e5dfd3]/10 hover:border-[#c4a484]/40 hover:bg-[#182016]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif italic text-lg text-[#e5dfd3]">{strain.name}</h4>
                              {isSelected && (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#c4a484] text-[#0f120d] font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-[#8b9584] mt-0.5">{strain.tag}</div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-[#c4a484]">{strain.cbdPercent}% CBD</span>
                            <div className="text-[9px] font-mono text-[#8b9584]">&lt;{strain.thcPercent}% THC</div>
                          </div>
                        </div>

                        <p className="text-xs text-[#8b9584] font-light line-clamp-2 leading-relaxed">
                          {strain.desc}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-[#e5dfd3]/10 text-[10px] font-mono">
                          <span className="text-[#8b9584] truncate max-w-[180px]">
                            Aroma: <strong className="text-[#e5dfd3] font-normal">{strain.aromaNotes}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playWaterDrop();
                              onSelectStrain(strain);
                              onReplay();
                              onClose();
                            }}
                            className="text-[#c4a484] hover:text-[#e5dfd3] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Simulate Live</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fast Interactive Plant Simulation Controls */}
              <div className="bg-[#151b13] p-4 sm:p-5 rounded-2xl border border-[#e5dfd3]/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#c4a484] tracking-[0.25em] uppercase">
                    CANVAS GROWTH CONTROLS
                  </span>
                  <span className="text-xs font-mono text-[#8b9584]">
                    Progress: <strong className="text-[#e5dfd3]">{(progress * 100).toFixed(0)}%</strong>
                  </span>
                </div>

                {/* Timeline Scrubber */}
                <input
                  id="drawer-growth-scrubber"
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={progress}
                  onChange={(e) => onProgressChange(parseFloat(e.target.value))}
                  className="w-full accent-[#c4a484] cursor-pointer"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playWaterDrop();
                        onTogglePlay();
                      }}
                      className="px-3 py-1 rounded-full bg-[#c4a484] text-[#0f120d] font-mono text-xs font-semibold hover:bg-[#d6bca0] transition-colors cursor-pointer"
                    >
                      {isPlaying ? 'PAUSE' : 'PLAY'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playWaterDrop();
                        onReplay();
                      }}
                      className="px-3 py-1 rounded-full border border-[#c4a484]/40 text-[#c4a484] hover:bg-[#c4a484]/15 font-mono text-xs transition-colors cursor-pointer"
                    >
                      Restart Cycle
                    </button>
                  </div>

                  {/* Lighting Mode Selector */}
                  <div className="flex items-center gap-1 bg-[#0f120d] p-1 rounded-full border border-[#e5dfd3]/15 text-[10px] font-mono">
                    <span className="text-[#8b9584] px-1.5">Light:</span>
                    {[
                      { id: 'golden', label: 'Golden' },
                      { id: 'daylight', label: 'Daylight' },
                      { id: 'grow_led', label: 'LED' },
                      { id: 'macro_dark', label: 'Spotlight' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          playSoftClick();
                          onLightingChange(l.id as LightingMode);
                        }}
                        className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                          lighting === l.id ? 'bg-[#c4a484] text-[#0f120d] font-bold' : 'text-[#8b9584] hover:text-[#e5dfd3]'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. EDIT BUTTONS & GENETICS TAB                                            */}
          {/* ========================================================================= */}
          {activeTab === 'edit' && (
            <div className="space-y-6">
              {/* Top Edit Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151b13] p-4 rounded-2xl border border-[#e5dfd3]/10">
                <div>
                  <span className="text-[10px] font-mono text-[#c4a484] tracking-[0.25em] uppercase block mb-1">
                    CULTIVAR & CLONE EDIT SUITE
                  </span>
                  <div className="font-serif italic text-base text-[#e5dfd3]">
                    Modify Genetics, Potency & Living Soil Terpenes
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewStrain}
                    className="px-3 py-1.5 rounded-full bg-[#c4a484]/15 border border-[#c4a484]/40 text-[#c4a484] hover:bg-[#c4a484] hover:text-[#0f120d] text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <span>+ Add New Clone Cut</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSoftClick();
                      onOpenBreeder();
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#6f8f5b]/20 border border-[#6f8f5b]/40 text-[#9fbb84] hover:bg-[#6f8f5b] hover:text-[#0f120d] text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <span>🧬 Breed with Gemini AI</span>
                  </button>
                </div>
              </div>

              {/* Strain Selector for Editing */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-[11px] font-mono text-[#8b9584] whitespace-nowrap">Edit Strain:</span>
                {strains.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      playSoftClick();
                      setEditingStrainIndex(idx);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                      editingStrainIndex === idx
                        ? 'bg-[#c4a484] text-[#0f120d] font-bold'
                        : 'bg-[#151b13] border border-[#e5dfd3]/10 text-[#8b9584] hover:text-[#e5dfd3]'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              {/* Interactive Edit Form */}
              <form onSubmit={handleSaveEdit} className="bg-[#151b13] p-5 sm:p-6 rounded-2xl border border-[#e5dfd3]/15 space-y-4">
                {saveSuccess && (
                  <div className="p-3 rounded-xl bg-[#6f8f5b]/20 border border-[#6f8f5b] text-[#9fbb84] text-xs font-mono flex items-center gap-2">
                    <span>✓ Strain profile and cannabinoid values updated in living soil database!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-[#8b9584] uppercase tracking-wider block mb-1">
                      Strain / Clone Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#0f120d] border border-[#e5dfd3]/20 rounded-xl px-3 py-2 text-sm text-[#e5dfd3] font-serif focus:outline-none focus:border-[#c4a484]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#8b9584] uppercase tracking-wider block mb-1">
                      Phenotype Classification / Lineage
                    </label>
                    <input
                      type="text"
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                      className="w-full bg-[#0f120d] border border-[#e5dfd3]/20 rounded-xl px-3 py-2 text-xs text-[#e5dfd3] font-mono focus:outline-none focus:border-[#c4a484]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-[#8b9584] uppercase tracking-wider block mb-1">
                      CBD Potency Percentage (%): <strong className="text-[#c4a484]">{editCbd}%</strong>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="0.1"
                      value={editCbd}
                      onChange={(e) => setEditCbd(parseFloat(e.target.value))}
                      className="w-full accent-[#c4a484] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#8b9584] uppercase tracking-wider block mb-1">
                      THC Content (&lt;0.3% Farm Bill Compliant): <strong className="text-[#e5dfd3]">{editThc}%</strong>
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.29"
                      step="0.01"
                      value={editThc}
                      onChange={(e) => setEditThc(parseFloat(e.target.value))}
                      className="w-full accent-[#e5dfd3] cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#8b9584] uppercase tracking-wider block mb-1">
                    Aroma & Terpene Descriptor
                  </label>
                  <input
                    type="text"
                    value={editAroma}
                    onChange={(e) => setEditAroma(e.target.value)}
                    className="w-full bg-[#0f120d] border border-[#e5dfd3]/20 rounded-xl px-3 py-2 text-xs text-[#e5dfd3] font-mono focus:outline-none focus:border-[#c4a484]"
                    placeholder="e.g. Meyer lemon, wild berries, damp forest alluvium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#8b9584] uppercase tracking-wider block mb-1">
                    Cultivation & Cure Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-[#0f120d] border border-[#e5dfd3]/20 rounded-xl px-3 py-2 text-xs text-[#8b9584] font-light leading-relaxed focus:outline-none focus:border-[#c4a484]"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#e5dfd3]/10">
                  <button
                    type="button"
                    onClick={() => {
                      playSoftClick();
                      onResetDefaults();
                    }}
                    className="text-xs font-mono text-[#8b9584] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    ↺ Reset All Strains to Defaults
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#c4a484] text-[#0f120d] font-mono text-xs font-bold hover:bg-[#d6bca0] transition-colors shadow-md cursor-pointer"
                  >
                    Save Strain Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. WHATSAPP CONTACT TAB                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              {/* WhatsApp Direct Hotline Banner */}
              <div className="bg-[#121c14] border border-[#25d366]/40 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#25d366] text-[#0b140e] flex items-center justify-center shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#25d366] tracking-[0.25em] uppercase flex items-center gap-1.5 font-semibold">
                      <span>OFFICIAL FARM WHATSAPP HOTLINE</span>
                      <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse" />
                    </div>
                    <div className="font-mono text-xl sm:text-2xl text-[#e5dfd3] font-semibold tracking-tight mt-0.5">
                      +1 (209) 555-0192
                    </div>
                    <p className="text-xs text-[#8b9584] font-light mt-0.5">
                      Direct contact with Central Valley 209 Farm HQ
                    </p>
                  </div>
                </div>

                <a
                  id="open-external-wa-btn"
                  href={waExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-[#25d366] hover:bg-[#20b858] text-[#0b140e] font-mono text-xs font-bold transition-all shadow-md flex items-center gap-2 tracking-wider self-start sm:self-center cursor-pointer active:scale-95"
                >
                  <span>Launch WhatsApp Direct</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>

              {/* Fast Message Starters */}
              <div>
                <span className="text-[10px] font-mono text-[#8b9584] tracking-widest uppercase block mb-2">
                  TAP A COMMON INQUIRY FOR WHATSAPP:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    `Reserve 1oz cold-cured jar of ${selectedStrain.name}`,
                    `Inquire about rooted clone cuttings of ${selectedStrain.name}`,
                    `Request HPLC laboratory Certificate of Analysis (COA)`,
                    `Ask about living soil compost tea feedings`,
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendWaMessage(preset)}
                      className="px-3 py-1.5 rounded-full bg-[#151b13] hover:bg-[#1a2318] border border-[#e5dfd3]/10 hover:border-[#25d366]/40 text-xs font-mono text-[#8b9584] hover:text-[#e5dfd3] transition-all cursor-pointer"
                    >
                      💬 {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive In-App WhatsApp Chat Simulator */}
              <div className="bg-[#121611] border border-[#e5dfd3]/15 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[280px]">
                {/* Chat header */}
                <div className="bg-[#161d15] px-4 py-2.5 border-b border-[#e5dfd3]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-[#170c24] border border-purple-500/50 flex items-center justify-center text-[#c084fc] font-mono text-[10px] font-bold">
                        209
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25d366] ring-2 ring-[#0f120d]" />
                    </div>
                    <div>
                      <div className="text-xs font-serif italic text-[#e5dfd3]">notme 209 · Cultivation Office</div>
                      <div className="text-[9px] font-mono text-[#25d366]">Online · 209 Farm HQ</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#8b9584]">End-to-End Encrypted</span>
                </div>

                {/* Chat message stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatLog.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          item.sender === 'user'
                            ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                            : 'bg-[#202c33] text-[#d1d7db] rounded-tl-none font-light'
                        }`}
                      >
                        {item.text}
                      </div>
                      <span className="text-[9px] font-mono text-[#8b9584]/60 mt-0.5 px-1">{item.time}</span>
                    </div>
                  ))}

                  {isGrowerTyping && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#25d366] pl-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-bounce delay-200" />
                      <span className="ml-1">Cultivator is typing...</span>
                    </div>
                  )}
                </div>

                {/* Chat message input */}
                <div className="p-2.5 bg-[#161d15] border-t border-[#e5dfd3]/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={waInput}
                    onChange={(e) => setWaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendWaMessage();
                      }
                    }}
                    placeholder="Type a message for WhatsApp..."
                    className="flex-1 bg-[#0b0e0a] border border-[#e5dfd3]/15 rounded-full px-4 py-2 text-xs text-[#e5dfd3] focus:outline-none focus:border-[#25d366]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendWaMessage()}
                    className="w-8 h-8 rounded-full bg-[#25d366] text-[#0b140e] flex items-center justify-center font-bold hover:bg-[#20b858] transition-colors cursor-pointer"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
